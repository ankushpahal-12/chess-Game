import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, ChatSessionSnapshot } from '../services/ChatSession';

export function useHiddenChat(session: ChatSession) {
  const [snapshot, setSnapshot] = useState<ChatSessionSnapshot>(() =>
    session.getSnapshot()
  );

  useEffect(() => {
    const unsubscribe = session.subscribe((next) => setSnapshot(next));
    setSnapshot(session.getSnapshot());
    return unsubscribe;
  }, [session]);

  const open  = useCallback(() => session.open(),  [session]);
  const close = useCallback(() => session.close(), [session]);
  const wipe  = useCallback(() => session.wipe(),  [session]);

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => session.sendMessage(text),
    [session]
  );

  const setDraft = useCallback(
    (text: string) => session.setDraft(text),
    [session]
  );

  return {
    uiState:         snapshot.uiState,
    cryptoState:     snapshot.cryptoState,
    messages:        snapshot.messages,
    draft:           snapshot.draft,
    socketConnected: snapshot.socketConnected,
    safetyNumber:    snapshot.safetyNumber,
    unreadCount:     snapshot.unreadCount,
    open,
    close,
    wipe,
    sendMessage,
    setDraft,
  };
}

export default useHiddenChat;
