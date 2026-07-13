import React, { useEffect, useRef } from 'react';
import { Swords, ChevronLeft, ChevronRight } from 'lucide-react';

interface MoveHistoryProps {
  history: string[];
  theme?: 'dark' | 'light';
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ history, theme = 'dark' }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    // Auto scroll to bottom when moves update
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length]);

  return (
    <div className={`p-4 rounded-2xl border flex flex-col min-h-[260px] max-h-[320px] transition-colors duration-300 w-full ${
      isDark ? 'bg-[#0d1321]/80 border-slate-850' : 'bg-white border-slate-200 shadow-xs'
    }`}>
      
      {/* 1. Header */}
      <div className={`flex items-center gap-2 mb-3.5 border-b pb-2.5 ${isDark ? 'border-slate-850' : 'border-slate-150'}`}>
        <Swords className="w-4.5 h-4.5 text-indigo-400" />
        <h3 className={`text-xs uppercase tracking-wider font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Move History
        </h3>
      </div>

      {/* 2. Moves list scrollable box */}
      <div className="flex-1 overflow-y-auto pr-2 font-mono scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs py-12 italic">
            No moves made yet.
          </div>
        ) : (
          <div className={`flex flex-col space-y-1 text-xs md:text-sm font-semibold`}>
            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, idx) => {
              const moveNum = idx + 1;
              const wMove = history[idx * 2];
              const bMove = history[idx * 2 + 1];
              
              // Decide if this row is the very latest move row to highlight
              const isLatestRow = idx * 2 + 1 === history.length - 1 || idx * 2 === history.length - 1;

              const rowHighlight = isLatestRow 
                ? isDark 
                  ? 'bg-blue-600/10 text-blue-400 rounded-lg' 
                  : 'bg-blue-50 text-blue-600 rounded-lg'
                : '';

              return (
                <div key={idx} className={`grid grid-cols-12 py-1 px-2 items-center ${rowHighlight}`}>
                  {/* Move number */}
                  <div className={`col-span-2 text-left pr-3 font-semibold border-r ${
                    isDark ? 'text-slate-550 border-slate-850/50' : 'text-slate-400 border-slate-150'
                  }`}>
                    {moveNum}.
                  </div>
                  {/* White move */}
                  <div className={`col-span-5 pl-4 transition-colors ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {wMove || '-'}
                  </div>
                  {/* Black move */}
                  <div className={`col-span-5 pl-4 transition-colors ${
                    isDark ? 'text-indigo-300' : 'text-indigo-650'
                  }`}>
                    {bMove || '-'}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 3. Pagination Controls (Matches mockup exactly) */}
      <div className={`flex items-center justify-between pt-3 mt-2 border-t ${
        isDark ? 'border-slate-850' : 'border-slate-150'
      }`}>
        <button 
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isDark ? 'border-slate-850 text-slate-400 hover:bg-slate-800 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          disabled
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {/* Indicators */}
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600/50" />
        </div>

        <button 
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isDark ? 'border-slate-850 text-slate-400 hover:bg-slate-800 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
          disabled
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
export default MoveHistory;
