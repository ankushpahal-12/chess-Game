"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = void 0;
const gameService_1 = require("../services/gameService");
const Game_1 = require("../models/Game");
const chess_js_1 = require("chess.js");
const session_1 = require("../utils/session");
const timerRegistry_1 = require("./timerRegistry");
const expirySweep_1 = require("../jobs/expirySweep");
const mongoose_1 = __importDefault(require("mongoose"));
/** Returns true only when mongoose has an open connection to Atlas. */
const isDbConnected = () => mongoose_1.default.connection.readyState === 1;
/** Rate-limit error log output — at most once per 30 s per label. */
const lastErrorLog = {};
const throttledError = (label, err) => {
    const now = Date.now();
    if (!lastErrorLog[label] || now - lastErrorLog[label] > 30_000) {
        lastErrorLog[label] = now;
        console.error(label, err.message ?? err);
    }
};
const chatLimits = new Map();
const setupSocket = (io) => {
    // Initialize background sweep job for lobby & join request timeouts
    (0, expirySweep_1.startExpirySweep)(io);
    // Parse token on connection handshake if provided
    io.on('connection', (socket) => {
        const handshakeToken = socket.handshake.auth.token;
        if (handshakeToken) {
            const payload = (0, session_1.verifySessionToken)(handshakeToken);
            if (payload) {
                socket.data.session = payload;
            }
        }
        console.log(`Socket connected: ${socket.id} (authenticated: ${!!socket.data.session})`);
        // 1. Create Game
        socket.on('create_game', async ({ nickname, timeControl }) => {
            try {
                const { game, token } = await gameService_1.GameService.createGame(socket.id, nickname, timeControl);
                socket.data.session = (0, session_1.verifySessionToken)(token);
                socket.join(game.code);
                socket.emit('game_created', {
                    code: game.code,
                    token,
                    gameId: game._id,
                    playerId: socket.data.session?.playerId
                });
                console.log(`Game created: ${game.code} by Host: ${nickname}`);
            }
            catch (err) {
                socket.emit('error_message', { message: err.message || 'Failed to create game' });
            }
        });
        // 2. Join Request (Guest)
        socket.on('join_request', async ({ code, nickname }) => {
            try {
                const upperCode = code.toUpperCase();
                const { game, playerId } = await gameService_1.GameService.submitJoinRequest(upperCode, nickname, socket.id);
                socket.join(upperCode);
                // Notify the host socket of the guest request
                io.to(game.hostSocketId).emit('join_request_received', {
                    guestSocketId: socket.id,
                    nickname
                });
                console.log(`Join request sent from guest ${nickname} (${socket.id}) to host in room ${upperCode}`);
            }
            catch (err) {
                socket.emit('error_message', { message: err.message || 'Failed to request join' });
            }
        });
        // 3. Respond Join (Host accepts or declines guest)
        socket.on('respond_join', async ({ code, guestSocketId, accept }) => {
            try {
                const upperCode = code.toUpperCase();
                const game = await Game_1.Game.findOne({ code: upperCode });
                if (!game) {
                    throw new Error('Game lobby not found');
                }
                // Host validation
                if (game.hostSocketId !== socket.id) {
                    throw new Error('Unauthorized: Only the host can respond to join requests');
                }
                if (!accept) {
                    // Reject guest
                    io.to(guestSocketId).emit('join_rejected', { message: 'The host rejected your join request.' });
                    const guestSocket = io.sockets.sockets.get(guestSocketId);
                    if (guestSocket) {
                        guestSocket.leave(upperCode);
                    }
                    // Reset status back to WAITING
                    await gameService_1.GameService.withRetry(async () => {
                        const fresh = await Game_1.Game.findById(game._id);
                        if (fresh) {
                            await gameService_1.GameService.atomicUpdate(fresh.id, fresh.version, {
                                status: 'WAITING',
                                $unset: { pendingRequest: 1 }
                            });
                        }
                    });
                    console.log(`Host rejected join request for guest ${guestSocketId} in room ${upperCode}`);
                    return;
                }
                // Accept Guest
                const guestName = game.pendingRequest?.name || 'Guest';
                const { game: activeGame, hostToken, guestToken } = await gameService_1.GameService.acceptJoinRequest(upperCode, socket.id, guestSocketId, guestName);
                // Bind host and guest sessions
                const hostPayload = (0, session_1.verifySessionToken)(hostToken);
                const guestPayload = (0, session_1.verifySessionToken)(guestToken);
                socket.data.session = hostPayload;
                const guestSocket = io.sockets.sockets.get(guestSocketId);
                if (guestSocket) {
                    guestSocket.data.session = guestPayload;
                    guestSocket.join(upperCode);
                }
                const hostRole = activeGame.players.white?.playerId === hostPayload?.playerId ? 'white' : 'black';
                const guestRole = hostRole === 'white' ? 'black' : 'white';
                // Notify Host
                io.to(socket.id).emit('game_started', {
                    token: hostToken,
                    code: activeGame.code,
                    gameId: activeGame.id,
                    playerId: hostPayload?.playerId,
                    role: 'host',
                    color: hostRole,
                    opponentName: guestName,
                    fen: activeGame.fen,
                    timers: {
                        white: activeGame.timers.white,
                        black: activeGame.timers.black
                    },
                    timeControl: activeGame.timeControl
                });
                // Notify Guest
                io.to(guestSocketId).emit('game_started', {
                    token: guestToken,
                    code: activeGame.code,
                    gameId: activeGame.id,
                    playerId: guestPayload?.playerId,
                    role: 'guest',
                    color: guestRole,
                    opponentName: activeGame.players[hostRole]?.name || 'Host',
                    fen: activeGame.fen,
                    timers: {
                        white: activeGame.timers.white,
                        black: activeGame.timers.black
                    },
                    timeControl: activeGame.timeControl
                });
                console.log(`Game started in room ${upperCode}. Host token and guest token assigned successfully.`);
            }
            catch (err) {
                socket.emit('error_message', { message: err.message || 'Failed to start game' });
            }
        });
        // 4. Make Move (Seated validation)
        socket.on('make_move', async ({ gameId, playerId, token, move }) => {
            try {
                const session = socket.data.session;
                if (!session || session.gameId !== gameId || session.playerId !== playerId) {
                    throw new Error('Unauthorized move event');
                }
                const updatedGame = await gameService_1.GameService.makeMove(gameId, playerId, move.from, move.to, move.promotion);
                io.to(updatedGame.code).emit('move_made', {
                    fen: updatedGame.fen,
                    move,
                    history: updatedGame.history,
                    timers: {
                        white: updatedGame.timers.white,
                        black: updatedGame.timers.black
                    }
                });
                if (updatedGame.status === 'FINISHED') {
                    io.to(updatedGame.code).emit('game_over', {
                        winner: updatedGame.winner,
                        reason: updatedGame.reason,
                        finalHistory: updatedGame.history
                    });
                }
            }
            catch (err) {
                socket.emit('error_message', { message: err.message || 'Illegal move' });
            }
        });
        // 5. Offer Draw
        socket.on('offer_draw', async ({ gameId, playerId }) => {
            try {
                const session = socket.data.session;
                if (!session || session.gameId !== gameId || session.playerId !== playerId) {
                    throw new Error('Unauthorized draw offer');
                }
                const game = await Game_1.Game.findById(gameId);
                if (game && game.status === 'PLAYING') {
                    socket.to(game.code).emit('draw_offered');
                    console.log(`Draw offered in room ${game.code} by playerId: ${playerId}`);
                }
            }
            catch (err) {
                socket.emit('error_message', { message: err.message });
            }
        });
        // 6. Respond Draw
        socket.on('respond_draw', async ({ gameId, playerId, accept }) => {
            try {
                const session = socket.data.session;
                if (!session || session.gameId !== gameId || session.playerId !== playerId) {
                    throw new Error('Unauthorized draw response');
                }
                const game = await Game_1.Game.findById(gameId);
                if (!game || game.status !== 'PLAYING')
                    return;
                if (accept) {
                    const updatedGame = await gameService_1.GameService.agreeDraw(gameId);
                    io.to(updatedGame.code).emit('game_over', {
                        winner: 'draw',
                        reason: 'draw_agreement',
                        finalHistory: updatedGame.history
                    });
                }
                else {
                    socket.to(game.code).emit('draw_rejected');
                }
            }
            catch (err) {
                socket.emit('error_message', { message: err.message });
            }
        });
        // 7. Resign
        socket.on('resign', async ({ gameId, playerId }) => {
            try {
                const session = socket.data.session;
                if (!session || session.gameId !== gameId || session.playerId !== playerId) {
                    throw new Error('Unauthorized resignation request');
                }
                const updatedGame = await gameService_1.GameService.resign(gameId, playerId);
                io.to(updatedGame.code).emit('game_over', {
                    winner: updatedGame.winner,
                    reason: 'resign',
                    finalHistory: updatedGame.history
                });
                console.log(`Player resigned: ${playerId} in game ${gameId}`);
            }
            catch (err) {
                socket.emit('error_message', { message: err.message });
            }
        });
        // 8. Rejoin Game
        socket.on('rejoin_game', async ({ token }) => {
            try {
                const payload = (0, session_1.verifySessionToken)(token);
                if (!payload) {
                    return socket.emit('rejoin_failed', { reason: 'invalid_session' });
                }
                const game = await Game_1.Game.findById(payload.gameId);
                if (!game) {
                    return socket.emit('rejoin_failed', { reason: 'game_not_found' });
                }
                if (game.status === 'ABANDONED') {
                    return socket.emit('rejoin_failed', { reason: 'game_ended' });
                }
                // For FINISHED games, allow reconnection so players can see the game-over screen
                if (game.status === 'FINISHED') {
                    const player = (game.players.white?.playerId === payload.playerId)
                        ? game.players.white
                        : (game.players.black?.playerId === payload.playerId ? game.players.black : null);
                    if (!player || player.sessionTokenHash !== (0, session_1.hashToken)(token)) {
                        return socket.emit('rejoin_failed', { reason: 'invalid_session' });
                    }
                    socket.data.session = payload;
                    socket.join(game.code);
                    const opponentColor = player.color === 'white' ? 'black' : 'white';
                    return socket.emit('rejoin_success', {
                        status: game.status,
                        gameId: game.id,
                        code: game.code,
                        fen: game.fen,
                        history: game.history,
                        timers: { white: game.timers.white, black: game.timers.black },
                        role: player.role,
                        color: player.color,
                        playerName: player.name,
                        opponentName: game.players[opponentColor]?.name || 'Opponent',
                        opponentConnected: false,
                        timeControl: game.timeControl,
                        turn: new chess_js_1.Chess(game.fen).turn() === 'w' ? 'white' : 'black',
                        gameOver: { winner: game.winner, reason: game.reason }
                    });
                }
                // Find matching seat
                const player = (game.players.white?.playerId === payload.playerId)
                    ? game.players.white
                    : (game.players.black?.playerId === payload.playerId ? game.players.black : null);
                if (!player) {
                    // Allow host creator to rejoin WAITING lobby (hostPlayerId is stored directly)
                    if (game.status === 'WAITING' && game.hostPlayerId === payload.playerId) {
                        socket.data.session = payload;
                        socket.join(game.code);
                        return socket.emit('rejoin_success', {
                            status: game.status,
                            gameId: game.id,
                            code: game.code,
                            role: payload.role,
                            playerName: payload.playerName,
                            timeControl: game.timeControl
                        });
                    }
                    return socket.emit('rejoin_failed', { reason: 'seat_not_found' });
                }
                // Session validation hash check
                if (player.sessionTokenHash !== (0, session_1.hashToken)(token)) {
                    return socket.emit('rejoin_failed', { reason: 'hijack_detected' });
                }
                // Prevent seat hijack (if already connected elsewhere)
                if (player.connected && player.socketId !== socket.id) {
                    const stillAlive = io.sockets.sockets.get(player.socketId);
                    if (stillAlive) {
                        return socket.emit('rejoin_failed', { reason: 'seat_active_elsewhere' });
                    }
                }
                // Cancel pending forfeit checks
                (0, timerRegistry_1.cancelForfeitCheck)(game.id, player.color);
                // Update seat metadata directly — no version guard needed for socket reconnection
                const playerPath = player.color === 'white' ? 'players.white' : 'players.black';
                await Game_1.Game.findByIdAndUpdate(game._id, {
                    [`${playerPath}.socketId`]: socket.id,
                    [`${playerPath}.connected`]: true,
                    [`${playerPath}.disconnectedAt`]: null
                });
                // Set socket metadata
                socket.data.session = payload;
                socket.join(game.code);
                const opponentColor = player.color === 'white' ? 'black' : 'white';
                const opponent = game.players[opponentColor];
                const chess = new chess_js_1.Chess(game.fen);
                socket.emit('rejoin_success', {
                    status: game.status,
                    gameId: game.id,
                    code: game.code,
                    fen: game.fen,
                    history: game.history,
                    timers: {
                        white: game.timers.white,
                        black: game.timers.black
                    },
                    capturedPieces: (0, gameService_1.getCapturedPieces)(game.fen),
                    role: player.role,
                    color: player.color,
                    playerName: player.name,
                    opponentName: opponent ? opponent.name : 'Waiting...',
                    opponentConnected: opponent ? opponent.connected : false,
                    timeControl: game.timeControl,
                    turn: chess.turn() === 'w' ? 'white' : 'black'
                });
                // Notify opponent
                socket.to(game.code).emit('opponent_reconnected', {
                    color: player.color,
                    message: `${player.name} has reconnected.`
                });
                console.log(`Player ${player.name} successfully rejoined as ${player.color} in room ${game.code}`);
            }
            catch (err) {
                socket.emit('rejoin_failed', { reason: err.message || 'rejoin_error' });
            }
        });
        // 9. Spectator Join (Public spectator support)
        socket.on('join_spectator', async ({ code }) => {
            try {
                const upperCode = code.toUpperCase();
                const game = await Game_1.Game.findOne({ code: upperCode });
                if (!game) {
                    return socket.emit('spectator_failed', { reason: 'game_not_found' });
                }
                socket.join(upperCode);
                socket.emit('spectator_success', {
                    status: game.status,
                    gameId: game.id,
                    code: game.code,
                    fen: game.fen,
                    history: game.history,
                    timers: { white: game.timers.white, black: game.timers.black },
                    opponentName: game.players.black?.name || 'Black Player',
                    localPlayerName: game.players.white?.name || 'White Player',
                    timeControl: game.timeControl,
                    turn: new chess_js_1.Chess(game.fen).turn() === 'w' ? 'white' : 'black',
                    gameOver: game.status === 'FINISHED' ? { winner: game.winner, reason: game.reason } : null
                });
                console.log(`Spectator successfully joined room ${upperCode}`);
            }
            catch (err) {
                socket.emit('spectator_failed', { reason: err.message || 'error' });
            }
        });
        // Secure Handshake & Message Relay (E2E Encrypted Hidden Channel)
        socket.on('secure_init', ({ code }) => {
            if (!code)
                return;
            socket.to(code.toUpperCase()).emit('secure_init');
        });
        socket.on('secure_key', ({ code, publicKey, version }) => {
            if (!code || !publicKey)
                return;
            socket.to(code.toUpperCase()).emit('secure_key', { publicKey, version });
        });
        socket.on('secure_payload', ({ code, payload, version }) => {
            if (!code || !payload)
                return;
            // Basic payload validation
            if (typeof payload.ciphertext !== 'string' ||
                typeof payload.iv !== 'string' ||
                typeof payload.counter !== 'number') {
                return;
            }
            // Restrict payload sizes (Base64 limits)
            if (payload.ciphertext.length > 5000 || payload.iv.length > 100) {
                return;
            }
            // Enforce rate limiting: Max 5 messages per 2 seconds
            const now = Date.now();
            const clientLimit = chatLimits.get(socket.id) || { count: 0, windowStart: now };
            if (now - clientLimit.windowStart > 2000) {
                clientLimit.count = 1;
                clientLimit.windowStart = now;
                chatLimits.set(socket.id, clientLimit);
            }
            else {
                clientLimit.count += 1;
                chatLimits.set(socket.id, clientLimit);
                if (clientLimit.count > 5) {
                    console.warn(`Rate limit exceeded for secure_payload from socket ${socket.id}`);
                    return;
                }
            }
            socket.to(code.toUpperCase()).emit('secure_payload', { payload, version });
        });
        socket.on('secure_close', ({ code }) => {
            if (!code)
                return;
            socket.to(code.toUpperCase()).emit('secure_close');
        });
        // 10. Disconnect handling
        socket.on('disconnect', async () => {
            chatLimits.delete(socket.id);
            const session = socket.data.session;
            if (!session)
                return;
            console.log(`Socket disconnected: ${socket.id} (playerId: ${session.playerId})`);
            const game = await Game_1.Game.findById(session.gameId);
            if (!game || game.status !== 'PLAYING')
                return;
            const player = (game.players.white?.playerId === session.playerId)
                ? game.players.white
                : (game.players.black?.playerId === session.playerId ? game.players.black : null);
            if (!player || player.socketId !== socket.id)
                return; // Stale socket check
            // Update seat connection state in DB
            const playerPath = player.color === 'white' ? 'players.white' : 'players.black';
            await gameService_1.GameService.withRetry(async () => {
                const fresh = await Game_1.Game.findById(game._id);
                if (fresh) {
                    await gameService_1.GameService.atomicUpdate(fresh.id, fresh.version, {
                        [`${playerPath}.connected`]: false,
                        [`${playerPath}.disconnectedAt`]: new Date()
                    });
                }
            });
            // Broadcast disconnect event
            socket.to(game.code).emit('opponent_disconnected', {
                color: player.color,
                message: 'Opponent disconnected. Waiting for reconnection...',
                timeoutMs: game.disconnectTimeoutMs
            });
            // Schedule forfeit timer check
            (0, timerRegistry_1.scheduleForfeitCheck)(game.id, player.color, game.disconnectTimeoutMs, async () => {
                const fresh = await Game_1.Game.findById(game._id);
                if (!fresh || fresh.status !== 'PLAYING')
                    return;
                const thisSeatGone = fresh.players[player.color]?.connected === false;
                const opponentColor = player.color === 'white' ? 'black' : 'white';
                const opponentSeatGone = fresh.players[opponentColor]?.connected === false;
                if (thisSeatGone && opponentSeatGone) {
                    // Both disconnected
                    await gameService_1.GameService.atomicUpdate(fresh.id, fresh.version, {
                        status: 'ABANDONED',
                        winner: null,
                        reason: 'both_disconnected'
                    });
                    io.to(fresh.code).emit('game_over', {
                        winner: null,
                        reason: 'both_disconnected',
                        finalHistory: fresh.history
                    });
                }
                else if (thisSeatGone) {
                    // Declared abandonment victory for opponent
                    await gameService_1.GameService.atomicUpdate(fresh.id, fresh.version, {
                        status: 'FINISHED',
                        winner: opponentColor,
                        reason: 'abandonment'
                    });
                    io.to(fresh.code).emit('game_over', {
                        winner: opponentColor,
                        reason: 'abandonment',
                        finalHistory: fresh.history
                    });
                }
            });
        });
    });
    // 1. Every 1s: tick clocks and declare timeout check
    setInterval(async () => {
        if (!isDbConnected())
            return;
        try {
            const timedOutGames = await gameService_1.GameService.tickTimers();
            for (const game of timedOutGames) {
                io.to(game.code).emit('game_over', {
                    winner: game.winner,
                    reason: 'timeout',
                    finalHistory: game.history
                });
                console.log(`Game ${game.code} ended on timeout. Winner: ${game.winner}`);
            }
        }
        catch (err) {
            throttledError('Error ticking timers:', err);
        }
    }, 1000);
    // 2. Every 2s: broadcast synchronized clocks to room
    setInterval(async () => {
        if (!isDbConnected())
            return;
        try {
            const activeGames = await Game_1.Game.find({ status: 'PLAYING' });
            const now = Date.now();
            for (const game of activeGames) {
                const chess = new chess_js_1.Chess(game.fen);
                const activeColor = chess.turn();
                const lastTimestamp = game.timers.lastMoveTimestamp || now;
                const elapsed = now - lastTimestamp;
                let whiteTime = game.timers.white;
                let blackTime = game.timers.black;
                if (activeColor === 'w') {
                    whiteTime = Math.max(0, whiteTime - elapsed);
                }
                else {
                    blackTime = Math.max(0, blackTime - elapsed);
                }
                io.to(game.code).emit('sync_timers', {
                    timers: {
                        white: whiteTime,
                        black: blackTime
                    },
                    activeColor
                });
            }
        }
        catch (err) {
            throttledError('Error broadcasting synchronized timers:', err);
        }
    }, 2000);
};
exports.setupSocket = setupSocket;
