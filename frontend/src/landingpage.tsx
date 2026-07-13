import React from 'react';
import Navbar from './landing/navbar';
import Home from './landing/home';
import Features from './landing/features';
import HowWorks from './landing/howWorks';
import About from './landing/About';

interface LandingPageProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onCreateGame: () => void;
  onJoinGame: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  theme,
  setTheme,
  onCreateGame,
  onJoinGame
}) => {
  
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayNowScroll = () => {
    const playNowSection = document.getElementById('play-now');
    if (playNowSection) {
      playNowSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#06080f] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* 1. Navigation Header Bar */}
      <Navbar
        theme={theme}
        setTheme={setTheme}
        onPlayClick={handlePlayNowScroll}
        onHomeClick={handleScrollToTop}
      />

      {/* 2. Hero Frame Section */}
      <Home
        theme={theme}
        onCreateGame={onCreateGame}
        onJoinGame={onJoinGame}
        onPlayOnline={handlePlayNowScroll}
        onPlayLocally={onCreateGame}
      />

      {/* 3. Core Features Section */}
      <Features theme={theme} />

      {/* 4. Timeline Guides (How it Works) */}
      <HowWorks
        theme={theme}
        onCreateGame={onCreateGame}
        onJoinGame={onJoinGame}
      />

      {/* 5. Marketing Conversion Frame */}
      <About
        theme={theme}
        onSignUpClick={handlePlayNowScroll}
        onLearnMoreClick={handlePlayNowScroll}
      />

      {/* 6. Footer Section */}
      <footer className={`py-12 border-t transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#04060a] border-slate-900' : 'bg-slate-100 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
            
            {/* Left Info Column */}
            <div className="md:col-span-5 flex flex-col space-y-4">
              <div className="flex items-center gap-2">
                {/* Gold Chess King SVG */}
                <svg className="w-8 h-8 drop-shadow-[0_2px_8px_rgba(223,168,65,0.35)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V5M10.5 3.5H13.5" stroke="#dfa841" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M8 8H16M7 11H17M6 14C6 11 8.5 10 12 10C15.5 10 18 11 18 14M9 14V18H15V14" fill="url(#goldGradFooter)" stroke="#dfa841" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M5 20C5 18.5 8 18 12 18C16 18 19 18.5 19 20C19 21.2 16 22 12 22C8 22 5 21.2 5 20Z" fill="url(#goldGradFooter)" stroke="#dfa841" strokeWidth="1.5" />
                  <path d="M9 14H15" stroke="#dfa841" strokeWidth="1.5" />
                  <defs>
                    <linearGradient id="goldGradFooter" x1="6" y1="10" x2="18" y2="22" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#fde08a" />
                      <stop offset="50%" stopColor="#dfa841" />
                      <stop offset="100%" stopColor="#b47b1e" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex flex-col leading-none">
                  <span className={`text-md font-black tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SHADOW</span>
                  <span className="text-[9px] font-extrabold tracking-widest text-[#dfa841]">CHESS</span>
                </div>
              </div>
              <p className={`text-xs sm:text-sm max-w-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-650'}`}>
                The ultimate platform for chess players worldwide.
              </p>
              
              {/* Mock Social Links */}
              <div className="flex gap-3">
                {['f', 't', 'i'].map((ch, idx) => (
                  <button
                    key={idx}
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold hover:scale-105 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        : 'bg-white border-slate-200 text-slate-650 hover:text-slate-900 hover:border-slate-350'
                    }`}
                  >
                    {ch === 'f' && 'FB'}
                    {ch === 't' && 'TW'}
                    {ch === 'i' && 'IG'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-2 flex flex-col space-y-3">
              <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Quick Links</h4>
              {['home', 'play-now', 'features', 'how-it-works', 'about'].map((item) => {
                const label = item === 'play-now' ? 'Play' : item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return (
                  <button
                    key={item}
                    onClick={() => {
                      if (item === 'home') handleScrollToTop();
                      else {
                        const el = document.getElementById(item);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`text-xs hover:underline cursor-pointer text-left ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Support Column */}
            <div className="md:col-span-2 flex flex-col space-y-3">
              <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Support</h4>
              {['Help Center', 'Contact Us', 'Terms of Service', 'Privacy Policy'].map((item) => (
                <button
                  key={item}
                  className={`text-xs hover:underline cursor-pointer text-left ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-650 hover:text-slate-955'}`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Company Column */}
            <div className="md:col-span-3 flex flex-col space-y-3">
              <h4 className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Company</h4>
              {['About Us', 'Careers', 'News', 'Blog'].map((item) => (
                <button
                  key={item}
                  className={`text-xs hover:underline cursor-pointer text-left ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-650 hover:text-slate-955'}`}
                >
                  {item}
                </button>
              ))}
            </div>

          </div>

          {/* Copyright Bottom row */}
          <div className="mt-8 pt-8 border-t border-slate-800/40 text-center">
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-550'}`}>
              &copy; {new Date().getFullYear()} Shadow Chess. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};
export default LandingPage;
