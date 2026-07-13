import React from 'react';
import { Plus, ChevronRight, Users } from 'lucide-react';
import JoinRequestModal from '../components/JoinRequestModal';
import JoinGame from '../components/JoinGame';
import CreateGame from '../components/CreateGame';
import GameStartingModal from '../components/GameStartingModal';
import useHome from '../hooks/useHome';
import lightChess from '../assets/chess4.png';
import darkChess from '../assets/chess2.png';
import { networkService } from '../services/network.service';
import { platformService } from '../services/platform.service';
import { usePing } from '../services/ping.service';

interface HomePageProps {
  onStartGame: (code: string) => void;
  theme: 'dark' | 'light';
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  onGoBack: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onStartGame, theme, setTheme, onGoBack }) => {
  const currentPing = usePing();
  const {
    activeForm,
    setActiveForm,
    showHelpModal,
    setShowHelpModal,
    nickname,
    setNickname,
    gameCode,
    setGameCode,
    timeControl,
    setTimeControl,
    lobbyState,
    createdCode,
    copied,
    pendingGuest,
    errorMsg,
    setErrorMsg,
    loading,
    handleCreateGame,
    handleJoinGame,
    handleAcceptGuest,
    handleRejectGuest,
    handleCancelLobby,
    copyToClipboard,
    gameStarting,
    transitionDirection
  } = useHome(onStartGame);

  const [isOnline, setIsOnline] = React.useState(networkService.isOnline());
  const isNativeMobile = platformService.isNativeMobile();

  React.useEffect(() => {
    const unsubscribe = networkService.subscribe((online) => {
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  return (
    <div className={`relative min-h-screen flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#06080f] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}>
      {/* Background radial glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-all duration-500 ${theme === 'dark' ? 'bg-indigo-950/10' : 'bg-indigo-200/10'
        }`} />

      {/* 1. Header Row */}
      <header className="flex justify-between items-center py-4 max-w-6xl w-full mx-auto z-20">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={onGoBack}>
          {/* Gold Chess King SVG */}
          <svg className="w-9 h-9 drop-shadow-[0_2px_8px_rgba(223,168,65,0.35)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <span className={`text-lg font-black tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>SHADOW</span>
            <span className="text-[10px] font-extrabold tracking-widest text-[#dfa841]">CHESS</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${theme === 'dark'
              ? 'bg-slate-900/40 border-slate-800 text-amber-400 hover:bg-slate-800/80'
              : 'bg-white border-slate-200 text-amber-600 hover:bg-slate-105 shadow-xs'
              }`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            type="button"
          >
            {theme === 'dark' ? (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* How to Play Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${theme === 'dark'
              ? 'bg-slate-900/40 border-slate-800 text-slate-350 hover:text-white hover:bg-slate-800/80'
              : 'bg-white border-slate-200 text-slate-650 hover:text-slate-900 hover:bg-slate-105 shadow-xs'
              }`}
            type="button"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>How to Play</span>
          </button>
        </div>
      </header>

      {/* 2. Middle Row: Main Grid */}
      <main className="flex-grow flex items-center justify-center max-w-6xl w-full mx-auto py-8 lg:py-12 z-10">
        <div className={`w-full items-center transition-all duration-300 ${activeForm === 'home' ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12' : 'flex justify-center'
          }`}>
          {/* Left Column Content */}
          <div className={`${activeForm === 'home' ? 'lg:col-span-6 flex flex-col justify-center space-y-6 text-left' : 'w-full max-w-md flex flex-col justify-center items-center'
            }`}>
            {lobbyState === 'form' && activeForm === 'home' && (
              <div className={`space-y-6 ${transitionDirection === 'left' ? 'animate-slide-left-enter' : 'animate-in fade-in duration-300'}`}>
                {/* Heading */}
                <div className="space-y-3">
                  <h1 className={`text-4xl md:text-5xl font-black tracking-tight leading-[1.1] ${theme === 'dark' ? 'text-white' : 'text-slate-955'
                    }`}>
                    Play Chess <br />
                    <span className="bg-gradient-to-r from-[#dfa841] via-[#fde08a] to-[#dfa841] bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(223,168,65,0.15)] font-black">
                      Online with Friends
                    </span>
                  </h1>
                  <p className={`text-sm md:text-base max-w-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Create a game or join with a code and start playing in real-time.
                  </p>
                </div>

                {/* Cards */}
                <div className="space-y-3.5 max-w-md w-full">
                  {/* Offline Warning Messages */}
                  {!isOnline && (
                    <div className={`p-4 rounded-2xl border text-xs font-semibold leading-normal flex items-start gap-2.5 ${
                      theme === 'dark' ? 'bg-red-950/20 border-red-800/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <span className="text-sm">⚠️</span>
                      <span>
                        {isNativeMobile
                          ? "You're offline. Online play is unavailable, but you can still play Offline Mode."
                          : "No internet connection. Please connect to the internet to play online."}
                      </span>
                    </div>
                  )}

                  {/* Create Game Button Card */}
                  <button
                    onClick={() => { if (isOnline) { setActiveForm('create'); setErrorMsg(''); } }}
                    disabled={!isOnline}
                    className={`w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all select-none ${
                      isOnline
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-950 hover:from-blue-500 hover:to-indigo-850 text-white shadow-lg shadow-indigo-950/15 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group'
                        : 'bg-slate-200/50 dark:bg-slate-900/30 border border-slate-350 dark:border-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                        isOnline ? 'bg-white/10 group-hover:scale-105' : 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                      }`}>
                        <Plus className="w-5.5 h-5.5 stroke-[3px]" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold leading-none">Create Game</h3>
                        <p className={`text-[11px] mt-1 font-medium ${isOnline ? 'text-blue-100/70' : 'text-slate-400 dark:text-slate-600'}`}>Create a new game and invite your friend</p>
                      </div>
                    </div>
                    {isOnline && <ChevronRight className="w-5 h-5 opacity-80 group-hover:translate-x-0.5 transition-transform" />}
                  </button>

                  {/* Join Game Button Card */}
                  <button
                    onClick={() => { if (isOnline) { setActiveForm('join'); setErrorMsg(''); } }}
                    disabled={!isOnline}
                    className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between transition-all select-none ${
                      isOnline
                        ? theme === 'dark'
                          ? 'bg-slate-900/30 border-slate-800/80 text-white hover:bg-slate-900/60 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group'
                          : 'bg-white border-slate-200 text-slate-850 hover:bg-slate-100 shadow-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group'
                        : 'bg-slate-200/50 dark:bg-slate-900/30 border border-slate-350 dark:border-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 ${
                        isOnline
                          ? theme === 'dark' ? 'bg-slate-800 text-slate-300 group-hover:scale-105' : 'bg-slate-150 text-slate-650 group-hover:scale-105'
                          : 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                      }`}>
                        <Users className="w-5 h-5 stroke-[2.5px]" />
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold leading-none">Join Game</h3>
                        <p className={`text-[11px] mt-1 font-medium ${isOnline ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>Join a friend's game using game code</p>
                      </div>
                    </div>
                    {isOnline && <ChevronRight className="w-5 h-5 opacity-80 group-hover:translate-x-0.5 transition-transform" />}
                  </button>

                  {/* Play Offline Button Card (Available only for native mobile app) */}
                  {isNativeMobile && (
                    <button
                      onClick={() => onStartGame('OFFLINE')}
                      className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group ${
                        theme === 'dark'
                          ? 'bg-amber-600/10 border-amber-500/20 text-white hover:bg-amber-600/20'
                          : 'bg-amber-50/50 border-amber-200 text-slate-850 hover:bg-amber-100 shadow-xs'
                      }`}
                      type="button"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 bg-amber-500/20 text-amber-500`}>
                          <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-base md:text-lg font-bold leading-none">Play Offline</h3>
                          <p className={`text-[11px] mt-1 font-medium ${theme === 'dark' ? 'text-amber-400/80' : 'text-amber-700/85'}`}>Play locally on this device with a friend</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 opacity-80 group-hover:translate-x-0.5 transition-transform text-amber-500" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Create Lobby Form */}
            {lobbyState === 'form' && activeForm === 'create' && (
              <div className="w-full animate-slide-right-enter">
                <CreateGame
                  theme={theme}
                  nickname={nickname}
                  setNickname={setNickname}
                  timeControl={timeControl}
                  setTimeControl={setTimeControl}
                  loading={loading}
                  errorMsg={errorMsg}
                  onSubmit={handleCreateGame}
                  onClose={() => setActiveForm('home')}
                />
              </div>
            )}

            {/* Join Lobby Form */}
            {lobbyState === 'form' && activeForm === 'join' && (
              <div className="w-full animate-slide-right-enter">
                <JoinGame
                  theme={theme}
                  nickname={nickname}
                  setNickname={setNickname}
                  gameCode={gameCode}
                  setGameCode={setGameCode}
                  loading={loading}
                  errorMsg={errorMsg}
                  onSubmit={handleJoinGame}
                  onClose={() => setActiveForm('home')}
                />
              </div>
            )}

            {/* Waiting for Host or Guest */}
            {(lobbyState === 'waiting_host' || lobbyState === 'waiting_guest') && (
              <div className={`relative w-full max-w-md rounded-[28px] border p-6 md:p-8 animate-slide-right-enter shadow-2xl transition-all duration-300 ${theme === 'dark'
                ? 'bg-[#0d1321]/95 border-slate-800 text-white'
                : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/30'
                }`}>
                {/* Close Button X */}
                <button
                  type="button"
                  onClick={handleCancelLobby}
                  className={`absolute top-5 right-5 p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-105'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {lobbyState === 'waiting_host' ? (
                  <div className="text-center">
                    {/* Green checkcircle SVG container */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${theme === 'dark'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>

                    <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Game Created Successfully!
                    </h2>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Share this code with your friend
                    </p>

                    {/* Game Code Box */}
                    <div className={`border-2 border-dashed py-4.5 px-6 mt-6 mb-4 relative rounded-2xl ${theme === 'dark'
                      ? 'bg-[#090d16]/30 border-slate-800'
                      : 'bg-slate-50 border-slate-205'
                      }`}>
                      <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${theme === 'dark' ? 'bg-[#0d1321] text-slate-400' : 'bg-white text-slate-550'
                        }`}>
                        Game Code
                      </span>
                      <div className="text-3xl font-black tracking-widest text-center text-emerald-400 font-mono select-all">
                        {createdCode.length === 6 ? `${createdCode.slice(0, 3)}-${createdCode.slice(3)}` : createdCode}
                      </div>
                    </div>

                    {/* Copy Code button */}
                    <div className="flex justify-center mb-2">
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className={`py-2 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98 cursor-pointer ${theme === 'dark'
                          ? 'bg-[#090d16]/50 border-slate-800 text-slate-350 hover:text-white hover:border-slate-700'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        {copied ? (
                          <>
                            <svg className="w-4 h-4 text-emerald-500 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Code Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-slate-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                            Copy Code
                          </>
                        )}
                      </button>
                    </div>

                    <div className={`border-t my-6 ${theme === 'dark' ? 'border-slate-800/80' : 'border-slate-100'}`} />

                    {/* Waiting area with WebSocket Spinner */}
                    <div className="flex items-center gap-3.5 px-1">
                      <div className="relative w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                        <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div className="text-left leading-snug">
                        <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-905'}`}>Waiting for opponent...</h4>
                        <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Share the code and wait for your friend to join. {currentPing !== 0 && currentPing !== -1 && `(ping: ${currentPing}ms)`}
                        </p>
                      </div>
                    </div>
                  </div>
            ) : (
              <div className="text-center flex flex-col items-center w-full">
                {/* 3D Sand Clock Icon in Circular background */}
                <div className="w-28 h-28 rounded-full bg-[#111622] border border-[#1e293b] flex items-center justify-center mx-auto mb-6 shadow-inner shadow-black/40">
                  <img
                    width="70"
                    height="70"
                    src="https://img.icons8.com/3d-fluency/94/sand-clock-1.png"
                    alt="sand-clock-1"
                    className="select-none pointer-events-none animate-pulse"
                  />
                </div>

                <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Request Sent!
                </h2>
                <p className={`text-xs mt-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Please wait while the host responds to your request.
                </p>

                {/* Dotted Process Flow */}
                <div className="flex items-center justify-center gap-2 mt-8 mb-8 w-full">
                  {/* You Circle */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-14 h-14 rounded-full bg-[#111622] border border-[#1e293b] flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-450'}`}>
                      You
                    </span>
                  </div>

                  {/* Blue Progress Dots */}
                  <div className="flex items-center gap-1 px-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>

                  {/* Middle Small Hourglass Circle */}
                  <div className="w-14 h-14 rounded-full bg-[#111622] border border-[#1e293b] flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-slate-300 animate-spin" style={{ animationDuration: '4s' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 2h14M5 22h14M19 2v4a7 7 0 0 1-7 7 7 7 0 0 1-7-7V2M5 22v-4a7 7 0 0 1 7-7 7 7 0 0 1 7 7v4" />
                    </svg>
                  </div>

                  {/* Gold Progress Dots */}
                  <div className="flex items-center gap-1 px-1.5 opacity-60">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dfa841]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dfa841]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#dfa841]" />
                  </div>

                  {/* Host Circle */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-14 h-14 rounded-full bg-[#111622] border border-[#1e293b] flex items-center justify-center shadow-md">
                      <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-1h14v1Z" />
                      </svg>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-450'}`}>
                      Host
                    </span>
                  </div>
                </div>

                {/* Notice Box */}
                <div className={`rounded-2xl border p-4.5 flex items-center justify-center gap-3.5 w-full ${
                  theme === 'dark' ? 'bg-[#111622]/40 border-[#1e293b] text-slate-400' : 'bg-slate-50 border-slate-205 text-slate-600'
                }`}>
                  <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-xs font-semibold text-slate-300">This may take a few moments...</span>
                    {currentPing !== 0 && (
                      <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                        {currentPing === -1 ? 'Connection offline' : `Server Latency: ${currentPing}ms`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
              </div>
            )}
          </div>

          {/* Right Column: Chess pieces photo sitting directly on background (Hidden on mobile) */}
          {activeForm === 'home' && (
            <div className="hidden lg:block lg:col-span-6 w-full h-[520px] animate-in fade-in duration-500 z-10 relative overflow-hidden rounded-2xl">
              <img
                id="chess-pieces-photo"
                src={theme === 'dark' ? darkChess : lightChess}
                alt="Shadow Chess Pieces"
                className={`w-full h-full object-cover select-none pointer-events-none transition-all duration-300 ${theme === 'dark' ? 'mix-blend-screen opacity-95' : 'mix-blend-multiply opacity-95'
                  }`}
              />
              {/* Fade gradient overlay matching page background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${theme === 'dark'
                ? 'from-[#06080f] via-[#06080f]/75 to-transparent'
                : 'from-slate-50 via-slate-50/75 to-transparent'
                } pointer-events-none`} />
            </div>
          )}
        </div>
      </main >

      {/* 3. Bottom Row: Features Footer directly on background */}
      < footer className={`border-t py-8 max-w-6xl w-full mx-auto z-20 transition-colors duration-300 ${theme === 'dark' ? 'border-slate-900' : 'border-slate-200'
        }`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          {/* Fast */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h4 className={`text-base font-bold leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Fast</h4>
              <p className={`text-xs font-medium mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Lightning fast gameplay</p>
            </div>
          </div>

          {/* Free */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dfa841]/10 flex items-center justify-center text-[#dfa841] shrink-0">
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h4 className={`text-base font-bold leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Free</h4>
              <p className={`text-xs font-medium mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>100% free to play</p>
            </div>
          </div>

          {/* Multiplayer */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h4 className={`text-base font-bold leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Multiplayer</h4>
              <p className={`text-xs font-medium mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Play with friends anytime</p>
            </div>
          </div>

          {/* Real-Time */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
              <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className={`text-base font-bold leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Real-Time</h4>
              <p className={`text-xs font-medium mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Real-time moves and updates</p>
            </div>
          </div>
        </div>
      </footer >

      {/* Help Modal */}
      {
        showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className={`relative max-w-md w-full rounded-3xl p-6 border shadow-2xl transition-all duration-300 scale-in duration-200 ${theme === 'dark' ? 'bg-[#0e1321] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-850'
              }`}>
              <h3 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                How to Play Shadow Chess
              </h3>
              <div className={`space-y-3 text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-650'}`}>
                <p>
                  <strong>Shadow Chess</strong> is a real-time multiplayer chess game! It runs standard chess rules with built-in timing controls.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-left">
                  <li><strong>Lobby Creation:</strong> Click "Create Game", choose your nickname, select a time control, and click "Create Lobby".</li>
                  <li><strong>Lobby Invites:</strong> Copy the invite code or share link and send it to your opponent.</li>
                  <li><strong>Joining a Lobby:</strong> Click "Join Game", enter your nickname and the 6-digit room code shared by your host.</li>
                  <li><strong>Gameplay:</strong> Make moves by dragging and dropping pieces. Both players will have timers active during their respective turns.</li>
                </ul>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-905 hover:from-blue-500 hover:to-indigo-850 text-white font-bold transition-all cursor-pointer shadow-md"
                type="button"
              >
                Got it, let's play!
              </button>
            </div>
          </div>
        )
      }

      {/* Accept/Reject guest dialog overlay */}
      {
        pendingGuest && (
          <JoinRequestModal
            guestName={pendingGuest.name}
            onAccept={handleAcceptGuest}
            onReject={handleRejectGuest}
          />
        )
      }

      {/* Game starting transition overlay */}
      {
        gameStarting.active && (
          <GameStartingModal
            opponentName={gameStarting.opponentName}
            role={gameStarting.role}
            theme={theme}
          />
        )
      }
    </div >
  );
};

export default HomePage;
