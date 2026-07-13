import React from 'react';
import { Copy, Check } from 'lucide-react';

interface GameDetailsPanelProps {
  code: string;
  theme?: 'dark' | 'light';
  timeControl: string;
  startedAt?: string;
  movesCount: number;
  statusText?: string;
}

export const GameDetailsPanel: React.FC<GameDetailsPanelProps> = ({
  code,
  theme = 'dark',
  timeControl,
  startedAt = '2:34 PM',
  movesCount,
  statusText = 'In Progress'
}) => {
  const [copied, setCopied] = React.useState(false);
  const isDark = theme === 'dark';

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Format code (e.g. ABCDEF to ABC-DEF)
  const formattedCode = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;

  return (
    <div className={`p-4.5 rounded-2xl border text-left flex flex-col space-y-4 transition-all duration-300 w-full ${
      isDark ? 'bg-[#0d1321]/80 border-slate-850' : 'bg-white border-slate-200 shadow-xs'
    }`}>
      
      {/* Top row: Game Code Title & Copy action */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col leading-none">
          <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>Room Code</span>
          <span className="font-mono text-base font-black tracking-widest text-blue-500 mt-1">{formattedCode}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isDark 
              ? 'border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white' 
              : 'border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Copy Room Code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Divider */}
      <div className={`border-t border-dashed ${isDark ? 'border-slate-850' : 'border-slate-150'}`} />

      {/* Detailed game info list */}
      <div className="flex flex-col space-y-2.5 text-xs font-semibold">
        <div className="flex justify-between items-center">
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Time Control</span>
          <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{timeControl}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Started At</span>
          <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{startedAt}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Moves Played</span>
          <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{movesCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Status</span>
          <span className="flex items-center gap-1.5 justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 font-bold">{statusText}</span>
          </span>
        </div>
      </div>

    </div>
  );
};
export default GameDetailsPanel;
