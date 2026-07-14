import React, { useState } from 'react';
import { Send, ChevronDown } from 'lucide-react';

const EMOJIS = ['♟️', '👍', '😂', '🤫', '🔥', '😮', '💀', '🤝', '🧠', '⚡'];

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  theme?: 'dark' | 'light';
  value: string;
  onChange: (text: string) => void;
  /** Optional: current board FEN to share as a position snapshot */
  fen?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  theme = 'dark',
  value,
  onChange,
  fen,
}) => {
  const isDark = theme === 'dark';
  const [showEmoji, setShowEmoji] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && trimmed.length <= 2048 && !disabled) {
      onSend(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji);
    setShowEmoji(false);
  };

  const sharePosition = () => {
    if (!fen || disabled) return;
    onSend(`[BOARD]${fen}[/BOARD]`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col p-3.5 border-t border-slate-800/80 bg-slate-950/20 gap-2">

      {/* Emoji picker row */}
      {showEmoji && (
        <div
          className={`flex flex-wrap gap-1 p-2 rounded-xl border text-base animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            isDark
              ? 'bg-[#090d16] border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => insertEmoji(e)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700/40 transition-colors text-base cursor-pointer"
              aria-label={`Insert ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="relative flex items-center w-full gap-1.5">
        {/* Emoji toggle button */}
        <button
          type="button"
          onClick={() => setShowEmoji((p) => !p)}
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-base transition-all cursor-pointer ${
            showEmoji
              ? 'bg-blue-600/20 text-blue-400'
              : isDark
                ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
          aria-label="Emoji picker"
        >
          {showEmoji ? <ChevronDown className="w-3.5 h-3.5" /> : '😀'}
        </button>

        {/* Share position button */}
        {fen && (
          <button
            type="button"
            onClick={sharePosition}
            disabled={disabled}
            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-base transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label="Share board position"
            title="Share current board position"
          >
            ♟️
          </button>
        )}

        {/* Text input */}
        <input
          type="text"
          maxLength={2048}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Establishing secure connection...' : 'Type a secure message...'}
          className={`flex-1 text-xs font-semibold py-3 pl-4 pr-12 rounded-xl focus:outline-none focus:ring-1.5 transition-all ${
            isDark
              ? 'bg-[#090d16] border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-900/20'
              : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!value.trim() || value.length > 2048 || disabled}
          className={`absolute right-2.5 p-2 rounded-lg flex items-center justify-center transition-all ${
            value.trim() && value.length <= 2048 && !disabled
              ? 'bg-blue-600 text-white hover:scale-105 active:scale-95 cursor-pointer'
              : 'text-slate-600 bg-transparent'
          } disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed`}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {value.length > 1500 && (
        <span className="text-[10px] text-right font-bold text-slate-500 mr-2">
          {value.length} / 2048
        </span>
      )}
    </form>
  );
};

export default MessageInput;
