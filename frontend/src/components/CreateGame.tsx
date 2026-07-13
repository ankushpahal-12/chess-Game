import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { usePing } from '../services/ping.service';

interface CreateGameProps {
  theme: 'dark' | 'light';
  nickname: string;
  setNickname: (val: string) => void;
  timeControl: number;
  setTimeControl: (val: number) => void;
  loading: boolean;
  errorMsg: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const timeOptions = [
  { label: '10 Minutes', value: 600 },
  { label: '30 Minutes', value: 1800 }
];

export default function CreateGame({
  theme,
  nickname,
  setNickname,
  timeControl,
  setTimeControl,
  loading,
  errorMsg,
  onSubmit,
  onClose
}: CreateGameProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const currentPing = usePing();
  const selectedOpt = timeOptions.find(o => o.value === timeControl) || timeOptions[0];

  return (
    <div className={`relative w-full max-w-md rounded-[28px] border p-6 md:p-8 animate-in fade-in duration-300 shadow-2xl transition-all duration-300 ${theme === 'dark'
      ? 'bg-[#0d1321]/95 border-slate-800 text-white'
      : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/30'
      }`}>
      {/* Close Button X */}
      <button
        type="button"
        onClick={onClose}
        className={`absolute top-5 right-5 p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-105'
          }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header Icon + Title */}
      <div className="flex items-start gap-4 mb-6">
        {/* Blue Circle + King SVG Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/30' : 'bg-blue-50 text-blue-600'
          }`}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2a1 1 0 0 1 1 1v1H13.5a1 1 0 0 1 0 2H13v2.12c2.44.46 4.31 2.37 4.5 4.88H6.5c.19-2.51 2.06-4.42 4.5-4.88V6H9.5a1 1 0 1 1 0-2H11V3a1 1 0 0 1 1-1zM6 16h12v2H6v-2zm-1 4h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2z" />
          </svg>
        </div>
        <div className="text-left leading-snug">
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-905'}`}>Create Game</h2>
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Set up your game and invite a friend</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 rounded-xl bg-red-955/40 border border-red-800/50 text-red-300 text-xs text-center font-medium animate-shake">
          {errorMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name Input */}
        <div className="space-y-1.5 text-left">
          <label className={`text-xs font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Your Name
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4.5 pointer-events-none text-slate-500">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              maxLength={15}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your name"
              className={`w-full border rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1.5 transition-all text-sm font-semibold ${theme === 'dark'
                ? 'bg-[#090d16] border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-900/20'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-100 shadow-xs'
                }`}
              required
            />
          </div>
        </div>

        {/* Time Control Dropdown */}
        <div className="space-y-1.5 text-left relative">
          <label className={`text-xs font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Time Control
          </label>

          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full border rounded-xl px-4 py-3.5 flex items-center justify-between transition-all text-sm font-semibold cursor-pointer ${theme === 'dark'
              ? 'bg-[#090d16] border-slate-800 text-white focus:border-blue-500 focus:ring-[#2563eb]/20'
              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-blue-100 shadow-xs'
              }`}
          >
            <div className="flex items-center gap-3">
              {/* Clock Outline Icon */}
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{selectedOpt.label}</span>
            </div>
            {/* Chevron Down */}
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Helper info text below the select box */}
          <span className={`text-[10px] block mt-1.5 font-medium ${theme === 'dark' ? 'text-slate-550' : 'text-slate-450'}`}>
            Choose how much time each player will have.
          </span>

          {/* Absolute Options List */}
          {dropdownOpen && (
            <>
              {/* Backdrop overlay to close when clicking outside */}
              <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />

              <div className={`absolute left-0 right-0 mt-1.5 rounded-xl border p-1.5 shadow-2xl z-40 animate-in fade-in slide-in-from-top-2 duration-150 ${theme === 'dark'
                ? 'bg-[#0b0f19] border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                }`}>
                {timeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTimeControl(opt.value);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${timeControl === opt.value
                      ? 'bg-blue-600 text-white'
                      : theme === 'dark'
                        ? 'hover:bg-slate-900 text-slate-300'
                        : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {timeControl === opt.value && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-900 hover:from-blue-500 hover:to-indigo-850 disabled:from-slate-800 disabled:to-slate-800 text-white text-sm font-bold shadow-lg shadow-indigo-950/20 flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              Creating... {currentPing !== 0 && `(${currentPing === -1 ? 'offline' : `${currentPing}ms`})`}
            </>
          ) : (
            <>
              {/* Chess King SVG inside button */}
              <svg className="w-4.5 h-4.5 text-white shrink-0 mr-1" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2a1 1 0 0 1 1 1v1H13.5a1 1 0 0 1 0 2H13v2.12c2.44.46 4.31 2.37 4.5 4.88H6.5c.19-2.51 2.06-4.42 4.5-4.88V6H9.5a1 1 0 1 1 0-2H11V3a1 1 0 0 1 1-1zM6 16h12v2H6v-2zm-1 4h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2z" />
              </svg>
              Create Game
            </>
          )}
        </button>
      </form>
    </div>
  );
}
