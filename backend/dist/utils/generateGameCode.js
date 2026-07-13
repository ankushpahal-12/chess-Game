"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGameCode = void 0;
const Game_1 = require("../models/Game");
/**
 * Generates a unique 6-character game code.
 * Checks the database for any active/waiting lobbies to prevent collisions.
 */
const generateGameCode = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let attempts = 0;
    while (attempts < 10) {
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        // Check if this code is already used by an active or waiting game
        const existingGame = await Game_1.Game.findOne({ code, status: { $in: ['waiting', 'active'] } });
        if (!existingGame) {
            return code;
        }
        attempts++;
    }
    throw new Error('Could not generate a unique game code after 10 attempts');
};
exports.generateGameCode = generateGameCode;
