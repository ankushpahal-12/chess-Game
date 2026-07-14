import { socket } from '../../services/socket';
import { CryptoService } from './CryptoService';
import { MessageService } from './MessageService';
import type { ChatUIState, SecureMessage } from '../types/chat';
import type { CryptoSessionState } from '../types/chat';

type ChatSessionListener = (snapshot: ChatSessionSnapshot) => void;

export interface ChatSessionSnapshot {
  uiState: ChatUIState;
  cryptoState: CryptoSessionState;
  messages: SecureMessage[];
  draft: string;
  socketConnected: boolean;
  safetyNumber: string | null;
  unreadCount: number;
}

export class ChatSession {
  private readonly roomCode: string;
  private readonly role: 'white' | 'black' | null;

  public readonly crypto = new CryptoService();
  public readonly messages = new MessageService();

  private _uiState: ChatUIState = 'CLOSED';
  private _socketConnected: boolean = socket.connected;
  private _destroyed: boolean = false;
  private _unreadCount: number = 0;

  private listeners: ChatSessionListener[] = [];

  private unsubCrypto: (() => void) | null = null;
  private unsubMessages: (() => void) | null = null;

  constructor(roomCode: string, role: 'white' | 'black' | null) {
    this.roomCode = roomCode;
    this.role = role;

    this.unsubCrypto = this.crypto.subscribe(() => this.notify());
    this.unsubMessages = this.messages.subscribe(() => this.notify());

    this.crypto.onRetryNeeded = () => {
      if (this.crypto._retryPublicKey) {
        socket.emit('secure_key', {
          code: this.roomCode,
          publicKey: this.crypto._retryPublicKey,
          version: this.crypto.sessionVersion,
        });
      }
    };

    socket.on('connect', this.handleConnect);
    socket.on('disconnect', this.handleDisconnect);

    socket.on('secure_init', this.handleSecureInit);
    socket.on('secure_key', this.handleSecureKey);
    socket.on('secure_payload', this.handleSecurePayload);
    socket.on('secure_close', this.handleSecureClose);
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  public getSnapshot(): ChatSessionSnapshot {
    return {
      uiState: this._uiState,
      cryptoState: this.crypto.state,
      messages: this.messages.messages,
      draft: this.messages.draft,
      socketConnected: this._socketConnected,
      safetyNumber: this.crypto.safetyNumber,
      unreadCount: this._unreadCount,
    };
  }

  public subscribe(listener: ChatSessionListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ─── Session Lifecycle ───────────────────────────────────────────────────

  public async startHandshake(): Promise<void> {
    if (this.crypto.state === 'DESTROYED') return;

    try {
      socket.emit('secure_init', { code: this.roomCode });

      const rawPublicKey = await this.crypto.startHandshake();
      socket.emit('secure_key', {
        code: this.roomCode,
        publicKey: rawPublicKey,
        version: this.crypto.sessionVersion,
      });
    } catch (err) {
      console.error('[ChatSession] Error starting handshake:', err);
    }
  }

  public open(): void {
    if (this._destroyed) {
      console.warn('[ChatSession] Cannot open — session has been destroyed (game ended).');
      return;
    }
    this._unreadCount = 0; // clear badge when chat is opened
    this.setUIState('OPEN');
    const restartable = ['INACTIVE', 'FAILED', 'DESTROYED'];
    if (restartable.includes(this.crypto.state)) {
      if (this.crypto.state !== 'INACTIVE') this.crypto.reset();
      void this.startHandshake();
    }
  }

  public close(): void {
    this.setUIState('MINIMIZED');
  }

  /**
   * Panic / wipe: instantly clears all messages and crypto keys.
   * Emits secure_close to the peer. Session socket listeners remain active
   * so the chat can be reopened with a fresh handshake.
   */
  public wipe(): void {
    if (this._socketConnected) {
      socket.emit('secure_close', { code: this.roomCode });
    }
    this.crypto.reset();
    this.messages.clear();
    this._unreadCount = 0;
    this._uiState = 'CLOSED';
    this.notify();
  }

  // ─── Messaging ───────────────────────────────────────────────────────────

  public async sendMessage(text: string): Promise<boolean> {
    if (!this._socketConnected) {
      console.warn('[ChatSession] Offline — message kept as draft.');
      return false;
    }
    if (this.crypto.state !== 'READY') {
      console.warn('[ChatSession] Session not READY — message kept as draft.');
      return false;
    }
    if (!text.trim()) return false;
    if (text.length > 2048) {
      console.warn('[ChatSession] Message exceeds 2048 char limit.');
      return false;
    }

    try {
      const payload = await this.crypto.encrypt(text, this.roomCode);
      socket.emit('secure_payload', {
        code: this.roomCode,
        payload,
        version: this.crypto.sessionVersion,
      });
      this.messages.addMessage(text, 'me');
      this.messages.setDraft('');
      return true;
    } catch (err) {
      console.error('[ChatSession] Encryption/send error:', err);
      return false;
    }
  }

  public setDraft(text: string): void {
    this.messages.setDraft(text);
  }

  // ─── Socket Event Handlers ───────────────────────────────────────────────

  private handleConnect = (): void => {
    this._socketConnected = true;
    if (
      this.crypto.state === 'WAITING_FOR_PEER' ||
      this.crypto.state === 'GENERATING_KEYS'
    ) {
      void this.startHandshake();
    }
    this.notify();
  };

  private handleDisconnect = (): void => {
    this._socketConnected = false;
    this.notify();
  };

  private handleSecureInit = async () => {
    if (
      this.crypto.state === 'INACTIVE' ||
      this.crypto.state === 'FAILED'
    ) {
      await this.startHandshake();
    }
  };

  private handleSecureKey = async (data: { publicKey: ArrayBuffer; version?: number }) => {
    if (!data.publicKey) return;
    try {
      await this.crypto.completeHandshake(data.publicKey, this.role, this.roomCode);
    } catch (err) {
      console.error('[ChatSession] completeHandshake error:', err);
    }
  };

  private handleSecurePayload = async (data: {
    payload: { ciphertext: string; iv: string; counter: number };
    version?: number;
  }) => {
    if (!data.payload) return;

    // Reject packets from a previous handshake session
    if (
      data.version !== undefined &&
      !this.crypto.isCurrentVersion(data.version)
    ) {
      // Expected after a crypto reset — old packets still in flight
      return;
    }

    // Also silently drop if crypto is not ready (e.g. mid-reset race window)
    if (this.crypto.state !== 'READY') return;

    try {
      const plaintext = await this.crypto.decrypt(data.payload, this.roomCode);
      this.messages.addMessage(plaintext, 'opponent');
      // Increment unread badge if chat drawer is not currently open
      if (this._uiState !== 'OPEN') {
        this._unreadCount += 1;
      }
    } catch {
      // OperationError here means the packet arrived during a key rotation window.
      // It is safe to discard — the sender will not retransmit.
    }
  };

  private handleSecureClose = (): void => {
    console.log('[ChatSession] Peer closed secure session — resetting for next open.');
    // Reset crypto only (not the whole session) so the user can reopen chat.
    this.crypto.reset();
    this._uiState = 'CLOSED';
    this.notify();
  };

  // ─── Internal Helpers ────────────────────────────────────────────────────

  private setUIState(next: ChatUIState): void {
    this._uiState = next;
    this.notify();
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    this.listeners.forEach((l) => l(snapshot));
  }

  // ─── Explicit Cleanup ────────────────────────────────────────────────────

  public destroy(): void {
    if (this._destroyed) return; // already cleaned up
    this._destroyed = true;

    if (this._socketConnected) {
      socket.emit('secure_close', { code: this.roomCode });
    }

    socket.off('connect', this.handleConnect);
    socket.off('disconnect', this.handleDisconnect);
    socket.off('secure_init', this.handleSecureInit);
    socket.off('secure_key', this.handleSecureKey);
    socket.off('secure_payload', this.handleSecurePayload);
    socket.off('secure_close', this.handleSecureClose);

    this.crypto.destroy();
    this.messages.clear();

    this.unsubCrypto?.();
    this.unsubMessages?.();

    this.listeners = [];
    this._uiState = 'CLOSED';
  }
}
