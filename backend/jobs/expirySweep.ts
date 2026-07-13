import { Server } from 'socket.io';
import { Game } from '../models/Game';
import { GameService } from '../services/gameService';
import mongoose from 'mongoose';

const isDbConnected = () => mongoose.connection.readyState === 1;

/** Rate-limit error log output — at most once per 30 s per label. */
const lastErrorLog: Record<string, number> = {};
const throttledError = (label: string, err: unknown) => {
  const now = Date.now();
  if (!lastErrorLog[label] || now - lastErrorLog[label] > 30_000) {
    lastErrorLog[label] = now;
    console.error(label, (err as Error).message ?? err);
  }
};

export function startExpirySweep(io: Server) {
  setInterval(async () => {
    if (!isDbConnected()) return;
    try {
      const now = Date.now();

      // 1. Expire WAITING lobbies
      await Game.updateMany(
        { status: 'WAITING', lobbyExpiresAt: { $lt: new Date(now) } },
        { $set: { status: 'ABANDONED', reason: 'timeout' } }
      );

      // 2. Expire JOIN_REQUEST_PENDING lobbies (60s timeout)
      const stalePending = await Game.find({
        status: 'JOIN_REQUEST_PENDING',
        'pendingRequest.requestedAt': { $lt: new Date(now - 60 * 1000) }
      });

      for (const game of stalePending) {
        if (game.pendingRequest) {
          // Notify guest socket
          io.to(game.pendingRequest.socketId).emit('join_rejected', { message: 'Join request timed out.' });
          
          // Reset game status back to WAITING
          await GameService.withRetry(async () => {
            const fresh = await Game.findById(game._id);
            if (fresh && fresh.status === 'JOIN_REQUEST_PENDING') {
              await GameService.atomicUpdate(fresh.id, fresh.version, {
                status: 'WAITING',
                $unset: { pendingRequest: 1 }
              });
            }
          });
        }
      }
    } catch (err) {
      throttledError('Error in expiry sweep job:', err);
    }
  }, 10000); // 10s sweep interval
}
