"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleForfeitCheck = scheduleForfeitCheck;
exports.cancelForfeitCheck = cancelForfeitCheck;
const disconnectTimers = new Map();
function scheduleForfeitCheck(gameId, color, ms, onExpire) {
    const key = `${gameId}:${color}`;
    const existing = disconnectTimers.get(key);
    if (existing) {
        clearTimeout(existing);
    }
    disconnectTimers.set(key, setTimeout(() => {
        disconnectTimers.delete(key);
        onExpire();
    }, ms));
}
function cancelForfeitCheck(gameId, color) {
    const key = `${gameId}:${color}`;
    const existing = disconnectTimers.get(key);
    if (existing) {
        clearTimeout(existing);
        disconnectTimers.delete(key);
    }
}
