import { useEffect, useState } from 'react';
import { HomePage } from './pages/HomePage';
import GamePage from './pages/GamePage';
import { LandingPage } from './landingpage';
import { sessionStore } from './services/sessionStore';
import { pingService, usePing } from './services/ping.service';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [route, setRoute] = useState<{ page: 'landing' | 'home' | 'game'; code?: string }>(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/play\/online\/game\/([A-Z0-9]{6})$/i);
    if (match) {
      const session = sessionStore.get();
      if (session && session.gameId) {
        return { page: 'game', code: match[1].toUpperCase() };
      }
    }
    if (path.toUpperCase() === '/PLAY/ONLINE/GAME/OFFLINE') {
      return { page: 'game', code: 'OFFLINE' };
    }
    if (path === '/play' || path === '/play/online/create_game' || path === '/play/online/join_game') {
      return { page: 'home' };
    }
    return { page: 'landing' };
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  const [isValidating, setIsValidating] = useState(false);
  const currentPing = usePing();

  useEffect(() => {
    pingService.startPinging();
    return () => {
      pingService.stopPinging();
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [transitionDirection, setTransitionDirection] = useState<'right' | 'left'>('right');

  const navigateTo = (page: 'landing' | 'home' | 'game', code?: string) => {
    if (page === 'game' && code) {
      setTransitionDirection('right');
      window.history.pushState({}, '', `/play/online/game/${code}`);
      setRoute({ page: 'game', code });
    } else if (page === 'home') {
      setTransitionDirection('right');
      window.history.pushState({}, '', '/play');
      setRoute({ page: 'home' });
    } else {
      setTransitionDirection('left');
      window.history.pushState({}, '', '/');
      setRoute({ page: 'landing' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/play\/online\/game\/([A-Z0-9]{6})$/i);
      const isOfflineMatch = path.toUpperCase() === '/PLAY/ONLINE/GAME/OFFLINE';
      
      if (isOfflineMatch) {
        setTransitionDirection('right');
        setRoute({ page: 'game', code: 'OFFLINE' });
      } else if (match) {
        const session = sessionStore.get();
        if (session) {
          setTransitionDirection('right');
          setRoute({ page: 'game', code: match[1].toUpperCase() });
        } else {
          setRoute({ page: 'landing' });
        }
      } else if (path === '/play' || path === '/play/online/create_game' || path === '/play/online/join_game') {
        setTransitionDirection('left');
        setRoute({ page: 'home' });
      } else {
        setTransitionDirection('left');
        setRoute({ page: 'landing' });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Route protection and session validation effect
  useEffect(() => {
    const checkSession = async () => {
      if (route.page === 'game' && route.code) {
        if (route.code === 'OFFLINE') {
          return;
        }
        const session = sessionStore.get();
        if (!session) {
          console.warn('No active session found for game route, redirecting to home.');
          navigateTo('home');
          return;
        }

        setIsValidating(true);
        try {
          const res = await fetch(`${API_URL}/api/game/validate-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              gameId: session.gameId,
              token: session.token
            })
          });

          const data = await res.json();
          if (!data.valid) {
            console.warn('Session is invalid on server:', data.reason);
            sessionStore.clear();
            navigateTo('home');
          }
        } catch (err) {
          console.error('Session validation error:', err);
          // If server is offline/error, let client connection handle reconnection
        } finally {
          setIsValidating(false);
        }
      }
    };

    checkSession();
  }, [route.page, route.code]);

  if (isValidating) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center ${
        theme === 'dark' ? 'bg-[#06080f] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12 rounded-full flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <span className="text-sm font-semibold animate-pulse tracking-wide uppercase">Validating Session...</span>
          {currentPing !== 0 && (
            <span className="text-xs text-slate-500 font-bold">
              {currentPing === -1 ? 'Connection offline' : `Ping: ${currentPing}ms`}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#06080f] text-slate-100' : 'bg-slate-50 text-slate-800'
      } flex flex-col justify-between overflow-x-hidden`}>
      {route.page === 'landing' && (
        <div className={transitionDirection === 'left' ? 'animate-slide-left-enter w-full' : 'w-full'}>
          <LandingPage
            theme={theme}
            setTheme={setTheme}
            onCreateGame={() => navigateTo('home')}
            onJoinGame={() => navigateTo('home')}
          />
        </div>
      )}
      {route.page === 'home' && (
        <div className={transitionDirection === 'left' ? 'animate-slide-left-enter w-full' : 'w-full'}>
          <HomePage 
            onStartGame={(code) => navigateTo('game', code)} 
            theme={theme} 
            setTheme={setTheme} 
            onGoBack={() => navigateTo('landing')}
          />
        </div>
      )}
      {route.page === 'game' && (
        <div className={transitionDirection === 'right' ? 'animate-slide-right-enter w-full' : 'w-full'}>
          <GamePage 
            code={route.code!} 
            onGoBack={() => navigateTo('home')} 
            theme={theme} 
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        </div>
      )}
    </div>
  );
}

export default App;
