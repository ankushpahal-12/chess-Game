import React from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  theme?: 'dark' | 'light';
  value: string;
  onChange: (text: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  theme = 'dark',
  value,
  onChange,
}) => {
  const isDark = theme === 'dark';

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

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-1.5 p-3.5 border-t border-slate-800/80 bg-slate-950/20">
      <div className="relative flex items-center w-full">
        <input
          type="text"
          maxLength={2048}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Establishing secure connection...' : 'Type a secure message...'}
          className={`w-full text-xs font-semibold py-3 pl-4 pr-12 rounded-xl focus:outline-none focus:ring-1.5 transition-all ${
            isDark
              ? 'bg-[#090d16] border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-blue-900/20'
              : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
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
        <span className="text-[10px] text-right font-bold text-slate-550 mr-2">
          {value.length} / 2048 characters
        </span>
      )}
    </form>
  );
};

export default MessageInput;
