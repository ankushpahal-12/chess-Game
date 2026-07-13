import express from 'express';
import cors from 'cors';
import { GameService } from './services/gameService';
import { Game } from './models/Game';
import { verifySessionToken, hashToken } from './utils/session';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Verify a game code REST endpoint
app.get('/api/game/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const game = await GameService.getGameForJoin(code.toUpperCase());
    res.status(200).json({
      valid: true,
      timeControl: game.timeControl,
      hostName: game.players.white?.name || game.pendingRequest?.name || 'Host'
    });
  } catch (error: any) {
    res.status(400).json({
      valid: false,
      error: error.message || 'Invalid or unavailable game code'
    });
  }
});

// Validate session REST endpoint for route guards
app.post('/api/game/validate-session', async (req, res) => {
  try {
    const { gameId, token } = req.body;
    if (!gameId || !token) {
      return res.status(200).json({ valid: false, reason: 'missing_params' });
    }

    const payload = verifySessionToken(token);
    if (!payload || payload.gameId !== gameId) {
      return res.status(200).json({ valid: false, reason: 'invalid_token' });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(200).json({ valid: false, reason: 'game_not_found' });
    }

    if (game.status === 'ABANDONED') {
      return res.status(200).json({ valid: false, reason: 'game_ended' });
    }

    // Check player seat match
    const player = (game.players.white?.playerId === payload.playerId)
      ? game.players.white
      : (game.players.black?.playerId === payload.playerId ? game.players.black : null);

    if (!player) {
      // If the game status is WAITING, it could be the host creator validating before anyone joins
      if (game.status === 'WAITING' && game.hostPlayerId === payload.playerId) {
        return res.status(200).json({ valid: true });
      }
      return res.status(200).json({ valid: false, reason: 'seat_not_found' });
    }

    const hashed = hashToken(token);
    if (player.sessionTokenHash !== hashed) {
      return res.status(200).json({ valid: false, reason: 'hijack_detected' });
    }

    return res.status(200).json({ valid: true });
  } catch (err: any) {
    return res.status(200).json({ valid: false, reason: 'server_error' });
  }
});

export default app;
