"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueSessionToken = issueSessionToken;
exports.verifySessionToken = verifySessionToken;
exports.hashToken = hashToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-chess-key-9988';
function issueSessionToken(gameId, playerId, role, playerName) {
    const payload = { gameId, playerId, role, playerName };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '4h' });
}
function verifySessionToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
