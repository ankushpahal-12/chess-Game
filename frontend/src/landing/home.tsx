import React from 'react';
import { Play, Users, Zap, Shield, BarChart2, Smartphone } from 'lucide-react';
import lightChess from '../assets/chess.png';
import darkChess from '../assets/chess2.png';

interface HomeProps {
  theme: 'dark' | 'light';
  onCreateGame: () => void;
  onJoinGame: () => void;
  onPlayOnline: () => void;
  onPlayLocally: () => void;
}

export const Home: React.FC<HomeProps> = ({
  theme,
  onCreateGame,
  onJoinGame
}) => {
  return (
    <div id="home" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative flex flex-col gap-12 sm:gap-16">
      
      {/* 1. Perspective Chessboard Grid Background (Matches the reference photo) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Glow effect blending grid */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[130px]" />
        
        {/* Perspective Grid meetings at vanishing point */}
        <svg 
          className="absolute -bottom-24 -right-16 md:right-10 w-[350px] sm:w-[500px] md:w-[700px] h-[300px] md:h-[450px] opacity-[0.08] dark:opacity-[0.18]" 
          viewBox="0 0 500 300" 
          fill="none"
        >
          <g stroke="currentColor" strokeWidth="1.5" className={theme === 'dark' ? 'text-blue-500' : 'text-indigo-400'}>
            {/* Horizontal checkerboard division lines */}
            <line x1="50" y1="120" x2="450" y2="120" />
            <line x1="30" y1="155" x2="470" y2="155" />
            <line x1="10" y1="195" x2="490" y2="195" />
            <line x1="-20" y1="242" x2="520" y2="242" />
            <line x1="-60" y1="295" x2="560" y2="295" />
            
            {/* Vanishing vertical lines meeting at center top */}
            <line x1="250" y1="50" x2="20" y2="300" />
            <line x1="250" y1="50" x2="90" y2="300" />
            <line x1="250" y1="50" x2="165" y2="300" />
            <line x1="250" y1="50" x2="250" y2="300" />
            <line x1="250" y1="50" x2="335" y2="300" />
            <line x1="250" y1="50" x2="410" y2="300" />
            <line x1="250" y1="50" x2="480" y2="300" />
          </g>
        </svg>
      </div>

      {/* Split Row: Main marketing text & brand chess pieces photo */}
      <div className="flex flex-col md:flex-row gap-10 items-center justify-between">
        
        {/* Left half: Text and play actions */}
        <div className="w-full md:w-7/12 flex flex-col space-y-8 text-left z-10">
          
          {/* Title and Description */}
          <div className="space-y-4">
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              More Than a Game.<br />
              It's a <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.15)]">Battle of Minds.</span>
            </h1>
            <p className={`text-sm sm:text-base leading-relaxed max-w-md ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Play real-time chess online with friends or challenge players worldwide. Secure. Fast. Beautiful.
            </p>
          </div>

          {/* Rating and Daily Match Stats */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-xs">★</span>
              ))}
              <span className={`ml-1.5 ${theme === 'dark' ? 'text-slate-350' : 'text-slate-700'}`}>4.9/5 Rating</span>
            </div>
            <span className="text-slate-800/20 dark:text-slate-100/10">|</span>
            <span className={theme === 'dark' ? 'text-slate-350' : 'text-slate-750'}>
              <b>20,000+</b> Active Matches Daily
            </span>
          </div>

          {/* Action Buttons: Play Online (Create Game) & Play Locally (Join Game) */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={onCreateGame}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer text-xs sm:text-sm"
            >
              <Play className="w-4.5 h-4.5 fill-current" />
              <span>Play Online</span>
            </button>
            <button
              onClick={onJoinGame}
              className={`flex items-center gap-2 border font-bold px-6 py-3.5 rounded-xl transition-all active:scale-98 cursor-pointer text-xs sm:text-sm ${
                theme === 'dark'
                  ? 'bg-slate-900/35 border-slate-800 text-white hover:bg-slate-800/60'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>Play Locally</span>
            </button>
          </div>

          {/* Live Lobbies / Players Active Counter Ticker */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs max-w-sm ${
            theme === 'dark' 
              ? 'bg-slate-950/40 border-slate-900 text-slate-400' 
              : 'bg-white border-slate-200 text-slate-655 shadow-xs'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Active Lobbies: <b className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>1,424</b></span>
            </div>
            <div className="flex items-center gap-2">
              <span>Online: <b className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>12,492</b></span>
            </div>
          </div>

        </div>

        {/* Right half: Brand chess pieces photo (Hidden on mobile) */}
        <div className="hidden md:flex md:w-5/12 items-center justify-center relative min-h-[250px] z-10">
          <img
            src={theme === 'dark' ? darkChess : lightChess}
            alt="Shadow Chess Pieces"
            className="w-full max-w-[440px] h-auto object-contain drop-shadow-[0_20px_50px_rgba(59,130,246,0.22)] rounded-2xl"
          />
        </div>

      </div>

      {/* Horizontal features bullets list (Full Width, single horizontal line) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-10 border-t border-slate-800/30 z-10 text-left">
        <div className="flex gap-3 pl-0">
          <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <h4 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Real-time Play</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 leading-tight">Instant matchmaking and smooth gameplay</p>
          </div>
        </div>
        <div className="flex gap-3 pl-0 lg:pl-6 lg:border-l lg:border-slate-800/25">
          <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Secure &amp; Private</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 leading-tight">Your data and games are always protected</p>
          </div>
        </div>
        <div className="flex gap-3 pl-0 lg:pl-6 lg:border-l lg:border-slate-800/25">
          <BarChart2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h4 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Track Progress</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 leading-tight">Stats, history and performance insights</p>
          </div>
        </div>
        <div className="flex gap-3 pl-0 lg:pl-6 lg:border-l lg:border-slate-800/25">
          <Smartphone className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Mobile Friendly</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 leading-tight">Seamless experience on any device</p>
          </div>
        </div>
      </div>

    </div>
  );
};
export default Home;
