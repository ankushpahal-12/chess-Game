import React from 'react';
import { type SecureMessage } from '../types/chat';

interface MessageBubbleProps {
  message: SecureMessage;
  theme?: 'dark' | 'light';
}

/** Detect and extract FEN from a board-share message */
function parseBoardMessage(text: string): string | null {
  const match = text.match(/^\[BOARD\](.*)\[\/BOARD\]$/s);
  return match ? match[1].trim() : null;
}

const PIECE_SYMBOLS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

/** Render an 8×8 mini board from a FEN string */
function MiniBoardFromFen({ fen, isMe }: { fen: string; isMe: boolean }) {
  const boardPart = fen.split(' ')[0];
  const rows = boardPart.split('/');

  const cells: (string | null)[][] = rows.map((row) => {
    const cells: (string | null)[] = [];
    for (const ch of row) {
      if (!isNaN(Number(ch))) {
        for (let i = 0; i < Number(ch); i++) cells.push(null);
      } else {
        cells.push(ch);
      }
    }
    return cells;
  });

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-slate-700/60 shadow-inner" style={{ width: 128, height: 128 }}>
      {cells.map((row, ri) => (
        <div key={ri} className="flex" style={{ height: 16 }}>
          {row.map((piece, ci) => {
            const isLight = (ri + ci) % 2 === 0;
            const bg = isLight
              ? 'bg-[#f0d9b5]'
              : 'bg-[#b58863]';
            return (
              <div
                key={ci}
                className={`flex items-center justify-center ${bg}`}
                style={{ width: 16, height: 16, fontSize: 11, lineHeight: 1, userSelect: 'none' }}
              >
                {piece ? (PIECE_SYMBOLS[piece] ?? piece) : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, theme = 'dark' }) => {
  const isMe = message.sender === 'me';
  const isDark = theme === 'dark';
  const fen = parseBoardMessage(message.text);

  const formatTime = (date: Date): string =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
        {fen ? (
          /* Board position message */
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 flex items-center gap-1`}>
              ♟️ Board Position
            </p>
            <MiniBoardFromFen fen={fen} isMe={isMe} />
            <p className={`text-[9px] mt-1.5 font-mono opacity-60 break-all`}>{fen.split(' ')[0]}</p>
          </div>
        ) : (
          /* Regular text message */
          <p className="whitespace-pre-wrap break-all">{message.text}</p>
        )}
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
