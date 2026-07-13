import { Game } from '../models/Game';

/**
 * Generates a unique 6-character game code.
 * Checks the database for any active/waiting lobbies to prevent collisions.
 */
export const generateGameCode = async (): Promise<string> => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;

  while (attempts < 10) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if this code is already used by an active or waiting game
    const existingGame = await Game.findOne({ code, status: { $in: ['waiting', 'active'] } });
    if (!existingGame) {
      return code;
    }
    attempts++;
  }

  throw new Error('Could not generate a unique game code after 10 attempts');
};
