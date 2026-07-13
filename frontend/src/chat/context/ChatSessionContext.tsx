import { createContext, useContext } from 'react';
import type { ChatSession } from '../services/ChatSession';

export const ChatSessionContext = createContext<ChatSession | null>(null);
export function useChatSession(): ChatSession {
  const session = useContext(ChatSessionContext);
  if (!session) {
    throw new Error(
      'useChatSession must be used within a <ChatSessionContext.Provider>. ' +
      'Make sure GamePage wraps its children with the provider.'
    );
  }
  return session;
}
