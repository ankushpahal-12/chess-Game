import React from 'react';
import { type SecureMessage } from '../types/chat';

interface MessageBubbleProps {
  message: SecureMessage;
  theme?: 'dark' | 'light';
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, theme = 'dark' }) => {
  const isMe = message.sender === 'me';
  const isDark = theme === 'dark';

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'} mb-2.5`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed shadow-sm transition-all duration-200 ${
          isMe
            ? 'bg-blue-600 text-white rounded-tr-none'
            : isDark
              ? 'bg-[#1b2336] text-slate-200 border border-slate-800/60 rounded-tl-none'
              : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none'
        }`}
      >
        <p className="whitespace-pre-wrap break-all">{message.text}</p>
        <span
          className={`block text-[9px] mt-1 text-right select-none ${
            isMe ? 'text-blue-200' : 'text-slate-500'
          }`}
        >
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
