import React from 'react';
import { Clock, Lock, TrendingUp, Users } from 'lucide-react';

interface FeaturesProps {
  theme: 'dark' | 'light';
}

export const Features: React.FC<FeaturesProps> = ({ theme }) => {
  const list = [
    {
      icon: <Clock className="w-6 h-6 text-blue-500" />,
      title: 'Blitz Mode',
      desc: 'Fast-paced games for quick thinkers.'
    },
    {
      icon: <Lock className="w-6 h-6 text-indigo-400" />,
      title: 'Private & Secure',
      desc: 'End-to-end security for every match.'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      title: 'Skill Progression',
      desc: 'Track stats and improve every day.'
    },
    {
      icon: <Users className="w-6 h-6 text-purple-400" />,
      title: 'Play With Friends',
      desc: 'Invite friends and play together.'
    }
  ];

  return (
    <section id="features" className={`py-16 border-t transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#04060a] border-slate-900' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Section Heading */}
        <div className="space-y-3 mb-12">
          <h2 className={`text-3xl sm:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Why Players Love <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-500 bg-clip-text text-transparent">Shadow Chess</span>
          </h2>
          <p className={`text-sm sm:text-base max-w-xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Experience high-performance, private, and highly interactive online chess matches with a premium suite of tools.
          </p>
        </div>

        {/* Features Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {list.map((item, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border text-left flex flex-col space-y-4 hover:-translate-y-2 hover:scale-[1.03] transition-all duration-300 ease-out cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-900/20 border-slate-800 text-white hover:bg-slate-900/40 hover:border-blue-500/40 hover:shadow-[0_15px_30px_rgba(59,130,246,0.12)]'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-blue-500/30 hover:shadow-[0_15px_30px_rgba(59,130,246,0.08)]'
              }`}
            >
              {/* Icon Container */}
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              
              {/* Card Content */}
              <div className="space-y-1.5">
                <h3 className={`text-base sm:text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
export default Features;
