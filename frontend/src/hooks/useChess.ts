import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { socket } from '../services/socket';
import { sessionStore } from '../services/sessionStore';

export interface UseChessProps {
  code: string;
  onGoBack: () => void;
}

export type ConnectionState = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

function getCapturedPieces(fen: string) {
  const startCount: Record<string, number> = {
    p: 8, r: 2, n: 2, b: 2, q: 1,
    P: 8, R: 2, N: 2, B: 2, Q: 1
  };

  const boardCount: Record<string, number> = {
    p: 0, r: 0, n: 0, b: 0, q: 0,
    P: 0, R: 0, N: 0, B: 0, Q: 0
  };

  const piecesPart = fen.split(' ')[0];
  for (const char of piecesPart) {
    if (startCount[char] !== undefined) {
      boardCount[char]++;
    }
  }

  const capturedWhite: string[] = [];
  const capturedBlack: string[] = [];

  for (const [piece, max] of Object.entries(startCount)) {
    if (piece === piece.toUpperCase() && piece !== 'K') {
      const diff = max - (boardCount[piece] || 0);
      for (let i = 0; i < diff; i++) {
        capturedWhite.push(piece);
      }
    }
  }

  for (const [piece, max] of Object.entries(startCount)) {
    if (piece === piece.toLowerCase() && piece !== 'k') {
      const diff = max - (boardCount[piece] || 0);
      for (let i = 0; i < diff; i++) {
        capturedBlack.push(piece);
      }
    }
  }

  return {
    white: capturedWhite,
    black: capturedBlack
  };
}

export const useChess = ({ code, onGoBack }: UseChessProps) => {
  const chessRef = useRef(new Chess());
  const timerRef = useRef<any>(null);
  // Keep a mutable ref so the callback references don't re-trigger socket effects
  const onGoBackRef = useRef(onGoBack);
  
  useEffect(() => {
    onGoBackRef.current = onGoBack;
  }, [onGoBack]);

  // Keep a mutable ref so the interval callback always reads the live turn value
  const turnRef = useRef<'w' | 'b'>('w');

  const [fen, setFen] = useState(chessRef.current.fen());
  const [history, setHistory] = useState<string[]>([]);
  const [role, setRole] = useState<'white' | 'black' | null>(null);
  const [opponentName, setOpponentName] = useState('Opponent');
  const [turn, setTurn] = useState<'w' | 'b'>('w');

  // Keep turnRef in sync so the interval always reads the current value
  useEffect(() => { turnRef.current = turn; }, [turn]);

  
  // Connection states
  const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');

  // Game State
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'white' | 'black' | 'draw' | null>(null);
  const [gameOverReason, setGameOverReason] = useState<string | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(true);
  const [disconnectMessage, setDisconnectMessage] = useState<string | null>(null);
  const [pendingDrawOffer, setPendingDrawOffer] = useState(false);
  const [drawOfferStatus, setDrawOfferStatus] = useState<'none' | 'offered' | 'rejected'>('none');
  const [capturedPieces, setCapturedPieces] = useState<{ white: string[]; black: string[] }>({
    white: [],
    black: []
  });

  // Timers (in ms)
  const [timers, setTimers] = useState<{ white: number; black: number }>({
    white: 600000,
    black: 600000
  });
  const [timeControl, setTimeControl] = useState(600);

  // Reconnection and event setup
  useEffect(() => {
    if (code === 'OFFLINE') {
      setConnectionState('CONNECTED');
      setRole('white');
      setOpponentName('Player 2');
      setOpponentConnected(true);
      return;
    }

    const handleConnect = () => {
      const session = sessionStore.get();
      if (session) {
        setConnectionState('RECONNECTING');
        socket.emit('rejoin_game', { token: session.token });
      } else {
        setConnectionState('CONNECTED');
      }
    };

    const handleDisconnect = () => {
      setConnectionState('RECONNECTING');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Initial rejoin trigger
    const session = sessionStore.get();
    if (session) {
      setConnectionState('RECONNECTING');
      if (!socket.connected) {
        socket.connect();
      } else {
        socket.emit('rejoin_game', { token: session.token });
      }
    } else {
      onGoBackRef.current();
      return;
    }

    // Socket Event Listeners
    socket.on('rejoin_success', ({ fen, timers, history, color, opponentName, opponentConnected, turn, gameOver, timeControl: serverTimeControl }: {
      fen?: string; timers?: { white: number; black: number }; history?: string[];
      color?: 'white' | 'black'; opponentName?: string; opponentConnected?: boolean;
      turn?: 'white' | 'black'; gameOver?: { winner: string; reason: string };
      timeControl?: number;
    }) => {
      if (color) setRole(color);
      if (opponentName) setOpponentName(opponentName);
      if (serverTimeControl) setTimeControl(serverTimeControl);
      if (fen) {
        setFen(fen);
        setCapturedPieces(getCapturedPieces(fen));
        chessRef.current = new Chess(fen);
      }
      if (timers) setTimers(timers);
      if (history) setHistory(history);
      if (turn) setTurn(turn === 'white' ? 'w' : 'b');
      setOpponentConnected(opponentConnected ?? true);
      setDisconnectMessage(opponentConnected ? null : 'Opponent disconnected. Waiting for reconnection...');
      setConnectionState('CONNECTED');

      // If rejoining a finished game, immediately show game-over state
      if (gameOver) {
        setIsGameOver(true);
        setWinner(gameOver.winner as 'white' | 'black' | 'draw');
        const reasonMap: Record<string, string> = {
          checkmate: 'Victory by Checkmate!',
          stalemate: 'Match drawn due to Stalemate.',
          draw_agreement: 'Match drawn by mutual agreement.',
          resign: 'A player resigned the match.',
          timeout: 'A player lost on time.',
          abandonment: 'Opponent abandoned the game.',
          both_disconnected: 'Match terminated: Both players disconnected.'
        };
        setGameOverReason(reasonMap[gameOver.reason] || `Game over: ${gameOver.reason}`);
      }
    });

    socket.on('rejoin_failed', ({ reason }) => {
      console.warn('Rejoin attempt failed:', reason);

      // Fatal reasons: clear session and go home
      const fatalReasons = ['invalid_session', 'hijack_detected', 'game_ended', 'seat_not_found', 'seat_active_elsewhere', 'game_not_found'];
      if (fatalReasons.includes(reason)) {
        sessionStore.clear();
        socket.disconnect();
        setConnectionState('DISCONNECTED');
        alert(`Session error: ${reason}. Returning to Home.`);
        onGoBackRef.current();
        return;
      }

      // Transient: retry rejoin after a short delay
      setTimeout(() => {
        const session = sessionStore.get();
        if (session && socket.connected) {
          socket.emit('rejoin_game', { token: session.token });
        }
      }, 1500);
    });



    socket.on('move_made', ({ fen, history, timers }) => {
      setFen(fen);
      setHistory(history);
      setTimers(timers);
      setCapturedPieces(getCapturedPieces(fen));
      chessRef.current = new Chess(fen);
      setTurn(chessRef.current.turn());
    });

    socket.on('game_over', ({ winner, reason, finalHistory }) => {
      setIsGameOver(true);
      setWinner(winner);
      setHistory(finalHistory);
      
      let readableReason = '';
      switch (reason) {
        case 'checkmate': readableReason = 'Victory by Checkmate!'; break;
        case 'stalemate': readableReason = 'Match drawn due to Stalemate.'; break;
        case 'draw_agreement': readableReason = 'Match drawn by mutual agreement.'; break;
        case 'resign': readableReason = `${winner === 'white' ? 'Black' : 'White'} resigned the match.`; break;
        case 'timeout': readableReason = `${winner === 'white' ? 'Black' : 'White'} lost on time.`; break;
        case 'insufficient_material': readableReason = 'Drawn: Insufficient mating material.'; break;
        case 'threefold_repetition': readableReason = 'Drawn: Threefold repetition.'; break;
        case '50_moves': readableReason = 'Drawn: 50-move rule.'; break;
        case 'abandonment': readableReason = `Opponent abandoned the game.`; break;
        case 'both_disconnected': readableReason = `Match terminated: Both players disconnected.`; break;
        default: readableReason = `Game over: ${reason}`;
      }
      setGameOverReason(readableReason);
    });

    socket.on('sync_timers', ({ timers: syncedTimers, activeColor }) => {
      setTimers(syncedTimers);
      setTurn(activeColor);
    });

    socket.on('draw_offered', () => {
      setPendingDrawOffer(true);
    });

    socket.on('draw_rejected', () => {
      setDrawOfferStatus('rejected');
      setTimeout(() => setDrawOfferStatus('none'), 3000);
    });

    socket.on('opponent_disconnected', ({ message }) => {
      setOpponentConnected(false);
      setDisconnectMessage(message);
    });

    socket.on('opponent_reconnected', () => {
      setOpponentConnected(true);
      setDisconnectMessage(null);
    });

    socket.on('error_message', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('rejoin_success');
      socket.off('rejoin_failed');
      socket.off('move_made');
      socket.off('game_over');
      socket.off('sync_timers');
      socket.off('draw_offered');
      socket.off('draw_rejected');
      socket.off('opponent_disconnected');
      socket.off('opponent_reconnected');
      socket.off('error_message');
    };
  }, [code]);

  // Local clock decrement interval
  useEffect(() => {
    if (isGameOver || connectionState !== 'CONNECTED') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimers((prev) => {
        // Read from ref — never stale inside setInterval callback
        if (turnRef.current === 'w') {
          return { ...prev, white: Math.max(0, prev.white - 100) };
        } else {
          return { ...prev, black: Math.max(0, prev.black - 100) };
        }
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [turn, isGameOver, connectionState]);

  // Handle move validation & transmit move
  const handleMove = (from: string, to: string, promotion?: string): boolean => {
    const isMobile = window.innerWidth < 1024;
    const isOffline = code === 'OFFLINE' || (isMobile && (!navigator.onLine || !opponentConnected || connectionState !== 'CONNECTED'));

    if (isOffline) {
      if (isGameOver) return false;
      const chessCopy = new Chess(chessRef.current.fen());
      try {
        const moveResult = chessCopy.move({ from, to, promotion });
        if (moveResult) {
          chessRef.current.move({ from, to, promotion });
          setFen(chessRef.current.fen());
          setHistory(chessRef.current.history());
          setTurn(chessRef.current.turn());
          setCapturedPieces(getCapturedPieces(chessRef.current.fen()));
          
          if (chessRef.current.isGameOver()) {
            setIsGameOver(true);
            if (chessRef.current.isCheckmate()) {
              const winnerColor = chessRef.current.turn() === 'w' ? 'black' : 'white';
              setWinner(winnerColor);
              setGameOverReason('Victory by Checkmate!');
            } else if (chessRef.current.isStalemate()) {
              setWinner('draw');
              setGameOverReason('Match drawn due to Stalemate.');
            } else if (chessRef.current.isInsufficientMaterial()) {
              setWinner('draw');
              setGameOverReason('Drawn: Insufficient mating material.');
            } else if (chessRef.current.isThreefoldRepetition()) {
              setWinner('draw');
              setGameOverReason('Drawn: Threefold repetition.');
            } else {
              setWinner('draw');
              setGameOverReason('Drawn: 50-move rule.');
            }
          }
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    }

    if (isGameOver || connectionState !== 'CONNECTED') return false;
    
    const activeColor = chessRef.current.turn();
    const isPlayerTurn = (activeColor === 'w' && role === 'white') || (activeColor === 'b' && role === 'black');
    if (!isPlayerTurn) return false;

    const chessCopy = new Chess(chessRef.current.fen());
    try {
      const moveResult = chessCopy.move({ from, to, promotion });
      if (moveResult) {
        const session = sessionStore.get();
        if (session) {
          socket.emit('make_move', {
            gameId: session.gameId,
            playerId: session.playerId,
            token: session.token,
            move: { from, to, promotion }
          });
          return true;
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  const handleOfferDraw = () => {
    const session = sessionStore.get();
    if (!session) return;
    setDrawOfferStatus('offered');
    socket.emit('offer_draw', { gameId: session.gameId, playerId: session.playerId });
  };

  const handleRespondDraw = (accept: boolean) => {
    const session = sessionStore.get();
    if (!session) return;
    setPendingDrawOffer(false);
    socket.emit('respond_draw', { gameId: session.gameId, playerId: session.playerId, accept });
  };

  const handleResign = () => {
    const session = sessionStore.get();
    if (!session) return;
    if (window.confirm('Are you sure you want to resign the game?')) {
      socket.emit('resign', { gameId: session.gameId, playerId: session.playerId });
    }
  };

  const handleLeaveGame = () => {
    sessionStore.clear();
    socket.disconnect();
    onGoBack();
  };

  const localPlayerName = sessionStore.get()?.playerName || 'You';



  return {
    fen,
    history,
    role,
    opponentName,
    localPlayerName,
    turn,
    timers,
    isGameOver,
    winner,
    gameOverReason,
    opponentConnected,
    disconnectMessage,
    pendingDrawOffer,
    drawOfferStatus,
    capturedPieces,
    connectionState,
    handleMove,
    handleOfferDraw,
    handleRespondDraw,
    handleResign,
    handleLeaveGame,
    timeControl,
    chess: chessRef.current
  };
};

export default useChess;
