"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const mongoose_1 = require("mongoose");
const SeatedPlayerSchema = new mongoose_1.Schema({
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
const GameSchema = new mongoose_1.Schema({
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
exports.Game = (0, mongoose_1.model)('Game', GameSchema);
