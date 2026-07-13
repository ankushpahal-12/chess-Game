import React from 'react';
import { Users, Trophy, ChevronRight } from 'lucide-react';

interface HowWorksProps {
  theme: 'dark' | 'light';
  onCreateGame: () => void;
  onJoinGame: () => void;
}

export const HowWorks: React.FC<HowWorksProps> = ({ theme, onCreateGame, onJoinGame }) => {
  const steps = [
    {
      num: 1,
      icon: (
        <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {/* Pawn icon */}
          <path d="M12 2a3 3 0 0 0-3 3c0 1 .4 1.9 1 2.5a5 5 0 0 0-3 4.5h10a5 5 0 0 0-3-4.5c.6-.6 1-1.5 1-2.5a3 3 0 0 0-3-3z" />
          <path d="M6 16c0-2 2-3 6-3s6 1 6 3v2H6v-2z" />
          <path d="M5 21h14" strokeWidth="2.5" />
        </svg>
      ),
      title: 'Create or Join',
      desc: 'Create a new game or join with a game code.'
    },
    {
      num: 2,
      icon: <Users className="w-6 h-6 text-indigo-400" />,
      title: 'Play & Compete',
      desc: 'Enjoy real-time matches with smooth gameplay.'
    },
    {
      num: 3,
      icon: <Trophy className="w-6 h-6 text-amber-500" />,
      title: 'Win & Improve',
      desc: 'Climb the leaderboard and become a champion.'
    }
  ];

  return (
    <section id="how-it-works" className={`py-16 border-t transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#06080f] border-slate-900' : 'bg-white border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col space-y-16">
        
        {/* Section Title */}
        <div className="space-y-3">
          <h2 className={`text-3xl sm:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            How It <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 bg-clip-text text-transparent">Works</span>
          </h2>
          <p className={`text-sm sm:text-base max-w-md mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'}`}>
            Start playing in three simple steps
          </p>
        </div>

        {/* Steps Timeline Row */}
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-6 lg:px-8">
          
          {/* Horizontal connection line for desktop */}
          <div className="hidden lg:block absolute top-[52px] left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-slate-800/80 -z-0" />

          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center max-w-[280px] space-y-4 z-10">
              
              {/* Step Icon & Number Badge */}
              <div className="relative">
                <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white shadow-indigo-950/10'
                    : 'bg-slate-50 border-slate-200 text-slate-800 shadow-slate-200/50'
                }`}>
                  {step.icon}
                </div>
                
                {/* Step Number Badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 border-2 border-[#06080f] text-white text-xs font-black flex items-center justify-center shadow-xs">
                  {step.num}
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-1.5">
                <h3 className={`text-lg font-extrabold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{step.desc}</p>
              </div>
            </div>
          ))}

        </div>

        {/* Bottom Banner Callout */}
        <div className="bg-gradient-to-r from-blue-900/10 via-indigo-950/10 to-blue-900/10 border border-slate-800/30 p-8 sm:p-10 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 text-left relative overflow-hidden">
          
          {/* Left background light decoration */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 rounded-full bg-blue-500/5 blur-[50px] pointer-events-none" />

          <div className="flex items-center gap-6 z-10">
            {/* SVG Rook & Queen icons */}
            <div className="hidden sm:flex gap-2">
              <svg className="w-10 h-10 text-blue-500/80 drop-shadow-[0_2px_4px_rgba(59,130,246,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Rook path */}
                <path d="M5 20h14v2H5v-2zM6 17h12v3H6v-3zM8 10h8v7H8v-7zM5 5v5h14V5h-3V8h-2V5h-2V8H10V5H8v3H6V5H5z" fill="currentColor" fillOpacity="0.1" />
              </svg>
              <svg className="w-10 h-10 text-indigo-400/80 drop-shadow-[0_2px_4px_rgba(129,140,248,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Queen path */}
                <path d="M12 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3zM12 7l-4 6-4-8 2 12h12l2-12-4 8-4-6z" fill="currentColor" fillOpacity="0.1" />
                <path d="M6 19h12v2H6v-2z" />
              </svg>
            </div>
            
            <div className="space-y-1">
              <h3 className={`text-xl sm:text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Ready to Make Your Move?</h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Join now and become part of the ultimate chess community.
              </p>
            </div>
          </div>

          <div className="flex gap-4 shrink-0 z-10 w-full md:w-auto">
            <button
              onClick={onCreateGame}
              className="flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5.5 py-3 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer text-sm"
            >
              <span>Create Game</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onJoinGame}
              className={`flex-grow md:flex-grow-0 border font-bold px-5.5 py-3 rounded-xl transition-all active:scale-98 cursor-pointer text-sm ${
                theme === 'dark'
                  ? 'bg-slate-900/40 border-slate-800 text-white hover:bg-slate-800/60'
                  : 'bg-white border-slate-200 text-slate-850 hover:bg-slate-50'
              }`}
            >
              Join Game
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
export default HowWorks;
