import React, { useState } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';

interface NavbarProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onPlayClick: () => void;
  onHomeClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, setTheme, onPlayClick, onHomeClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    if (id === 'home') {
      onHomeClick();
      return;
    }
    if (id === 'play-now') {
      onPlayClick();
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className={`sticky top-0 z-50 w-full backdrop-blur-md border-b transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#06080f]/80 border-slate-800' : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => scrollToSection('home')}>
              {/* Gold Chess King SVG */}
              <svg className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-[0_2px_8px_rgba(223,168,65,0.35)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V5M10.5 3.5H13.5" stroke="#dfa841" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M8 8H16M7 11H17M6 14C6 11 8.5 10 12 10C15.5 10 18 11 18 14M9 14V18H15V14" fill="url(#goldGrad)" stroke="#dfa841" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M5 20C5 18.5 8 18 12 18C16 18 19 18.5 19 20C19 21.2 16 22 12 22C8 22 5 21.2 5 20Z" fill="url(#goldGrad)" stroke="#dfa841" strokeWidth="1.5" />
                <path d="M9 14H15" stroke="#dfa841" strokeWidth="1.5" />
                <defs>
                  <linearGradient id="goldGrad" x1="6" y1="10" x2="18" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fde08a" />
                    <stop offset="50%" stopColor="#dfa841" />
                    <stop offset="100%" stopColor="#b47b1e" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="flex flex-col leading-none text-left">
                <span className={`text-md sm:text-lg font-black tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SHADOW</span>
                <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest text-[#dfa841]">CHESS</span>
              </div>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              {['home', 'play-now', 'features', 'how-it-works', 'about'].map((item) => {
                const label = item === 'play-now' ? 'Play' : item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className={`relative text-xs sm:text-sm font-bold tracking-wide px-3.5 py-2 rounded-xl transition-all duration-300 ease-out cursor-pointer group ${
                      theme === 'dark'
                        ? 'text-slate-300 hover:text-white hover:bg-white/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-900/5'
                    }`}
                    style={{ contentVisibility: 'auto' }}
                  >
                    <span>{label}</span>
                    {/* Sliding underline indicator */}
                    <span className="absolute bottom-1.5 left-[15%] right-[15%] h-[2px] bg-blue-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                  </button>
                );
              })}
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-slate-800 text-amber-400 hover:bg-slate-800/85'
                    : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-50 shadow-xs'
                }`}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                type="button"
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {/* Hamburger Menu Toggle for Mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-xl border flex md:hidden items-center justify-center transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-slate-800 text-slate-350 hover:text-white hover:bg-slate-800/85'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                type="button"
              >
                {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* Slide-over Mobile Sidebar Drawer */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Sidebar Container */}
        <div className={`absolute top-0 right-0 h-full w-64 max-w-xs p-6 shadow-2xl transition-transform duration-300 ease-out border-l ${
          theme === 'dark' 
            ? 'bg-[#0a0d16] border-slate-850 text-white' 
            : 'bg-white border-slate-200 text-slate-800'
        } ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          <div className="flex flex-col space-y-8 text-left h-full">
            {/* Sidebar Header */}
            <div className="flex justify-between items-center pb-4 border-b border-dashed border-slate-800/40">
              <div className="flex items-center gap-2">
                <span className="text-md font-black tracking-wider">SHADOW</span>
                <span className="text-[9px] font-extrabold tracking-widest text-[#dfa841]">CHESS</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  theme === 'dark' ? 'border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Links Stack */}
            <div className="flex flex-col space-y-4">
              {['home', 'play-now', 'features', 'how-it-works', 'about'].map((item) => {
                const label = item === 'play-now' ? 'Play' : item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return (
                  <button
                    key={item}
                    onClick={() => {
                      scrollToSection(item);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-sm font-bold tracking-wide py-2.5 px-3.5 rounded-xl text-left transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'text-slate-300 hover:text-white hover:bg-white/5'
                        : 'text-slate-655 hover:text-slate-900 hover:bg-slate-900/5'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
export default Navbar;
