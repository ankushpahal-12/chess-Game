
import { usePing } from '../services/ping.service';
interface GameStartingModalProps {
  opponentName: string;
  role: 'white' | 'black';
  theme: 'dark' | 'light';
}

export default function GameStartingModal({ opponentName, role, theme }: GameStartingModalProps) {
  const isWhite = role === 'white';
  const currentPing = usePing();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-350">
      <div className={`relative max-w-md w-full rounded-[28px] border p-6 md:p-8 animate-in fade-in zoom-in duration-300 shadow-2xl transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-[#0d1321]/95 border-slate-800 text-white'
          : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/30'
      }`}>
        
        {/* Decorative Star Particles around header */}
        <div className="absolute top-10 left-16 text-amber-500/80 animate-pulse text-sm select-none">✦</div>
        <div className="absolute top-6 right-20 text-amber-500/60 animate-pulse text-xs select-none">✦</div>
        <div className="absolute bottom-32 left-10 text-amber-500/50 animate-pulse text-xs select-none">✦</div>
        <div className="absolute top-20 right-12 text-amber-500/90 animate-pulse text-sm select-none">✦</div>

        <div className="text-center">
          {/* Green Circle + Rocket Launch SVG */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border ${
            theme === 'dark'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-emerald-50 border-emerald-100 text-emerald-600'
          }`}>
            <svg className="w-9 h-9 text-emerald-450 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5L13 10l-2-2-6.5 8.5z" />
              <path d="M12 9l9-9-9 9z" />
              <path d="M20 11.5a4.5 4.5 0 0 1-9-9" />
              <path d="M9 15l-3-3" />
              <path d="M15 9l-3-3" />
            </svg>
          </div>

          {/* Header titles */}
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-905'}`}>
            Game Starting!
          </h2>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Get ready to play
          </p>

          {/* Matchup Cards area */}
          <div className="flex items-center justify-center gap-4 mt-8 mb-8">
            
            {/* Left Card: You */}
            <div className={`flex-1 rounded-2xl border p-5 flex flex-col items-center gap-3.5 transition-all duration-300 ${
              isWhite
                ? theme === 'dark'
                  ? 'bg-blue-955/20 border-blue-500/60 shadow-lg shadow-blue-900/10'
                  : 'bg-blue-50 border-blue-200'
                : theme === 'dark'
                  ? 'bg-amber-955/20 border-amber-500/60 shadow-lg shadow-amber-900/10'
                  : 'bg-amber-50 border-amber-200'
            }`}>
              {/* Chess Pawn SVG (White/Dark style depending on role) */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-800/10 dark:bg-slate-900/50">
                <svg className={`w-10 h-10 ${isWhite ? 'text-slate-100 filter drop-shadow-[0_2px_6px_rgba(255,255,255,0.4)]' : 'text-[#dfa841] filter drop-shadow-[0_2px_6px_rgba(223,168,65,0.4)]'}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2a3 3 0 0 0-3 3c0 .87.37 1.66 1 2.22A5 5 0 0 0 7 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1 5 5 0 0 0-3-4.78c.63-.56 1-1.35 1-2.22a3 3 0 0 0-3-3zm-4 13v2h8v-2H8zm-1 4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1H7v1z" />
                </svg>
              </div>
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                You
              </span>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isWhite
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 border border-amber-500/30 text-[#dfa841]'
              }`}>
                {isWhite ? 'White' : 'Black'}
              </span>
            </div>

            {/* VS Separator */}
            <span className={`text-xl font-black tracking-wider ${
              theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
            }`}>
              VS
            </span>

            {/* Right Card: Opponent */}
            <div className={`flex-1 rounded-2xl border p-5 flex flex-col items-center gap-3.5 transition-all duration-300 ${
              !isWhite
                ? theme === 'dark'
                  ? 'bg-blue-955/20 border-blue-500/60 shadow-lg shadow-blue-900/10'
                  : 'bg-blue-50 border-blue-200'
                : theme === 'dark'
                  ? 'bg-amber-955/20 border-amber-500/60 shadow-lg shadow-amber-900/10'
                  : 'bg-amber-50 border-amber-200'
            }`}>
              {/* Chess Pawn SVG (White/Dark style depending on role) */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-800/10 dark:bg-slate-900/50">
                <svg className={`w-10 h-10 ${!isWhite ? 'text-slate-100 filter drop-shadow-[0_2px_6px_rgba(255,255,255,0.4)]' : 'text-[#dfa841] filter drop-shadow-[0_2px_6px_rgba(223,168,65,0.4)]'}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2a3 3 0 0 0-3 3c0 .87.37 1.66 1 2.22A5 5 0 0 0 7 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1 5 5 0 0 0-3-4.78c.63-.56 1-1.35 1-2.22a3 3 0 0 0-3-3zm-4 13v2h8v-2H8zm-1 4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1H7v1z" />
                </svg>
              </div>
              <span className={`text-sm font-bold truncate max-w-[80px] ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                {opponentName}
              </span>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                !isWhite
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 border border-amber-500/30 text-[#dfa841]'
              }`}>
                {!isWhite ? 'White' : 'Black'}
              </span>
            </div>

          </div>

          <p className={`text-xs mt-6 font-semibold select-none ${theme === 'dark' ? 'text-slate-500' : 'text-slate-455'}`}>
            Good luck and have fun! {currentPing !== 0 && currentPing !== -1 && `(ping: ${currentPing}ms)`}
          </p>
        </div>

      </div>
    </div>
  );
}
