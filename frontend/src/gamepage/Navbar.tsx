import React from 'react';
import { Flag, HelpCircle, Volume2, VolumeX, Settings, Swords } from 'lucide-react';
import { usePing } from '../services/ping.service';

interface NavbarProps {
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  opponentName: string;
  opponentTime: number;
  localPlayerName: string;
  localPlayerTime: number;
  turn: 'w' | 'b';
  isGameOver: boolean;
  isSpectator?: boolean;
  handleResign: () => void;
  handleOfferDraw: () => void;
  onShowRules: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme = 'dark',
  onToggleTheme,
  opponentName,
  opponentTime,
  localPlayerName,
  localPlayerTime,
  turn,
  isGameOver,
  isSpectator = false,
  handleResign,
  handleOfferDraw,
  onShowRules
}) => {
  const currentPing = usePing();
  const [muted, setMuted] = React.useState(false);
  const isDark = theme === 'dark';

  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <nav className={`w-full border-b transition-colors duration-300 ${
      isDark ? 'bg-[#06080f]/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            {/* Gold Chess King Logo */}
            <svg className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-[0_2px_6px_rgba(223,168,65,0.25)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2V5M10.5 3.5H13.5" stroke="#dfa841" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M8 8H16M7 11H17M6 14C6 11 8.5 10 12 10C15.5 10 18 11 18 14M9 14V18H15V14" fill="url(#goldGradNavbar)" stroke="#dfa841" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M5 20C5 18.5 8 18 12 18C16 18 19 18.5 19 20C19 21.2 16 22 12 22C8 22 5 21.2 5 20Z" fill="url(#goldGradNavbar)" stroke="#dfa841" strokeWidth="1.5" />
              <path d="M9 14H15" stroke="#dfa841" strokeWidth="1.5" />
              <defs>
                <linearGradient id="goldGradNavbar" x1="6" y1="10" x2="18" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fde08a" />
                  <stop offset="50%" stopColor="#dfa841" />
                  <stop offset="100%" stopColor="#b47b1e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col leading-none text-left">
              <span className={`text-md sm:text-lg font-black tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>SHADOW</span>
              <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest text-[#dfa841]">CHESS</span>
            </div>

            {/* Real-time Ping Indicator */}
            {currentPing !== 0 && (
              <div className={`ml-2 px-2 py-0.5 rounded-lg border text-[9px] font-bold flex items-center gap-1.5 leading-none select-none ${
                currentPing === -1
                  ? 'bg-red-500/10 border-red-500/20 text-red-500'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              }`}>
                <span className={`w-1 h-1 rounded-full ${currentPing === -1 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span>{currentPing === -1 ? 'Offline' : `${currentPing} ms`}</span>
              </div>
            )}
          </div>

          {/* Center Info: Turn status & Active Timers (Fulfills: "timer will go in the navbar") */}
          <div className="hidden sm:flex items-center gap-3.5">
            {/* White vs Black Timer Pill */}
            <div className={`flex items-center gap-3.5 px-4.5 py-2.5 rounded-2xl border text-xs font-mono font-bold leading-none ${
              isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${turn === 'w' && !isGameOver ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className={isDark ? 'text-slate-350' : 'text-slate-700'}>{opponentName.slice(0, 8)}: <b className="text-blue-500 font-extrabold text-sm">{formatTime(opponentTime)}</b></span>
              </div>
              <span className="opacity-30">|</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${turn === 'b' && !isGameOver ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className={isDark ? 'text-slate-350' : 'text-slate-700'}>{localPlayerName.slice(0, 8)}: <b className="text-blue-500 font-extrabold text-sm">{formatTime(localPlayerTime)}</b></span>
              </div>
            </div>
          </div>

          {/* Action buttons on the right - Hidden on Mobile */}
          <div className="hidden lg:flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={handleResign}
              disabled={isGameOver || isSpectator}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all ${
                isDark 
                  ? 'bg-slate-900/35 border-slate-850 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-55 shadow-xs'
              }`}
              type="button"
            >
              <Flag className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden md:inline">Resign</span>
            </button>

            <button
              onClick={handleOfferDraw}
              disabled={isGameOver || isSpectator}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none transition-all ${
                isDark 
                  ? 'bg-slate-900/35 border-slate-855 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-55 shadow-xs'
              }`}
              type="button"
            >
              <Swords className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Offer Draw</span>
            </button>

            <button
              onClick={onShowRules}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                isDark 
                  ? 'bg-slate-900/35 border-slate-855 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-55 shadow-xs'
              }`}
              type="button"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden md:inline">Rules</span>
            </button>

            {/* Volume Speaker icon button */}
            <button
              onClick={() => setMuted(!muted)}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900/35 border-slate-855 text-slate-400 hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-55'
              }`}
              type="button"
            >
              {muted ? <VolumeX className="w-4.5 h-4.5 text-red-400" /> : <Volume2 className="w-4.5 h-4.5 text-emerald-450" />}
            </button>

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-900/35 border-slate-855 text-amber-400 hover:text-white' 
                    : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-55'
                }`}
                type="button"
                title="Toggle Theme"
              >
                {isDark ? (
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.91 10.91l1.59 1.59M3 12h2.25m13.5 0H21M4.95 19.05l1.59-1.59m10.91-10.91l1.59-1.59M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
                  </svg>
                ) : (
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>
            )}

            {/* Settings gear icon button */}
            <button
              className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-900/35 border-slate-855 text-slate-400 hover:text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-55'
              }`}
              type="button"
            >
              <Settings className="w-4.5 h-4.5 text-slate-400" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};
export default Navbar;
