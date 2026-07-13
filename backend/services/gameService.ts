import { Game, IGame, ISeatedPlayer } from '../models/Game';
import { Chess } from 'chess.js';
import { generateGameCode } from '../utils/generateGameCode';
import { issueSessionToken, hashToken } from '../utils/session';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

const generateId = () => 
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export function getCapturedPieces(fen: string) {
  const startCount: Record<string, number> = {
    p: 8, r: 2, n: 2, b: 2, q: 1,
    P: 8, R: 2, N: 2, B: 2, Q: 1
  };

  const boardCount: Record<string, number> = {
    p: 0, r: 0, n: 0, b: 0, q: 0,
    P: 0, R: 0, N: 0, B: 0, Q: 0
  };

  const piecesPart = fen.split(' ')[0];
  for (const char of piecesPart) {
    if (startCount[char] !== undefined) {
      boardCount[char]++;
    }
  }

  const capturedWhite: string[] = [];
  const capturedBlack: string[] = [];

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
    black: capturedBlack  // black pieces captured
  };
}

export class GameService {
  /**
   * Performs an atomic update on a Game document using optimistic concurrency checks.
   */
  static async atomicUpdate(
    gameId: string,
    currentVersion: number,
    update: Record<string, any>
  ): Promise<IGame> {
    const result = await Game.findOneAndUpdate(
      { _id: gameId, version: currentVersion },
      { ...update, $inc: { version: 1 } },
      { new: true }
    );
    if (!result) {
      throw new ConflictError('Game state changed concurrently, retrying...');
    }
    return result;
  }

  /**
   * Helper wrapper to automatically retry on optimistic concurrency conflict error
   */
  static async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ConflictError && retries > 0) {
        return GameService.withRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Creates a new game lobby
   */
  static async createGame(hostSocketId: string, hostName: string, timeControl: number): Promise<{ game: IGame; token: string }> {
    const code = await generateGameCode();
    const initialTimeMs = timeControl * 1000;
    const playerId = generateId();

    const game = new Game({
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

    const token = issueSessionToken(game.id, playerId, 'host', hostName);
    const hashed = hashToken(token);

    game.hostSessionTokenHash = hashed;
    await game.save();

    return { game, token };
  }

  /**
   * Validates if a game can be joined
   */
  static async getGameForJoin(code: string): Promise<IGame> {
    const game = await Game.findOne({ code, status: 'WAITING' });
    if (!game) {
      throw new Error('Game lobby not found or already started');
    }
    return game;
  }

  /**
   * Requests to join a lobby (gated check before modal)
   */
  static async submitJoinRequest(code: string, nickname: string, socketId: string): Promise<{ game: IGame; playerId: string }> {
    const playerId = generateId();
    const game = await GameService.getGameForJoin(code);

    const updated = await Game.findOneAndUpdate(
      { _id: game._id, status: 'WAITING' },
      { 
        status: 'JOIN_REQUEST_PENDING',
        pendingRequest: {
          playerId,
          name: nickname,
          socketId,
          requestedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updated) {
      throw new Error('Game lobby is no longer available to join');
    }

    return { game: updated, playerId };
  }

  /**
   * Assigns color seats randomly, sets status to PLAYING, and issues host & guest tokens.
   */
  static async acceptJoinRequest(
    code: string, 
    hostSocketId: string, 
    guestSocketId: string,
    guestName: string
  ): Promise<{ game: IGame; hostToken: string; guestToken: string }> {
    const game = await Game.findOne({ code, status: 'JOIN_REQUEST_PENDING' });
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

    const hostToken = issueSessionToken(game.id, hostPlayerId, 'host', hostName);
    const guestToken = issueSessionToken(game.id, guestPlayerId, 'guest', guestName);

    const hostPlayer: ISeatedPlayer = {
      playerId: hostPlayerId,
      name: hostName,
      role: 'host',
      color: hostColor,
      socketId: hostSocketId,
      connected: true,
      sessionTokenHash: hashToken(hostToken),
      joinedAt: new Date()
    };

    const guestPlayer: ISeatedPlayer = {
      playerId: guestPlayerId,
      name: guestName,
      role: 'guest',
      color: guestColor,
      socketId: guestSocketId,
      connected: true,
      sessionTokenHash: hashToken(guestToken),
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
  static async makeMove(
    gameId: string, 
    playerId: string, 
    from: string, 
    to: string, 
    promotion?: string
  ): Promise<IGame> {
    return await GameService.withRetry(async () => {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error('Game not found');
      }
      if (game.status !== 'PLAYING') {
        throw new Error('Game is not in progress');
      }

      // Check current player turn color
      const chess = new Chess(game.fen);
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
      } else {
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
      } catch (e) {
        throw new Error('Invalid move according to chess rules');
      }

      const newFen = chess.fen();
      const newHistory = [...game.history, `${from}-${to}${promotion ? `=${promotion}` : ''}`];
      
      let newStatus: IGame['status'] = 'PLAYING';
      let winner: IGame['winner'] = null;
      let reason: IGame['reason'] = null;

      if (chess.isGameOver()) {
        newStatus = 'FINISHED';
        if (chess.isCheckmate()) {
          winner = activeColor === 'w' ? 'white' : 'black';
          reason = 'checkmate';
        } else if (chess.isStalemate()) {
          winner = 'draw';
          reason = 'stalemate';
        } else if (chess.isInsufficientMaterial()) {
          winner = 'draw';
          reason = 'insufficient_material';
        } else if (chess.isThreefoldRepetition()) {
          winner = 'draw';
          reason = 'threefold_repetition';
        } else if (chess.isDraw()) {
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
  static async resign(gameId: string, playerId: string): Promise<IGame> {
    return await GameService.withRetry(async () => {
      const game = await Game.findById(gameId);
      if (!game || game.status !== 'PLAYING') {
        throw new Error('Game not found or not active');
      }

      let winnerRole: 'white' | 'black';
      if (game.players.white?.playerId === playerId) {
        winnerRole = 'black';
      } else if (game.players.black?.playerId === playerId) {
        winnerRole = 'white';
      } else {
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
  static async agreeDraw(gameId: string): Promise<IGame> {
    return await GameService.withRetry(async () => {
      const game = await Game.findById(gameId);
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
  static async getGameByCode(code: string): Promise<IGame | null> {
    return await Game.findOne({ code });
  }

  /**
   * Periodically checks active game timers to enforce time limits on the server.
   */
  static async tickTimers(): Promise<IGame[]> {
    const activeGames = await Game.find({ status: 'PLAYING' });
    const timedOutGames: IGame[] = [];
    const now = Date.now();

    for (const game of activeGames) {
      const chess = new Chess(game.fen);
      const activeColor = chess.turn();
      const lastTimestamp = game.timers.lastMoveTimestamp || now;
      const elapsed = now - lastTimestamp;

      let whiteTime = game.timers.white;
      let blackTime = game.timers.black;

      if (activeColor === 'w') {
        whiteTime = Math.max(0, whiteTime - elapsed);
      } else {
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
        } catch {
          // Skip tick updates on concurrent conflict, will tick on next sweep
        }
      }
    }

    return timedOutGames;
  }
}
