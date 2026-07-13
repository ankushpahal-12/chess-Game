export interface GameSession {
  gameId: string;
  playerId: string;
  role: 'host' | 'guest';
  playerName: string;
  token: string;
}

export const sessionStore = {
  save: (s: GameSession) => sessionStorage.setItem('chess_session', JSON.stringify(s)),
  get: (): GameSession | null => {
    const raw = sessionStorage.getItem('chess_session');
    return raw ? JSON.parse(raw) : null;
  },
  clear: () => sessionStorage.removeItem('chess_session')
};
