"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const gameService_1 = require("./services/gameService");
const Game_1 = require("./models/Game");
const session_1 = require("./utils/session");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});
// Verify a game code REST endpoint
app.get('/api/game/verify/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const game = await gameService_1.GameService.getGameForJoin(code.toUpperCase());
        res.status(200).json({
            valid: true,
            timeControl: game.timeControl,
            hostName: game.players.white?.name || game.pendingRequest?.name || 'Host'
        });
    }
    catch (error) {
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
        const payload = (0, session_1.verifySessionToken)(token);
        if (!payload || payload.gameId !== gameId) {
            return res.status(200).json({ valid: false, reason: 'invalid_token' });
        }
        const game = await Game_1.Game.findById(gameId);
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
        const hashed = (0, session_1.hashToken)(token);
        if (player.sessionTokenHash !== hashed) {
            return res.status(200).json({ valid: false, reason: 'hijack_detected' });
        }
        return res.status(200).json({ valid: true });
    }
    catch (err) {
        return res.status(200).json({ valid: false, reason: 'server_error' });
    }
});
exports.default = app;
