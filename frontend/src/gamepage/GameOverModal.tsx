import React from 'react';

interface GameOverModalProps {
  winner: 'white' | 'black' | 'draw' | null;
  reason: string;
  onGoBack: () => void;
  isOffline?: boolean;
  gameTime?: string;
  onPlayAgain?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  reason,
  onGoBack,
  isOffline = false,
  gameTime = '0:00',
  onPlayAgain
}) => {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  const isOnlineDraw = winner === 'draw' && !isOffline;

  // Format reason nicely
  let displayReason = reason;
  if (reason.toLowerCase().includes('agreement') || reason.toLowerCase().includes('mutual')) {
    displayReason = 'Draw Agreed';
  } else if (reason.toLowerCase().includes('stalemate')) {
    displayReason = 'Stalemate';
  } else if (reason.toLowerCase().includes('threefold')) {
    displayReason = 'Threefold Repetition';
  } else if (reason.toLowerCase().includes('material')) {
    displayReason = 'Insufficient Material';
  } else if (reason.toLowerCase().includes('50-move')) {
    displayReason = '50-Move Rule';
  }

  // Draw Agreed Screen for Online Mode on Mobile (as per mockup)
  if (isOnlineDraw && isMobile) {
    return (
      <div className="fixed inset-0 bg-[#06080f] flex flex-col items-center justify-center z-55 p-6">
        <div className="max-w-xs w-full flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
          {/* Handshake Icon in Circular background */}
          <div className="w-32 h-32 rounded-full bg-[#111622] border border-[#1e293b] flex items-center justify-center mb-8 shadow-inner shadow-black/40">
            <span className="text-5xl select-none">🤝</span>
          </div>

          {/* Heading */}
          <h3 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Game Drawn</h3>

          {/* Subtitle / Reason */}
          <p className="text-slate-400 font-semibold text-sm mb-8">
            {displayReason}
          </p>

          {/* Game Time badge */}
          <div className="px-5 py-2.5 bg-[#111622] border border-[#1e293b]/70 rounded-xl text-slate-300 font-bold text-xs mb-14 tracking-wide">
            Game Time: {gameTime}
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={onPlayAgain || onGoBack}
              className="w-full py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-97"
            >
              Play Again
            </button>
            <button
              onClick={onGoBack}
              className="w-full py-4 bg-[#111622] hover:bg-[#1a2235] text-slate-300 font-extrabold text-sm rounded-2xl transition-all border border-[#1e293b] cursor-pointer active:scale-97"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to desktop/standard modal layout
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in duration-300">
        {winner === 'draw' ? (
          <div className="w-16 h-16 bg-slate-800/60 border border-slate-700 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🤝
          </div>
        ) : (
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20 text-3xl">
            🏆
          </div>
        )}
        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
          {winner === 'draw' ? 'GAME DRAWN' : 'GAME OVER'}
        </h3>
        
        <p className="text-slate-400 font-medium text-sm mb-6">
          {reason}
        </p>

        <div className="bg-slate-950/60 border border-slate-850 rounded-xl py-4 mb-6">
          {winner === 'draw' ? (
            <div className="flex flex-col gap-1">
              <span className="text-lg font-bold text-slate-300">{displayReason}</span>
              <span className="text-xs text-slate-500">Game Time: {gameTime}</span>
            </div>
          ) : (
            <span className="text-lg font-bold text-indigo-400 uppercase tracking-wider">
              {winner === 'white' ? 'White' : 'Black'} Player Wins
            </span>
          )}
        </div>

        <div className="space-y-3">
          {winner === 'draw' && !isOffline && (
            <button
              onClick={onPlayAgain || onGoBack}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all active:scale-97 shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              Play Again
            </button>
          )}
          <button
            onClick={onGoBack}
            className={`w-full py-3 px-4 rounded-xl font-bold transition-all active:scale-97 cursor-pointer ${
              winner === 'draw' && !isOffline
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-[#2a3656]'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/20'
            }`}
          >
            {winner === 'draw' && !isOffline ? 'Back to Home' : 'Return to Lobby'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default GameOverModal;

