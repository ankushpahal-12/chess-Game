const disconnectTimers = new Map<string, NodeJS.Timeout>();

export function scheduleForfeitCheck(gameId: string, color: 'white' | 'black', ms: number, onExpire: () => void) {
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

export function cancelForfeitCheck(gameId: string, color: 'white' | 'black') {
  const key = `${gameId}:${color}`;
  const existing = disconnectTimers.get(key);
  if (existing) {
    clearTimeout(existing);
    disconnectTimers.delete(key);
  }
}
