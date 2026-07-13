import React from 'react';
import { ChevronRight } from 'lucide-react';
import chess3 from '../assets/chess3.png';

interface AboutProps {
  theme: 'dark' | 'light';
  onSignUpClick: () => void;
  onLearnMoreClick: () => void;
}

export const About: React.FC<AboutProps> = ({ theme, onSignUpClick, onLearnMoreClick }) => {
  return (
    <section id="about" className={`py-16 sm:py-20 border-t transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#04060a] border-slate-900' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading and Marketing details */}
          <div className="lg:col-span-6 text-left flex flex-col space-y-6">
            <div className="space-y-4">
              <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Join the Battle.<br />
                <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 bg-clip-text text-transparent">Master the Game.</span>
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-650'
              }`}>
                Sign up today and start your chess journey. Play matches, challenge other players, review your logs, and improve your skills with every move.
              </p>
            </div>

            {/* List details */}
            <ul className="space-y-3 pt-2">
              {[
                'Play with friends or challenge opponents globally',
                'Advanced real-time matchmaking system',
                'Visual statistics logs and performance charts',
                '100% secure, private, and customizable matches'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <span className={`text-xs sm:text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Buttons */}
            <div className="flex gap-4 pt-4 w-full sm:w-auto">
              <button
                onClick={onSignUpClick}
                className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer text-sm sm:text-base"
              >
                <span>Create Account</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLearnMoreClick}
                className={`flex-grow sm:flex-grow-0 border font-bold px-6 py-3.5 rounded-xl transition-all active:scale-98 cursor-pointer text-sm sm:text-base ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-slate-800 text-white hover:bg-slate-800/60'
                    : 'bg-white border-slate-200 text-slate-850 hover:bg-slate-50'
                }`}
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Right Column: Knight Graphic (Hidden on mobile/tablet) */}
          <div className="hidden lg:flex lg:col-span-6 items-center justify-center relative">
            {/* Background glowing circle */}
            <div className={`absolute w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] rounded-full blur-[80px] pointer-events-none transition-colors duration-500 ${
              theme === 'dark' ? 'bg-blue-600/10' : 'bg-blue-300/10'
            }`} />

            <img
              src={chess3}
              alt="Join the Battle Chess Knight"
              className="w-full max-w-[340px] sm:max-w-[400px] h-auto object-contain drop-shadow-[0_15px_35px_rgba(59,130,246,0.18)] rounded-2xl z-10"
              onError={(e) => {
                // Graceful fallback to chess2 if chess3 is missing/not-placed-yet
                e.currentTarget.src = '/src/assets/chess2.png';
              }}
            />
          </div>

        </div>
      </div>
    </section>
  );
};
export default About;
