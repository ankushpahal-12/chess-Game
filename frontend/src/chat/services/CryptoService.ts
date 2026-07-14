import { KeyManager } from '../crypto/KeyManager';
import { type EncryptedPayload } from '../crypto/encrypt';
import type { CryptoSessionState } from '../types/chat';

const HANDSHAKE_TIMEOUT_MS = 10_000;
const MAX_RETRIES           = 3;

type CryptoStateListener = (state: CryptoSessionState) => void;

export class CryptoService {
  /** Unique identifier for this specific session instance. */
  public readonly sessionId: string = crypto.randomUUID();

  /** Increments each time a handshake succeeds. Stale packets with old versions are ignored. */
  public sessionVersion = 0;

  private _state: CryptoSessionState = 'INACTIVE';
  private keyManager = new KeyManager();
  private retryCount = 0;
  private handshakeTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: CryptoStateListener[] = [];

  // ─── State ───────────────────────────────────────────────────────────────

  public get state(): CryptoSessionState {
    return this._state;
  }

  public get safetyNumber(): string | null {
    return this.keyManager.getSafetyNumber();
  }

  private setState(next: CryptoSessionState): void {
    this._state = next;
    this.listeners.forEach((l) => l(next));
  }

  public subscribe(listener: CryptoStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ─── Handshake ───────────────────────────────────────────────────────────

  /**
   * Starts the ECDH key generation phase.
   * Returns the raw public key ArrayBuffer to be broadcast via secure_key.
   */
  public async startHandshake(): Promise<ArrayBuffer> {
    if (this._state === 'DESTROYED') {
      throw new Error('CryptoService: session is destroyed.');
    }

    this.clearHandshakeTimer();
    this.setState('GENERATING_KEYS');

    await this.keyManager.generateKeyPair();
    const rawPublicKey = await this.keyManager.exportPublicKey();

    this.setState('WAITING_FOR_PEER');
    this.startHandshakeTimer();

    return rawPublicKey;
  }

  /**
   * Called when the peer's raw public key arrives.
   * Derives the symmetric KDF chains and the safety number fingerprint.
   */
  public async completeHandshake(
    peerRawPublicKey: ArrayBuffer,
    role: 'white' | 'black' | null,
    roomCode: string
  ): Promise<void> {
    if (this._state !== 'WAITING_FOR_PEER') return;

    this.clearHandshakeTimer();
    this.setState('DERIVING_SECRET');

    try {
      await this.keyManager.deriveSharedChains(peerRawPublicKey, role, this.sessionId, roomCode);
      this.sessionVersion += 1;
      this.retryCount = 0;
      this.setState('READY');
    } catch (err) {
      console.error('[CryptoService] KDF chain derivation failed:', err);
      this.setState('FAILED');
    }
  }

  /**
   * Validates that an incoming packet belongs to the current session version.
   * Returns false if the packet is from a stale/previous handshake.
   */
  public isCurrentVersion(packetVersion: number): boolean {
    return packetVersion === this.sessionVersion;
  }

  // ─── Encrypt / Decrypt ───────────────────────────────────────────────────

  public async encrypt(plaintext: string, roomCode: string): Promise<EncryptedPayload> {
    if (this._state !== 'READY') {
      throw new Error('CryptoService: cannot encrypt — session not READY.');
    }
    return this.keyManager.encrypt(plaintext, this.sessionId, roomCode);
  }

  public async decrypt(payload: EncryptedPayload, roomCode: string): Promise<string> {
    if (this._state !== 'READY') {
      throw new Error('CryptoService: cannot decrypt — session not READY.');
    }
    return this.keyManager.decrypt(payload, this.sessionId, roomCode);
  }

  // ─── Timer / Retry ───────────────────────────────────────────────────────

  private startHandshakeTimer(): void {
    this.handshakeTimer = setTimeout(async () => {
      if (this._state !== 'WAITING_FOR_PEER') return;

      this.retryCount += 1;
      console.warn(`[CryptoService] Handshake timeout (attempt ${this.retryCount}/${MAX_RETRIES})`);

      if (this.retryCount < MAX_RETRIES) {
        try {
          const rawPublicKey = await this.keyManager.exportPublicKey();
          this.setState('WAITING_FOR_PEER');
          this.startHandshakeTimer();
          // Notify listeners with the raw key so ChatSession can re-emit it.
          this._retryPublicKey = rawPublicKey;
          this.onRetryNeeded?.();
        } catch {
          this.setState('FAILED');
        }
      } else {
        console.error('[CryptoService] Handshake failed after max retries.');
        this.setState('FAILED');
      }
    }, HANDSHAKE_TIMEOUT_MS);
  }

  private clearHandshakeTimer(): void {
    if (this.handshakeTimer) {
      clearTimeout(this.handshakeTimer);
      this.handshakeTimer = null;
    }
  }

  // ─── Retry Callback ───────────────────────────────────────────────────────
  public onRetryNeeded: (() => void) | null = null;
  public _retryPublicKey: ArrayBuffer | null = null;

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  /**
   * Resets the crypto state back to INACTIVE so a fresh handshake can start.
   * Unlike destroy(), this keeps listeners intact and does NOT permanently close the session.
   */
  public reset(): void {
    this.clearHandshakeTimer();
    this.keyManager.destroy();
    this.retryCount = 0;
    this._retryPublicKey = null;
    this.setState('INACTIVE');
  }

  public destroy(): void {
    this.clearHandshakeTimer();
    this.keyManager.destroy();
    this.retryCount = 0;
    this._retryPublicKey = null;
    this.onRetryNeeded = null;
    this.listeners = [];
    this.setState('DESTROYED');
  }
}
