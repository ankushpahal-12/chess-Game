import { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { verifyGameCode } from '../services/api';
import { sessionStore } from '../services/sessionStore';

export default function useHome(onStartGame: (code: string) => void) {
  const getFormFromPath = (): 'home' | 'create' | 'join' => {
    const path = window.location.pathname;
    if (path === '/play/online/create_game') return 'create';
    if (path === '/play/online/join_game') return 'join';
    return 'home';
  };

  const [activeForm, setActiveFormState] = useState<'home' | 'create' | 'join'>(getFormFromPath);
  const [transitionDirection, setTransitionDirection] = useState<'right' | 'left'>('right');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [timeControl, setTimeControl] = useState(600); // 10 mins default

  // Lobby States
  const [lobbyState, setLobbyState] = useState<'form' | 'waiting_host' | 'waiting_guest'>('form');
  const [createdCode, setCreatedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [pendingGuest, setPendingGuest] = useState<{ socketId: string; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameStarting, setGameStarting] = useState<{ active: boolean; opponentName: string; role: 'white' | 'black' }>({
    active: false,
    opponentName: '',
    role: 'white'
  });

  const setActiveForm = (form: 'home' | 'create' | 'join') => {
    if (activeForm === 'home' && (form === 'create' || form === 'join')) {
      setTransitionDirection('right');
    } else if ((activeForm === 'create' || activeForm === 'join') && form === 'home') {
      setTransitionDirection('left');
    }

    if (form === 'create') {
      window.history.pushState({}, '', '/play/online/create_game');
    } else if (form === 'join') {
      window.history.pushState({}, '', '/play/online/join_game');
    } else {
      window.history.pushState({}, '', '/play');
    }
    setActiveFormState(form);
  };

  useEffect(() => {
    const handlePop = () => {
      const path = window.location.pathname;
      const targetForm = path === '/play/online/create_game' ? 'create' : path === '/play/online/join_game' ? 'join' : 'home';
      
      if (activeForm === 'home' && (targetForm === 'create' || targetForm === 'join')) {
        setTransitionDirection('right');
      } else if ((activeForm === 'create' || activeForm === 'join') && targetForm === 'home') {
        setTransitionDirection('left');
      }
      
      setActiveFormState(targetForm);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [activeForm]);

  useEffect(() => {
    // Setup Socket Listeners
    socket.on('game_created', ({ code, token, gameId, playerId }: { code: string; token: string; gameId: string; playerId: string }) => {
      setCreatedCode(code);
      setLobbyState('waiting_host');
      sessionStore.save({
        gameId,
        playerId,
        role: 'host',
        playerName: nickname,
        token
      });
      setLoading(false);
    });

    socket.on('join_request_received', ({ guestSocketId, nickname }: { guestSocketId: string; nickname: string }) => {
      setPendingGuest({ socketId: guestSocketId, name: nickname });
    });

    socket.on('join_rejected', ({ message }: { message: string }) => {
      setErrorMsg(message || 'Your join request was rejected.');
      setLobbyState('form');
      setActiveForm('home');
      socket.disconnect();
      setLoading(false);
    });

    socket.on('game_started', ({ token, code, gameId, playerId, role, color, opponentName }: { token: string; code: string; gameId: string; playerId: string; role: 'host' | 'guest'; color: 'white' | 'black'; opponentName: string }) => {
      sessionStore.save({
        gameId,
        playerId,
        role,
        playerName: nickname,
        token
      });
      
      setGameStarting({
        active: true,
        opponentName: opponentName || 'Opponent',
        role: color
      });
      setTimeout(() => {
        onStartGame(code);
      }, 3500);
    });

    socket.on('error_message', ({ message }: { message: string }) => {
      setErrorMsg(message);
      setLoading(false);
    });

    return () => {
      socket.off('game_created');
      socket.off('join_request_received');
      socket.off('join_rejected');
      socket.off('game_started');
      socket.off('error_message');
    };
  }, [nickname, onStartGame]);

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg('Please enter a nickname');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    // Connect socket and create game
    socket.connect();
    socket.emit('create_game', { nickname, timeControl });
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg('Please enter a nickname');
      return;
    }
    if (!gameCode.trim()) {
      setErrorMsg('Please enter a game code');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    // 1. Verify game status via API
    const upperCode = gameCode.trim().toUpperCase();
    const verification = await verifyGameCode(upperCode);

    if (!verification.valid) {
      setErrorMsg(verification.error || 'This game lobby is inactive or full');
      setLoading(false);
      return;
    }

    // 2. Connect socket and request join
    socket.connect();
    setLobbyState('waiting_guest');
    socket.emit('join_request', { code: upperCode, nickname });
  };

  const handleAcceptGuest = () => {
    if (!pendingGuest) return;
    socket.emit('respond_join', {
      code: createdCode,
      guestSocketId: pendingGuest.socketId,
      accept: true
    });
    setPendingGuest(null);
  };

  const handleRejectGuest = () => {
    if (!pendingGuest) return;
    socket.emit('respond_join', {
      code: createdCode,
      guestSocketId: pendingGuest.socketId,
      accept: false
    });
    setPendingGuest(null);
  };

  const handleCancelLobby = () => {
    socket.disconnect();
    sessionStore.clear();
    setLobbyState('form');
    setActiveForm('home');
    setCreatedCode('');
    setPendingGuest(null);
    setErrorMsg('');
  };

  const copyToClipboard = () => {
    const gameLink = `${window.location.origin}/online/game/${createdCode || gameCode}`;
    navigator.clipboard.writeText(gameLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return {
    activeForm,
    setActiveForm,
    showHelpModal,
    setShowHelpModal,
    nickname,
    setNickname,
    gameCode,
    setGameCode,
    timeControl,
    setTimeControl,
    lobbyState,
    setLobbyState,
    createdCode,
    copied,
    pendingGuest,
    errorMsg,
    setErrorMsg,
    loading,
    handleCreateGame,
    handleJoinGame,
    handleAcceptGuest,
    handleRejectGuest,
    handleCancelLobby,
    copyToClipboard,
    gameStarting,
    transitionDirection
  };
}
