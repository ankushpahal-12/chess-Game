"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = exports.ConflictError = void 0;
exports.getCapturedPieces = getCapturedPieces;
const Game_1 = require("../models/Game");
const chess_js_1 = require("chess.js");
const generateGameCode_1 = require("../utils/generateGameCode");
const session_1 = require("../utils/session");
class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
function getCapturedPieces(fen) {
    const startCount = {
        p: 8, r: 2, n: 2, b: 2, q: 1,
        P: 8, R: 2, N: 2, B: 2, Q: 1
    };
    const boardCount = {
        p: 0, r: 0, n: 0, b: 0, q: 0,
        P: 0, R: 0, N: 0, B: 0, Q: 0
    };
    const piecesPart = fen.split(' ')[0];
    for (const char of piecesPart) {
        if (startCount[char] !== undefined) {
            boardCount[char]++;
        }
    }
    const capturedWhite = [];
    const capturedBlack = [];
    for (const [piece, max] of Object.entries(startCount)) {
        if (piece === piece.toUpperCase() && piece !== 'K') {
            const diff = max - (boardCount[piece] || 0);
            for (let i = 0; i < diff; i++) {
                capturedWhite.push(piece);
            }
        }
    }
    for (const [piece, max] of Object.entries(startCount)) {
        if (piece === piece.toLowerCase() && piece !== 'k') {
            const diff = max - (boardCount[piece] || 0);
            for (let i = 0; i < diff; i++) {
                capturedBlack.push(piece);
            }
        }
    }
    return {
        white: capturedWhite, // white pieces captured
        black: capturedBlack // black pieces captured
    };
}
class GameService {
    /**
     * Performs an atomic update on a Game document using optimistic concurrency checks.
     */
    static async atomicUpdate(gameId, currentVersion, update) {
        const result = await Game_1.Game.findOneAndUpdate({ _id: gameId, version: currentVersion }, { ...update, $inc: { version: 1 } }, { new: true });
        if (!result) {
            throw new ConflictError('Game state changed concurrently, retrying...');
        }
        return result;
    }
    /**
     * Helper wrapper to automatically retry on optimistic concurrency conflict error
     */
    static async withRetry(fn, retries = 3) {
        try {
            return await fn();
        }
        catch (error) {
            if (error instanceof ConflictError && retries > 0) {
                return GameService.withRetry(fn, retries - 1);
            }
            throw error;
        }
    }
    /**
     * Creates a new game lobby
     */
    static async createGame(hostSocketId, hostName, timeControl) {
        const code = await (0, generateGameCode_1.generateGameCode)();
        const initialTimeMs = timeControl * 1000;
        const playerId = generateId();
        const game = new Game_1.Game({
            code,
            status: 'WAITING',
            hostSocketId,
            hostName,
            hostPlayerId: playerId,
            hostSessionTokenHash: 'temp',
            players: {},
            timeControl,
            timers: {
                white: initialTimeMs,
                black: initialTimeMs
            },
            lobbyExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins lobby timeout
            version: 0
        });
        await game.save();
        const token = (0, session_1.issueSessionToken)(game.id, playerId, 'host', hostName);
        const hashed = (0, session_1.hashToken)(token);
        game.hostSessionTokenHash = hashed;
        await game.save();
        return { game, token };
    }
    /**
     * Validates if a game can be joined
     */
    static async getGameForJoin(code) {
        const game = await Game_1.Game.findOne({ code, status: 'WAITING' });
        if (!game) {
            throw new Error('Game lobby not found or already started');
        }
        return game;
    }
    /**
     * Requests to join a lobby (gated check before modal)
     */
    static async submitJoinRequest(code, nickname, socketId) {
        const playerId = generateId();
        const game = await GameService.getGameForJoin(code);
        const updated = await Game_1.Game.findOneAndUpdate({ _id: game._id, status: 'WAITING' }, {
            status: 'JOIN_REQUEST_PENDING',
            pendingRequest: {
                playerId,
                name: nickname,
                socketId,
                requestedAt: new Date()
            }
        }, { new: true });
        if (!updated) {
            throw new Error('Game lobby is no longer available to join');
        }
        return { game: updated, playerId };
    }
    /**
     * Assigns color seats randomly, sets status to PLAYING, and issues host & guest tokens.
     */
    static async acceptJoinRequest(code, hostSocketId, guestSocketId, guestName) {
        const game = await Game_1.Game.findOne({ code, status: 'JOIN_REQUEST_PENDING' });
        if (!game) {
            throw new Error('No pending join request found for this lobby');
        }
        if (game.hostSocketId !== hostSocketId) {
            throw new Error('Unauthorized: Only the host can accept join requests');
        }
        const hostName = game.hostName;
        const hostPlayerId = game.hostPlayerId;
        const hostTokenHash = game.hostSessionTokenHash;
        const guestPlayerId = game.pendingRequest?.playerId || generateId();
        // Randomize colors
        const isHostWhite = Math.random() < 0.5;
        const hostColor = isHostWhite ? 'white' : 'black';
        const guestColor = isHostWhite ? 'black' : 'white';
        const hostToken = (0, session_1.issueSessionToken)(game.id, hostPlayerId, 'host', hostName);
        const guestToken = (0, session_1.issueSessionToken)(game.id, guestPlayerId, 'guest', guestName);
        const hostPlayer = {
            playerId: hostPlayerId,
            name: hostName,
            role: 'host',
            color: hostColor,
            socketId: hostSocketId,
            connected: true,
            sessionTokenHash: (0, session_1.hashToken)(hostToken),
            joinedAt: new Date()
        };
        const guestPlayer = {
            playerId: guestPlayerId,
            name: guestName,
            role: 'guest',
            color: guestColor,
            socketId: guestSocketId,
            connected: true,
            sessionTokenHash: (0, session_1.hashToken)(guestToken),
            joinedAt: new Date()
        };
        game.players = {
            white: hostColor === 'white' ? hostPlayer : guestPlayer,
            black: hostColor === 'black' ? hostPlayer : guestPlayer
        };
        game.status = 'PLAYING';
        game.timers.lastMoveTimestamp = Date.now();
        game.pendingRequest = undefined; // clear pending details
        await game.save();
        return { game, hostToken, guestToken };
    }
    /**
     * Processes a player's move, validates it, updates game clocks, and checks game-over conditions.
     */
    static async makeMove(gameId, playerId, from, to, promotion) {
        return await GameService.withRetry(async () => {
            const game = await Game_1.Game.findById(gameId);
            if (!game) {
                throw new Error('Game not found');
            }
            if (game.status !== 'PLAYING') {
                throw new Error('Game is not in progress');
            }
            // Check current player turn color
            const chess = new chess_js_1.Chess(game.fen);
            const activeColor = chess.turn(); // 'w' or 'b'
            const activePlayer = activeColor === 'w' ? game.players.white : game.players.black;
            if (!activePlayer || activePlayer.playerId !== playerId) {
                throw new Error("It's not your turn");
            }
            // Server-authoritative timer update
            const now = Date.now();
            const elapsed = now - (game.timers.lastMoveTimestamp || now);
            let whiteTime = game.timers.white;
            let blackTime = game.timers.black;
            if (activeColor === 'w') {
                whiteTime = Math.max(0, whiteTime - elapsed);
            }
            else {
                blackTime = Math.max(0, blackTime - elapsed);
            }
            // Timeout Check
            if (whiteTime <= 0 || blackTime <= 0) {
                return await GameService.atomicUpdate(gameId, game.version, {
                    'timers.white': whiteTime,
                    'timers.black': blackTime,
                    status: 'FINISHED',
                    winner: whiteTime <= 0 ? 'black' : 'white',
                    reason: 'timeout'
                });
            }
            // Validate the move using chess.js
            try {
                chess.move({ from, to, promotion: promotion || undefined });
            }
            catch (e) {
                throw new Error('Invalid move according to chess rules');
            }
            const newFen = chess.fen();
            const newHistory = [...game.history, `${from}-${to}${promotion ? `=${promotion}` : ''}`];
            let newStatus = 'PLAYING';
            let winner = null;
            let reason = null;
            if (chess.isGameOver()) {
                newStatus = 'FINISHED';
                if (chess.isCheckmate()) {
                    winner = activeColor === 'w' ? 'white' : 'black';
                    reason = 'checkmate';
                }
                else if (chess.isStalemate()) {
                    winner = 'draw';
                    reason = 'stalemate';
                }
                else if (chess.isInsufficientMaterial()) {
                    winner = 'draw';
                    reason = 'insufficient_material';
                }
                else if (chess.isThreefoldRepetition()) {
                    winner = 'draw';
                    reason = 'threefold_repetition';
                }
                else if (chess.isDraw()) {
                    winner = 'draw';
                    reason = '50_moves';
                }
            }
            return await GameService.atomicUpdate(gameId, game.version, {
                fen: newFen,
                history: newHistory,
                'timers.white': whiteTime,
                'timers.black': blackTime,
                'timers.lastMoveTimestamp': now,
                status: newStatus,
                winner,
                reason
            });
        });
    }
    /**
     * Resigns a game
     */
    static async resign(gameId, playerId) {
        return await GameService.withRetry(async () => {
            const game = await Game_1.Game.findById(gameId);
            if (!game || game.status !== 'PLAYING') {
                throw new Error('Game not found or not active');
            }
            let winnerRole;
            if (game.players.white?.playerId === playerId) {
                winnerRole = 'black';
            }
            else if (game.players.black?.playerId === playerId) {
                winnerRole = 'white';
            }
            else {
                throw new Error('Unauthorized player resignation');
            }
            return await GameService.atomicUpdate(gameId, game.version, {
                status: 'FINISHED',
                winner: winnerRole,
                reason: 'resign'
            });
        });
    }
    /**
     * Records a draw by agreement
     */
    static async agreeDraw(gameId) {
        return await GameService.withRetry(async () => {
            const game = await Game_1.Game.findById(gameId);
            if (!game || game.status !== 'PLAYING') {
                throw new Error('Game not found or not active');
            }
            return await GameService.atomicUpdate(gameId, game.version, {
                status: 'FINISHED',
                winner: 'draw',
                reason: 'draw_agreement'
            });
        });
    }
    /**
     * Finds game by code
     */
    static async getGameByCode(code) {
        return await Game_1.Game.findOne({ code });
    }
    /**
     * Periodically checks active game timers to enforce time limits on the server.
     */
    static async tickTimers() {
        const activeGames = await Game_1.Game.find({ status: 'PLAYING' });
        const timedOutGames = [];
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
            if (whiteTime <= 0 || blackTime <= 0) {
                try {
                    const updated = await GameService.atomicUpdate(game.id, game.version, {
                        'timers.white': whiteTime,
                        'timers.black': blackTime,
                        status: 'FINISHED',
                        winner: whiteTime <= 0 ? 'black' : 'white',
                        reason: 'timeout'
                    });
                    timedOutGames.push(updated);
                }
                catch {
                    // Skip tick updates on concurrent conflict, will tick on next sweep
                }
            }
        }
        return timedOutGames;
    }
}
exports.GameService = GameService;
