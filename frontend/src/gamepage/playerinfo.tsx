import React from 'react';

interface PlayerCardProps {
  name: string;
  role: 'white' | 'black';
  isActive: boolean;
  theme?: 'dark' | 'light';
  isLocal?: boolean;
  time?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  role,
  isActive,
  theme = 'dark',
  isLocal = false,
  time
 }) => {
  const isDark = theme === 'dark';

  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`py-2 px-3.5 rounded-xl border flex items-center justify-between transition-all duration-300 w-full ${
      isActive 
        ? isDark ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-md' : 'bg-blue-50 border-blue-500/30 text-blue-600 shadow-sm'
        : isDark ? 'bg-[#0d1321]/80 border-slate-850 text-slate-350' : 'bg-white border-slate-200 text-slate-700 shadow-xs'
    }`}>
      
      <div className="flex items-center gap-2">
        {/* Status dot */}
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
        <span className="text-xs font-black tracking-tight leading-none">
          {isLocal ? `${name} (You)` : name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border inline-block tracking-wider leading-none ${
          role === 'white'
            ? isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            : 'bg-slate-950 border-slate-900 text-slate-455'
        }`}>
          {role}
        </span>

        {time !== undefined && (
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border leading-none ${
            isActive
              ? 'bg-blue-500/20 border-blue-500/35 text-blue-400 font-extrabold'
              : isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            {formatTime(time)}
          </span>
        )}
      </div>

    </div>
  );
};

interface TurnIndicatorProps {
  theme?: 'dark' | 'light';
  turn: 'w' | 'b';
  playerColor: 'white' | 'black' | null;
}

export const TurnIndicator: React.FC<TurnIndicatorProps> = ({
  theme = 'dark',
  turn,
  playerColor
}) => {
  const isDark = theme === 'dark';
  
  // Decide active player turn
  const isMyTurn = (turn === 'w' && playerColor === 'white') || (turn === 'b' && playerColor === 'black');
  
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 text-xs font-semibold leading-none text-left w-full transition-all ${
      isDark ? 'bg-[#0d1321]/90 border-slate-850' : 'bg-white border-slate-200 shadow-xs'
    }`}>
      {/* Circle color indicator */}
      <span className={`w-3 h-3 rounded-full border shrink-0 shadow-inner ${
        turn === 'w' ? 'bg-white border-slate-350' : 'bg-slate-900 border-slate-700'
      }`} />
      
      <div className="flex flex-col gap-0.5 leading-none">
        <span className={`text-[9px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>Turn</span>
        <span className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {isMyTurn ? 'Your Turn' : "Opponent's Turn"} ({turn === 'w' ? 'White' : 'Black'})
        </span>
      </div>
    </div>
  );
};
