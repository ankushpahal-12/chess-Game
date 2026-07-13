import React from 'react';
import { useChess } from '../hooks/useChess';
import { ChessBoardWrapper } from '../gamepage/ChessBoardWrapper';
import { GameOverModal } from '../gamepage/GameOverModal';
import { Navbar } from '../gamepage/Navbar';
import { GameDetailsPanel } from '../gamepage/gameCode';
import { PlayerCard, TurnIndicator } from '../gamepage/playerinfo';
import { CapturedPieces } from '../gamepage/capture';
import { MoveHistory } from '../gamepage/MoveHistory';
import { Loader2 } from 'lucide-react';
import { usePing } from '../services/ping.service';
import { ChatSession } from '../chat/services/ChatSession';
import { ChatSessionContext } from '../chat/context/ChatSessionContext';
import { HiddenChat } from '../chat/components/HiddenChat';

interface GamePageProps {
  code: string;
  onGoBack: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({
  code,
  onGoBack,
  theme = 'dark',
  onToggleTheme
}) => {
  const currentPing = usePing();
  const {
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
    connectionState,
    handleMove,
    handleOfferDraw,
    handleRespondDraw,
    handleResign,
    handleLeaveGame,
    timeControl,
    chess
  } = useChess({ code, onGoBack });

  const chatSession = React.useMemo(() => new ChatSession(code, role), [code, role]);

  React.useEffect(() => {
    return () => {
      chatSession.destroy();
    };
  }, [chatSession]);

  // Secure Chat state cleanup on game over or opponent disconnect (session expiration/wiping)
  React.useEffect(() => {
    if (isGameOver || !opponentConnected || code === 'OFFLINE') {
      chatSession.destroy();
    }
  }, [isGameOver, opponentConnected, code, chatSession]);

  const [showRules, setShowRules] = React.useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [showOptionsModal, setShowOptionsModal] = React.useState(false);

  const isPlayerWhite = role === 'white';
  const isSpectator = role === null;

  // Check if we are playing offline (strictly restricted to mobile viewports unless explicitly code === 'OFFLINE')
  const isOffline = code === 'OFFLINE' || ((window.innerWidth < 1024) && (!navigator.onLine || !opponentConnected || connectionState !== 'CONNECTED'));

  const [showConnectingSpinner, setShowConnectingSpinner] = React.useState(() => code !== 'OFFLINE');

  React.useEffect(() => {
    if (code === 'OFFLINE') {
      setShowConnectingSpinner(false);
      return;
    }

    const isMobile = window.innerWidth < 1024;
    if (!isMobile) {
      setShowConnectingSpinner(true);
      return;
    }

    if (!navigator.onLine) {
      setShowConnectingSpinner(false);
      return;
    }

    if (connectionState === 'CONNECTED') {
      setShowConnectingSpinner(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowConnectingSpinner(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [connectionState]);

  // Map clocks correctly based on player color role
  const localPlayerTime = isPlayerWhite ? timers.white : timers.black;
  const opponentTime = isPlayerWhite ? timers.black : timers.white;

  const isLocalTurn = (turn === 'w' && isPlayerWhite) || (turn === 'b' && !isPlayerWhite);

  if (showConnectingSpinner && connectionState !== 'CONNECTED') {
    return (
      <div className={`h-screen overflow-hidden flex flex-col items-center justify-center p-4 md:p-8 max-w-6xl w-full mx-auto relative transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100 bg-[#06080f]' : 'text-slate-800 bg-slate-50'
        }`}>
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center border-4 border-slate-700/30">
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <h2 className="text-xl font-extrabold tracking-wide uppercase mt-2 text-indigo-500">
            {connectionState === 'RECONNECTING' ? 'Reconnecting...' : 'Connecting...'}
          </h2>
          <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">
            {connectionState === 'RECONNECTING' ? 'Restoring Board & Synchronizing Moves...' : 'Re-establishing Server session...'}
          </p>
          {currentPing !== 0 && (
            <span className="text-xs text-slate-500 font-bold tracking-wider uppercase">
              {currentPing === -1 ? 'Server Offline' : `Ping: ${currentPing}ms`}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <ChatSessionContext.Provider value={chatSession}>
      <div className={`h-screen overflow-hidden flex flex-col justify-between transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100 bg-[#06080f]' : 'text-slate-800 bg-slate-50'
        }`}>

      {/* 1. Header Navigation Bar (Fulfills: "timer will go in the navbar") */}
      <Navbar
        theme={theme}
        onToggleTheme={onToggleTheme}
        opponentName={opponentName}
        opponentTime={opponentTime}
        localPlayerName={localPlayerName}
        localPlayerTime={localPlayerTime}
        turn={turn}
        isGameOver={isGameOver}
        isSpectator={isSpectator}
        handleResign={handleResign}
        handleOfferDraw={handleOfferDraw}
        onShowRules={() => setShowRules(true)}
      />

      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className={`absolute top-20 left-20 w-80 h-80 rounded-full blur-[100px] transition-colors duration-300 ${theme === 'dark' ? 'bg-violet-950/10' : 'bg-violet-600/5'
          }`} />
        <div className={`absolute bottom-20 right-20 w-80 h-80 rounded-full blur-[100px] transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-950/10' : 'bg-indigo-600/5'
          }`} />
      </div>

      {/* Connection Loss Alert */}
      {!opponentConnected && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div className="bg-red-950/60 border border-red-800/85 rounded-2xl p-3 flex items-center justify-between text-red-200 text-xs font-semibold animate-pulse z-15">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{disconnectMessage || 'Opponent disconnected. Fallback to local offline play...'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Draw Offer Notification */}
      {pendingDrawOffer && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-2">
          <div className="bg-indigo-950/80 border border-indigo-800/60 rounded-2xl p-3 flex items-center justify-between text-indigo-100 text-xs font-semibold animate-in slide-in-from-top duration-300 z-15">
            <div className="flex items-center gap-2">
              <span>Opponent offered a draw. Accept draw?</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRespondDraw(false)}
                className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={() => handleRespondDraw(true)}
                className="py-1 px-2.5 bg-indigo-650 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Page Grid Content (Matches the mockup 3-column layout) */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-4 z-10 flex flex-col justify-start items-center overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start w-full overflow-hidden">

          {/* COLUMN 1: LEFT SIDEBAR (Game Code details and Move History list) - Hidden on mobile */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-3 h-full justify-start overflow-hidden">
            <GameDetailsPanel
              code={code}
              theme={theme}
              timeControl="10 min"
              movesCount={history.length}
            />
            <MoveHistory history={history} theme={theme} />
          </div>

          {/* COLUMN 2: CENTER (Chessboard canvas and last move status line) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-start gap-2 lg:gap-3 w-full overflow-hidden">

            {/* Offline Mode Banner */}
            {isOffline && (
              <div className="bg-amber-500/10 border border-amber-500/35 text-amber-500 text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-1.5 leading-none select-none tracking-wider uppercase animate-pulse shrink-0">
                {/* <span className="text-xs">⚠️</span> */}
                <span>Offline Mode: Local Play on Single Screen</span>
              </div>
            )}

            {/* King Check Alert Banner */}
            {chess.inCheck() && !isGameOver && (
              <div className="bg-red-500/10 border border-red-500/35 text-red-500 text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-1.5 leading-none select-none tracking-wider uppercase animate-pulse shrink-0">
                <span className="text-xs">⚠️</span>
                <span>
                  {isOffline
                    ? `${turn === 'w' ? 'White' : 'Black'} King is in Check! Solve the check.`
                    : ((role === 'white' && turn === 'w') || (role === 'black' && turn === 'b'))
                      ? "Your King is in Check! Resolve the check."
                      : "Opponent's King is in Check!"}
                </span>
              </div>
            )}

            {/* Mobile View: Opponent Player Card (top of the board) */}
            <div className="lg:hidden w-full max-w-[420px] px-1.5">
              <PlayerCard
                name={opponentName}
                role={isPlayerWhite ? 'black' : 'white'}
                isActive={!isLocalTurn && !isGameOver}
                theme={theme}
                time={opponentTime}
              />
            </div>

            {/* Chessboard container wrapper */}
            <div className={`p-2 rounded-2xl border transition-all duration-300 w-full max-w-[440px] flex items-center justify-center ${theme === 'dark' ? 'bg-[#0d1321]/60 border-slate-850/80 shadow-2xl' : 'bg-white border-slate-200 shadow-md shadow-slate-100/50'
              }`}>
              <ChessBoardWrapper
                fen={fen}
                role={role}
                turn={turn}
                onMove={handleMove}
                chess={chess}
                isGameOver={isGameOver}
                isOffline={isOffline}
                isBlocked={
                  isGameOver ||
                  isOffline ||
                  !opponentConnected ||
                  connectionState !== 'CONNECTED' ||
                  pendingDrawOffer !== null ||
                  showLeaveConfirm ||
                  showOptionsModal
                }
              />
            </div>

            {/* Mobile View: Local Player Card (bottom of the board) */}
            <div className="lg:hidden w-full max-w-[420px] px-1.5 flex flex-col gap-2">
              <PlayerCard
                name={localPlayerName || 'You'}
                role={isPlayerWhite ? 'white' : 'black'}
                isActive={isLocalTurn && !isGameOver}
                theme={theme}
                isLocal={true}
                time={localPlayerTime}
              />

              {isOffline ? (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="w-full mt-1.5 py-3.5 rounded-xl bg-red-650 hover:bg-red-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 border border-red-800/20"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3v1" />
                  </svg>
                  <span>Leave Game</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowOptionsModal(true)}
                  className={`w-full mt-1.5 py-3.5 rounded-xl border font-extrabold text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-850 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-250 text-slate-750 hover:bg-slate-50'
                    }`}
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Game Options</span>
                </button>
              )}
            </div>

            {/* Bottom Status line showing latest move played - Hidden on Mobile */}
            {history.length > 0 && (
              <div className={`hidden lg:block px-4 py-2 rounded-full border text-[11px] font-bold leading-none ${theme === 'dark' ? 'bg-slate-955/60 border-slate-850 text-slate-350' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                <span className="text-blue-500 mr-1.5">●</span>
                <span>
                  {history.length % 2 === 0 ? opponentName : localPlayerName} played <b>{history[history.length - 1]}</b>
                </span>
              </div>
            )}

          </div>

          {/* COLUMN 3: RIGHT SIDEBAR (Player Cards, Turn Indicator, Captured Pieces) - Hidden on mobile */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-3 h-full justify-start overflow-hidden">
            {/* Opponent Player Card (Rahul, Black) */}
            <PlayerCard
              name={opponentName}
              role={isPlayerWhite ? 'black' : 'white'}
              isActive={!isLocalTurn && !isGameOver}
              theme={theme}
              time={opponentTime}
            />

            {/* Turn Status indicator badge */}
            <TurnIndicator
              theme={theme}
              turn={turn}
              playerColor={role}
            />

            {/* Local Player Card (You, White) */}
            <PlayerCard
              name={localPlayerName || 'You'}
              role={isPlayerWhite ? 'white' : 'black'}
              isActive={isLocalTurn && !isGameOver}
              theme={theme}
              isLocal={true}
              time={localPlayerTime}
            />

            {/* Captured Pieces card */}
            <CapturedPieces fen={fen} theme={theme} />
          </div>

        </div>
      </main>

      {/* Game Over modal triggers */}
      {isGameOver && (() => {
        const initialMs = (timeControl || 600) * 1000;
        const elapsedMs = (2 * initialMs) - (timers.white + timers.black);
        const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const gameTimeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        return (
          <GameOverModal
            winner={winner}
            reason={gameOverReason || 'Match completed.'}
            onGoBack={handleLeaveGame}
            isOffline={isOffline}
            gameTime={gameTimeStr}
            onPlayAgain={handleLeaveGame}
          />
        );
      })()}

      {/* Rules Help Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`relative max-w-md w-full rounded-3xl p-6 border shadow-2xl transition-all duration-300 scale-in duration-200 ${theme === 'dark' ? 'bg-[#0d1321]/95 border-slate-800 text-white' : 'bg-white border-slate-250 text-slate-800'
            }`}>
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">
              How to Play Shadow Chess
            </h3>
            <div className={`space-y-3 text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <p>Standard chess rules apply. Each player has a set timing countdown. The match ends on checkmate, resignation, draw offers, or time expiration.</p>
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Leave Game Confirmation Modal (Offline Mode) */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`relative max-w-xs w-full rounded-3xl p-6 border shadow-2xl transition-all scale-in duration-200 ${theme === 'dark' ? 'bg-[#0d1321] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}>
            <h3 className="text-lg font-black mb-2 flex items-center gap-2 text-red-500">
              Leave Game?
            </h3>
            <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Are you sure you want to leave? Your local offline game state will be lost.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-705 hover:bg-slate-100'
                  }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  handleLeaveGame();
                }}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Options Modal (Online Mode) */}
      {showOptionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`relative max-w-xs w-full rounded-3xl p-6 border shadow-2xl transition-all scale-in duration-200 ${theme === 'dark' ? 'bg-[#0d1321] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowOptionsModal(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-105'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              ⚙️ Game Options
            </h3>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowOptionsModal(false);
                  handleOfferDraw();
                }}
                disabled={isGameOver || isSpectator}
                className={`w-full py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-805 text-slate-200 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-750 hover:bg-slate-100'
                  } disabled:opacity-40 disabled:pointer-events-none`}
              >
                🤝 Offer Draw
              </button>

              <button
                onClick={() => {
                  setShowOptionsModal(false);
                  handleResign();
                }}
                disabled={isGameOver || isSpectator}
                className={`w-full py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-805 text-red-400 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-red-650 hover:bg-slate-105'
                  } disabled:opacity-40 disabled:pointer-events-none`}
              >
                🏳️ Resign Match
              </button>

              <button
                onClick={() => {
                  setShowOptionsModal(false);
                  setShowRules(true);
                }}
                className={`w-full py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-805 text-slate-200 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-750 hover:bg-slate-100'
                  }`}
              >
                📖 How to Play
              </button>

              <button
                onClick={() => {
                  setShowOptionsModal(false);
                  if (onToggleTheme) onToggleTheme();
                }}
                className={`w-full py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-805 text-slate-200 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-750 hover:bg-slate-100'
                  }`}
              >
                🌗 Toggle Theme
              </button>

              <div className={`border-t my-1.5 ${theme === 'dark' ? 'border-slate-800/80' : 'border-slate-100'}`} />

              <button
                onClick={() => {
                  setShowOptionsModal(false);
                  handleLeaveGame();
                }}
                className="w-full py-3 bg-red-650 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2"
              >
                🚪 Leave Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Secure Chat Drawer */}
      <HiddenChat theme={theme} />

      </div>
    </ChatSessionContext.Provider>
  );
};
export default GamePage;
