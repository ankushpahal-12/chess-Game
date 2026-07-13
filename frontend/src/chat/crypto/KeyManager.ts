import { generateECDHKeyPair, importRawPublicKey, exportRawPublicKey } from './webcrypto';
import { encryptMessage, decryptMessage, wipeArray } from './encrypt';
import { type EncryptedPayload } from './encrypt';

export class KeyManager {
  private localKeyPair: CryptoKeyPair | null = null;
  private sendingChainKey: CryptoKey | null = null;
  private receivingChainKey: CryptoKey | null = null;
  private outgoingCounter = 0;
  private incomingCounter = 0;
  private safetyNumber: string | null = null;

  // ─── Key Generation ──────────────────────────────────────────────────────

  public async generateKeyPair(): Promise<CryptoKey> {
    this.localKeyPair = await generateECDHKeyPair();
    this.sendingChainKey = null;
    this.receivingChainKey = null;
    this.outgoingCounter = 0;
    this.incomingCounter = 0;
    this.safetyNumber = null;
    return this.localKeyPair.publicKey;
  }

  public async exportPublicKey(): Promise<ArrayBuffer> {
    if (!this.localKeyPair) {
      throw new Error('KeyManager: no key pair generated. Call generateKeyPair() first.');
    }
    return exportRawPublicKey(this.localKeyPair.publicKey);
  }

  // ─── Key Import, Derivation, and Ratchet ───────────────────────────────

  /**
   * Imports the peer's raw public key, derives a master secret, builds the safety number,
   * and initializes the symmetric KDF ratchet chains for sending and receiving.
   */
  public async deriveSharedChains(
    peerRawPublicKey: ArrayBuffer,
    role: 'white' | 'black' | null,
    sessionId: string,
    roomCode: string
  ): Promise<void> {
    if (!this.localKeyPair) {
      throw new Error('KeyManager: not initialized. Call generateKeyPair() first.');
    }

    const peerKey = await importRawPublicKey(peerRawPublicKey);

    // Derive raw shared secret bits using ECDH
    const sharedSecretBuffer = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: peerKey,
      },
      this.localKeyPair.privateKey,
      256
    );

    // Compute Safety Number fingerprint from shared secret
    this.safetyNumber = await this.computeSafetyNumber(sharedSecretBuffer, sessionId, roomCode);

    // Import shared secret as an HMAC key to derive KDF chains
    const masterHMACKey = await window.crypto.subtle.importKey(
      'raw',
      sharedSecretBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const encoder = new TextEncoder();
    const infoWhite = encoder.encode('white_send');
    const infoBlack = encoder.encode('black_send');

    // Derive sending and receiving chain inputs
    const whiteSendBits = await window.crypto.subtle.sign(
      { name: 'HMAC' },
      masterHMACKey,
      infoWhite
    );
    const blackSendBits = await window.crypto.subtle.sign(
      { name: 'HMAC' },
      masterHMACKey,
      infoBlack
    );

    const whiteSendKey = await window.crypto.subtle.importKey(
      'raw',
      whiteSendBits,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const blackSendKey = await window.crypto.subtle.importKey(
      'raw',
      blackSendBits,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Wipe sensitive intermediate buffers
    wipeArray(new Uint8Array(sharedSecretBuffer));
    wipeArray(new Uint8Array(whiteSendBits));
    wipeArray(new Uint8Array(blackSendBits));

    // Assign chains: White sending matches Black receiving and vice versa
    if (role === 'white') {
      this.sendingChainKey = whiteSendKey;
      this.receivingChainKey = blackSendKey;
    } else {
      this.sendingChainKey = blackSendKey;
      this.receivingChainKey = whiteSendKey;
    }

    this.outgoingCounter = 0;
    this.incomingCounter = 0;
  }

  /**
   * Ratchets a KDF chain key once using HMAC-SHA-256.
   * Derives and returns the next Chain Key and a temporary Message Key.
   */
  private async ratchetChain(
    currentChainKey: CryptoKey
  ): Promise<{ nextChainKey: CryptoKey; messageKey: CryptoKey }> {
    const encoder = new TextEncoder();
    const nextChainConstant = encoder.encode('next_chain_key');
    const messageKeyConstant = encoder.encode('message_key');

    const nextChainBits = await window.crypto.subtle.sign(
      { name: 'HMAC' },
      currentChainKey,
      nextChainConstant
    );
    const messageKeyBits = await window.crypto.subtle.sign(
      { name: 'HMAC' },
      currentChainKey,
      messageKeyConstant
    );

    const nextChainKey = await window.crypto.subtle.importKey(
      'raw',
      nextChainBits,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const messageKey = await window.crypto.subtle.importKey(
      'raw',
      messageKeyBits.slice(0, 32), // 256 bits
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    wipeArray(new Uint8Array(nextChainBits));
    wipeArray(new Uint8Array(messageKeyBits));

    return { nextChainKey, messageKey };
  }

  // ─── Encrypt / Decrypt ───────────────────────────────────────────────────

  public async encrypt(
    plaintext: string,
    sessionId: string,
    roomCode: string
  ): Promise<EncryptedPayload> {
    if (!this.sendingChainKey) {
      throw new Error('KeyManager: sending chain not initialized. Call deriveSharedChains() first.');
    }

    this.outgoingCounter += 1;

    // Ratchet sending chain key once to obtain Message Key
    const { nextChainKey, messageKey } = await this.ratchetChain(this.sendingChainKey);

    // Update sending chain key and destroy the old one
    this.sendingChainKey = nextChainKey;

    // Encrypt with Message Key and AAD bounds
    const payload = await encryptMessage(
      messageKey,
      plaintext,
      this.outgoingCounter,
      sessionId,
      roomCode
    );

    return payload;
  }

  public async decrypt(
    payload: EncryptedPayload,
    sessionId: string,
    roomCode: string
  ): Promise<string> {
    if (!this.receivingChainKey) {
      throw new Error('KeyManager: receiving chain not initialized. Call deriveSharedChains() first.');
    }

    if (payload.counter <= this.incomingCounter) {
      throw new Error(
        `Replay attack detected: counter ${payload.counter} ≤ last counter ${this.incomingCounter}`
      );
    }

    let currentChainKey = this.receivingChainKey;
    let messageKey: CryptoKey | null = null;

    // Ratchet the chain key up to the sequence counter of the payload
    while (this.incomingCounter < payload.counter) {
      this.incomingCounter += 1;
      const { nextChainKey, messageKey: derivedMsgKey } = await this.ratchetChain(currentChainKey);
      currentChainKey = nextChainKey;
      messageKey = derivedMsgKey;
    }

    this.receivingChainKey = currentChainKey;

    if (!messageKey) {
      throw new Error('KeyManager: failed to derive message key.');
    }

    // Decrypt using message key
    return decryptMessage(messageKey, payload, sessionId, roomCode);
  }

  // ─── Safety Numbers ─────────────────────────────────────────────────────

  private async computeSafetyNumber(
    sharedSecret: ArrayBuffer,
    sessionId: string,
    roomCode: string
  ): Promise<string> {
    const encoder = new TextEncoder();
    const sessionBytes = encoder.encode(sessionId);
    const roomBytes = encoder.encode(roomCode.toUpperCase());

    const combined = new Uint8Array(sharedSecret.byteLength + sessionBytes.byteLength + roomBytes.byteLength);
    combined.set(new Uint8Array(sharedSecret), 0);
    combined.set(sessionBytes, sharedSecret.byteLength);
    combined.set(roomBytes, sharedSecret.byteLength + sessionBytes.byteLength);

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined);
    const hashArray = new Uint8Array(hashBuffer);

    // Compute User-Friendly 6-digit Safety Number Fingerprint
    const part1 = ((hashArray[0] << 16) | (hashArray[1] << 8) | hashArray[2]) % 1000;
    const part2 = ((hashArray[3] << 16) | (hashArray[4] << 8) | hashArray[5]) % 1000;

    wipeArray(combined);
    wipeArray(hashArray);

    const pad = (num: number) => num.toString().padStart(3, '0');
    return `${pad(part1)}-${pad(part2)}`;
  }

  public getSafetyNumber(): string | null {
    return this.safetyNumber;
  }

  // ─── Status ───────────────────────────────────────────────────────────────

  public isReady(): boolean {
    return this.sendingChainKey !== null && this.receivingChainKey !== null;
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  public destroy(): void {
    this.localKeyPair = null;
    this.sendingChainKey = null;
    this.receivingChainKey = null;
    this.outgoingCounter = 0;
    this.incomingCounter = 0;
    this.safetyNumber = null;
  }
}
