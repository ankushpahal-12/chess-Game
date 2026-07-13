import React from 'react';

interface TimerProps {
  ms: number;
  isActive: boolean;
  initialMs?: number;
  theme?: 'dark' | 'light';
  color: 'white' | 'black';
}

export const Timer: React.FC<TimerProps> = ({ 
  ms, 
  isActive, 
  initialMs = 600000, 
  theme = 'dark',
  color
}) => {
  const formatTime = (timeMs: number): string => {
    const totalSeconds = Math.max(0, Math.floor(timeMs / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    // Low time high-tension precision decimals
    if (totalSeconds < 10) {
      const decimals = Math.floor((timeMs % 1000) / 100);
      return `${seconds}.${decimals}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLowTime = ms < 30000; // Under 30 seconds
  const isDark = theme === 'dark';

  // Calculate percentage for progress line
  const progressPercent = Math.min(100, Math.max(0, (ms / initialMs) * 100));

  return (
    <div className="flex flex-col space-y-2 text-left w-full font-sans">
      
      {/* 1. Large Countdown Digits */}
      <div className={`text-4xl md:text-5xl font-black tracking-tight ${
        isActive && isLowTime
          ? 'text-red-500 animate-pulse'
          : isActive
          ? isDark ? 'text-white' : 'text-slate-900'
          : isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {formatTime(ms)}
      </div>

      {/* 2. Static Initial Control Limit (e.g. 10:00) */}
      <div className={`text-xs font-bold leading-none select-none tracking-wide ${
        isDark ? 'text-slate-500' : 'text-slate-400'
      }`}>
        {formatTime(initialMs)}
      </div>

      {/* 3. Underline Progress bar indicator */}
      <div className={`h-1 w-full rounded-full overflow-hidden ${
        isDark ? 'bg-slate-800' : 'bg-slate-200'
      }`}>
        <div 
          className={`h-full transition-all duration-1000 ease-linear ${
            isActive && isLowTime
              ? 'bg-red-500 animate-pulse'
              : color === 'white'
              ? 'bg-blue-600'
              : 'bg-slate-700'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

    </div>
  );
};
export default Timer;
