"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExpirySweep = startExpirySweep;
const Game_1 = require("../models/Game");
const gameService_1 = require("../services/gameService");
const mongoose_1 = __importDefault(require("mongoose"));
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
function startExpirySweep(io) {
    setInterval(async () => {
        if (!isDbConnected())
            return;
        try {
            const now = Date.now();
            // 1. Expire WAITING lobbies
            await Game_1.Game.updateMany({ status: 'WAITING', lobbyExpiresAt: { $lt: new Date(now) } }, { $set: { status: 'ABANDONED', reason: 'timeout' } });
            // 2. Expire JOIN_REQUEST_PENDING lobbies (60s timeout)
            const stalePending = await Game_1.Game.find({
                status: 'JOIN_REQUEST_PENDING',
                'pendingRequest.requestedAt': { $lt: new Date(now - 60 * 1000) }
            });
            for (const game of stalePending) {
                if (game.pendingRequest) {
                    // Notify guest socket
                    io.to(game.pendingRequest.socketId).emit('join_rejected', { message: 'Join request timed out.' });
                    // Reset game status back to WAITING
                    await gameService_1.GameService.withRetry(async () => {
                        const fresh = await Game_1.Game.findById(game._id);
                        if (fresh && fresh.status === 'JOIN_REQUEST_PENDING') {
                            await gameService_1.GameService.atomicUpdate(fresh.id, fresh.version, {
                                status: 'WAITING',
                                $unset: { pendingRequest: 1 }
                            });
                        }
                    });
                }
            }
        }
        catch (err) {
            throttledError('Error in expiry sweep job:', err);
        }
    }, 10000); // 10s sweep interval
}
