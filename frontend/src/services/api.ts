const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface VerifyResponse {
  valid: boolean;
  timeControl: number;
  hostName: string;
  error?: string;
}

/**
 * Checks with the backend to verify if a game code is active and waiting for a player.
 */
export const verifyGameCode = async (code: string): Promise<VerifyResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/game/verify/${code.toUpperCase()}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Invalid game code');
    }
    return data;
  } catch (error: any) {
    return {
      valid: false,
      timeControl: 0,
      hostName: '',
      error: error.message || 'Server error verifying code'
    };
  }
};
