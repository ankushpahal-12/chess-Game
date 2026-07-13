import React from 'react';
import { Loader2 } from 'lucide-react';
import { usePing } from '../services/ping.service';

interface JoinGameProps {
  theme: 'dark' | 'light';
  nickname: string;
  setNickname: (val: string) => void;
  gameCode: string;
  setGameCode: (val: string) => void;
  loading: boolean;
  errorMsg: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function JoinGame({
  theme,
  nickname,
  setNickname,
  gameCode,
  setGameCode,
  loading,
  errorMsg,
  onSubmit,
  onClose
}: JoinGameProps) {
  const currentPing = usePing();
  return (
    <div className={`relative w-full max-w-md rounded-[28px] border p-6 md:p-8 animate-in fade-in duration-300 shadow-2xl transition-all duration-300 ${
      theme === 'dark'
        ? 'bg-[#0d1321]/95 border-slate-800 text-white'
        : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/30'
    }`}>
      {/* Close Button X */}
      <button
        type="button"
        onClick={onClose}
        className={`absolute top-5 right-5 p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
          theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-105'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Header Icon + Title */}
      <div className="flex items-start gap-4 mb-6">
        {/* Two Men SVG Icon */}
        <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
          theme === 'dark' ? 'bg-[#1b233a]' : 'bg-slate-100'
        }`}>
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 9c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-2.24 7.6C14.65 15.02 17.06 14 20 14c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-6.24c-.55 0-1-.45-1-1v-2.16c0-.52.26-1 .76-1.24z" fill={theme === 'dark' ? '#4a5a80' : '#94a3b8'}/>
            <path d="M9 9c2.21 0 4-1.79 4-4S11.21 1 9 1 5 2.79 5 5s1.79 4 4 4zm-5.6 9.6C4.24 16.02 7.08 15 10 15c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1H3.4c-.55 0-1-.45-1-1v-2.16c0-.52.26-1 .8-1.24z" fill={theme === 'dark' ? '#8fa0c2' : '#475569'}/>
          </svg>
        </div>
        <div className="text-left leading-snug">
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-905'}`}>Join Game</h2>
          <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Enter the game code to join</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-center font-medium animate-shake">
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
              className={`w-full border rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1.5 transition-all text-sm font-semibold ${
                theme === 'dark'
                  ? 'bg-[#090d16] border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-900/20'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-100 shadow-xs'
              }`}
              required
            />
          </div>
        </div>

        {/* Code Input */}
        <div className="space-y-1.5 text-left">
          <label className={`text-xs font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Game Code
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4.5 text-slate-500 text-lg font-extrabold select-none">#</span>
            <input
              type="text"
              maxLength={6}
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              className={`w-full border rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-1.5 transition-all text-sm font-bold tracking-widest ${
                theme === 'dark'
                  ? 'bg-[#090d16] border-slate-800 text-blue-400 placeholder-slate-750 focus:border-blue-500 focus:ring-blue-900/20'
                  : 'bg-white border-slate-200 text-blue-600 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-100 shadow-xs'
              }`}
              required
            />
          </div>
          <span className={`text-[10px] block mt-1.5 font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-slate-450'}`}>
            Ask your friend for the game code.
          </span>
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
              Connecting... {currentPing !== 0 && `(${currentPing === -1 ? 'offline' : `${currentPing}ms`})`}
            </>
          ) : (
            <>
              <svg className="w-4.5 h-4.5 text-white shrink-0 mr-1" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 9c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-2.24 7.6C14.65 15.02 17.06 14 20 14c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-6.24c-.55 0-1-.45-1-1v-2.16c0-.52.26-1 .76-1.24z" fill="rgba(255,255,255,0.7)"/>
                <path d="M9 9c2.21 0 4-1.79 4-4S11.21 1 9 1 5 2.79 5 5s1.79 4 4 4zm-5.6 9.6C4.24 16.02 7.08 15 10 15c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1H3.4c-.55 0-1-.45-1-1v-2.16c0-.52.26-1 .8-1.24z" fill="white"/>
              </svg>
              Join Game
            </>
          )}
        </button>
      </form>
    </div>
  );
}
