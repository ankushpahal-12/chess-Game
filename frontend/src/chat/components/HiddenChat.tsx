import React, { useEffect, useRef } from 'react';
import { Shield, ShieldAlert, X, Lock } from 'lucide-react';
import { useChatSession } from '../context/ChatSessionContext';
import { useHiddenChat } from '../hooks/useHiddenChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface HiddenChatProps {
  theme?: 'dark' | 'light';
}

export const HiddenChat: React.FC<HiddenChatProps> = ({
  theme = 'dark',
}) => {
  const chatSession = useChatSession();
  const {
    uiState,
    cryptoState,
    messages,
    draft,
    socketConnected,
    safetyNumber,
    close,
    sendMessage,
    setDraft,
  } = useHiddenChat(chatSession);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const isOpen = uiState === 'OPEN';

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, cryptoState]);

  const getStatusText = () => {
    if (!socketConnected) return 'Reconnecting (Offline)...';
    switch (cryptoState) {
      case 'READY':
        return 'E2E Secure Channel';
      case 'GENERATING_KEYS':
        return 'Generating Keys...';
      case 'WAITING_FOR_PEER':
        return 'Awaiting Opponent Key...';
      case 'DERIVING_SECRET':
        return 'Deriving Shared Secret...';
      case 'FAILED':
        return 'Handshake Failed';
      case 'DESTROYED':
        return 'Session Ended';
      default:
        return 'Inactive';
    }
  };

  const getStatusIcon = () => {
    if (!socketConnected) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/25">
          <ShieldAlert className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
        </div>
      );
    }
    if (cryptoState === 'READY') {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/25">
          <Shield className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
        </div>
      );
    }
    if (cryptoState === 'FAILED') {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/25">
          <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
        </div>
      );
    }
    // Handshaking states (generating, waiting, deriving)
    return (
      <div className="relative w-8 h-8 rounded-full flex items-center justify-center border border-slate-700/30">
        <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <Lock className="w-3.5 h-3.5 text-blue-500" />
      </div>
    );
  };

  const isInputDisabled = !socketConnected || cryptoState !== 'READY';

  return (
    <>
      {/* Tap-outside transparent backdrop close overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/15 z-40 transition-opacity duration-350 cursor-pointer"
          onClick={close}
        />
      )}

      {/* Slide-out Secure Chat Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[340px] sm:max-w-[380px] border-l z-50 flex flex-col shadow-2xl transition-all duration-350 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isDark
            ? 'bg-[#0a0f1d]/95 border-slate-800 text-white backdrop-blur-md'
            : 'bg-white/95 border-slate-200 text-slate-800 backdrop-blur-md shadow-slate-400/20'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/20">
          <div className="flex items-center gap-2.5">
            {getStatusIcon()}
            <div className="text-left">
              <h3 className="text-sm font-black tracking-tight leading-none">Secure Channel</h3>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mt-1">
                {getStatusText()} {safetyNumber && `• Fingerprint: ${safetyNumber}`}
              </span>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900/60 transition-all cursor-pointer animate-none"
            aria-label="Close Chat Drawer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Main Conversation viewport */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4.5 space-y-3 flex flex-col scroll-smooth"
        >
          {!socketConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-amber-500/85 select-none animate-none">
              <ShieldAlert className="w-10 h-10 mb-2.5" />
              <p className="text-xs font-black uppercase tracking-wider">Network Lost</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[220px]">
                Reconnecting to server... Sending has been paused, but your message is saved as a draft.
              </p>
            </div>
          ) : cryptoState === 'READY' ? (
            messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 opacity-30 select-none">
                <Lock className="w-10 h-10 text-slate-400 mb-2.5" />
                <p className="text-xs font-bold tracking-tight">Encrypted session established.</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Plaintext messages are encrypted locally on the device and never stored on the server.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} theme={theme} />
              ))
            )
          ) : cryptoState === 'FAILED' ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-red-400 select-none animate-none">
              <ShieldAlert className="w-10 h-10 mb-2.5" />
              <p className="text-xs font-black uppercase tracking-wider">Secure Handshake Failed</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[220px]">
                Cryptographic key exchange failed after retries. Re-initiate connection to retry.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none animate-pulse">
              <div className="relative w-12 h-12 rounded-full flex items-center justify-center border-2 border-slate-700/30 mb-3">
                <div className="absolute inset-0 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <Lock className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {cryptoState === 'GENERATING_KEYS'
                  ? 'Generating Keys'
                  : cryptoState === 'WAITING_FOR_PEER'
                    ? 'Awaiting Peer'
                    : 'Deriving Secrets'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {cryptoState === 'GENERATING_KEYS'
                  ? 'Creating local ephemeral P-256 keypair...'
                  : cryptoState === 'WAITING_FOR_PEER'
                    ? 'Sending key sync packet to opponent...'
                    : 'Performing Diffie-Hellman secret derivation...'}
              </p>
            </div>
          )}
        </div>

        {/* Input controls */}
        <MessageInput
          onSend={sendMessage}
          disabled={isInputDisabled}
          theme={theme}
          value={draft}
          onChange={setDraft}
        />
      </div>
    </>
  );
};

export default HiddenChat;
