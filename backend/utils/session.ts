import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-chess-key-9988';

export interface SessionPayload {
  gameId: string;
  playerId: string;
  role: 'host' | 'guest';
  playerName: string;
}

export function issueSessionToken(gameId: string, playerId: string, role: 'host' | 'guest', playerName: string): string {
  const payload: SessionPayload = { gameId, playerId, role, playerName };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '4h' });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch (error) {
    return null;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
