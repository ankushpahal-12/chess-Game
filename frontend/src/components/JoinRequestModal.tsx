import React, { useState, useEffect } from 'react';
import { usePing } from '../services/ping.service';

interface JoinRequestModalProps {
  guestName: string;
  onAccept: () => void;
  onReject: () => void;
}

export const JoinRequestModal: React.FC<JoinRequestModalProps> = ({ guestName, onAccept, onReject }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const currentPing = usePing();

  // 30 seconds auto-expiration countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onReject]);

  // Determine global theme from body/document root class
  const isDark = document.documentElement.classList.contains('dark');
  const theme = isDark ? 'dark' : 'light';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className={`relative max-w-sm w-full rounded-[28px] border p-6 md:p-8 animate-in fade-in zoom-in duration-200 shadow-2xl transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-[#0d1321]/95 border-slate-800 text-white'
          : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/30'
      }`}>
        
        {/* Close Button X */}
        <button
          type="button"
          onClick={onReject}
          className={`absolute top-5 right-5 p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
            theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-105'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          {/* Gold Circle + Users Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border ${
            theme === 'dark'
              ? 'bg-[#dfa841]/10 border-[#dfa841]/20'
              : 'bg-[#dfa841]/5 border-[#dfa841]/10'
          }`}>
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 9c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-2.24 7.6C14.65 15.02 17.06 14 20 14c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-6.24c-.55 0-1-.45-1-1v-2.16c0-.52.26-1 .76-1.24z" fill={theme === 'dark' ? '#b47b1e' : '#a1a1aa'}/>
              <path d="M9 9c2.21 0 4-1.79 4-4S11.21 1 9 1 5 2.79 5 5s1.79 4 4 4zm-5.6 9.6C4.24 16.02 7.08 15 10 15c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1H3.4c-.55 0-1-.45-1-1v-2.16c0-.52.26-1 .8-1.24z" fill="#dfa841"/>
            </svg>
          </div>

          {/* Header text */}
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Join Request
          </h2>
          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {guestName} wants to join your game.
          </p>

          {/* Guest Detail Box */}
          <div className={`border rounded-2xl p-4 flex items-center gap-4 mt-6 mb-6 text-left ${
            theme === 'dark'
              ? 'bg-[#090d16]/40 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}>
            {/* Avatar circle with single silhouetted player */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              theme === 'dark' ? 'bg-slate-850 text-slate-300' : 'bg-slate-200 text-slate-600'
            }`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <h4 className={`font-bold text-base leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {guestName}
              </h4>
              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                New Player
              </p>
            </div>
          </div>

          {/* Action Buttons: Accept / Reject */}
          <div className="flex gap-4">
            {/* Green Accept Button */}
            <button
              onClick={onAccept}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-950/10"
            >
              <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Accept
            </button>

            {/* Red Reject Button */}
            <button
              onClick={onReject}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-950/10"
            >
              <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Reject
            </button>
          </div>

          {/* Expiration timer */}
          <div className={`text-center text-[10px] font-semibold mt-5 ${
            theme === 'dark' ? 'text-slate-500' : 'text-slate-455'
          }`}>
            Request expires in {timeLeft}s {currentPing !== 0 && currentPing !== -1 && `| Ping: ${currentPing}ms`}
          </div>
        </div>

      </div>
    </div>
  );
};

export default JoinRequestModal;
