import { Schema, model, Document } from 'mongoose';

export interface ISeatedPlayer {
  playerId: string;
  name: string;
  role: 'host' | 'guest';
  color: 'white' | 'black';
  socketId: string;
  connected: boolean;
  disconnectedAt?: Date;
  sessionTokenHash: string;
  joinedAt?: Date;
}

export interface IGame extends Document {
  code: string;
  status: 'WAITING' | 'JOIN_REQUEST_PENDING' | 'READY' | 'PLAYING' | 'FINISHED' | 'ABANDONED';
  hostSocketId: string;
  hostName: string;
  hostPlayerId: string;
  hostSessionTokenHash: string;
  players: {
    white?: ISeatedPlayer;
    black?: ISeatedPlayer;
  };
  pendingRequest?: {
    playerId: string;
    name: string;
    socketId: string;
    requestedAt: Date;
  };
  fen: string;
  history: string[];
  timeControl: number; // in seconds
  timers: {
    white: number; // remaining time in ms
    black: number; // remaining time in ms
    lastMoveTimestamp?: number; // epoch ms
  };
  winner?: 'white' | 'black' | 'draw' | null;
  reason?: 'checkmate' | 'stalemate' | 'draw_agreement' | 'resign' | 'timeout' | 'abandonment' | 'both_disconnected' | 'insufficient_material' | '50_moves' | 'threefold_repetition' | null;
  lobbyExpiresAt: Date;
  disconnectTimeoutMs: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const SeatedPlayerSchema = new Schema<ISeatedPlayer>({
  playerId: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ['host', 'guest'] },
  color: { type: String, required: true, enum: ['white', 'black'] },
  socketId: { type: String, required: true },
  connected: { type: Boolean, required: true, default: true },
  disconnectedAt: { type: Date },
  sessionTokenHash: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const GameSchema = new Schema<IGame>({
  code: { type: String, required: true, unique: true, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['WAITING', 'JOIN_REQUEST_PENDING', 'READY', 'PLAYING', 'FINISHED', 'ABANDONED'],
    default: 'WAITING' 
  },
  hostSocketId: { type: String, required: true },
  hostName: { type: String, required: true },
  hostPlayerId: { type: String, required: true },
  hostSessionTokenHash: { type: String, required: true },
  players: {
    white: { type: SeatedPlayerSchema },
    black: { type: SeatedPlayerSchema }
  },
  pendingRequest: {
    playerId: { type: String },
    name: { type: String },
    socketId: { type: String },
    requestedAt: { type: Date }
  },
  fen: { 
    type: String, 
    required: true,
    default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' 
  },
  history: { type: [String], default: [] },
  timeControl: { type: Number, required: true, default: 600 }, // default 10 mins
  timers: {
    white: { type: Number, required: true },
    black: { type: Number, required: true },
    lastMoveTimestamp: { type: Number }
  },
  winner: { type: String, enum: ['white', 'black', 'draw', null], default: null },
  reason: { 
    type: String, 
    enum: ['checkmate', 'stalemate', 'draw_agreement', 'resign', 'timeout', 'abandonment', 'both_disconnected', null], 
    default: null 
  },
  lobbyExpiresAt: { type: Date, required: true },
  disconnectTimeoutMs: { type: Number, required: true, default: 300000 },
  version: { type: Number, required: true, default: 0 }
}, { timestamps: true, versionKey: false });

export const Game = model<IGame>('Game', GameSchema);
