export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Actively overwrites a sensitive binary buffer with zeros to purge secrets from memory.
 */
export function wipeArray(arr: Uint8Array): void {
  arr.fill(0);
}

// ─── AAD Builder ──────────────────────────────────────────────────────────

/**
 * Builds the AES-GCM Additional Authenticated Data (AAD) block.
 * Concatenates:
 * - 4-byte big-endian uint32 sequence counter
 * - 36-byte UTF-8 string session ID (UUID)
 * - Variable-length UTF-8 string room code (uppercase)
 */
export function buildAAD(counter: number, sessionId: string, roomCode: string): Uint8Array {
  const encoder = new TextEncoder();
  const sessionBytes = encoder.encode(sessionId);
  const roomBytes = encoder.encode(roomCode.toUpperCase());

  const aad = new Uint8Array(4 + sessionBytes.byteLength + roomBytes.byteLength);

  // Set sequence counter as big-endian uint32 in first 4 bytes
  const view = new DataView(aad.buffer);
  view.setUint32(0, counter, false);

  // Copy session ID bytes starting at offset 4
  aad.set(sessionBytes, 4);

  // Copy room code bytes starting after session ID
  aad.set(roomBytes, 4 + sessionBytes.byteLength);

  return aad;
}

// ─── Payload Shape ────────────────────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string; // Base64-encoded AES-GCM ciphertext + tag
  iv: string;         // Base64-encoded 12-byte nonce
  counter: number;    // Sequence counter
}

// ─── Encrypt ─────────────────────────────────────────────────────────────

export async function encryptMessage(
  aesKey: CryptoKey,
  plaintext: string,
  sequenceCounter: number,
  sessionId: string,
  roomCode: string
): Promise<EncryptedPayload> {
  const textEncoder = new TextEncoder();
  const plaintextBuffer = textEncoder.encode(plaintext);

  // Random 12-byte IV (nonce)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Build hardened AAD
  const aad = buildAAD(sequenceCounter, sessionId, roomCode);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: aad as any, tagLength: 128 },
    aesKey,
    plaintextBuffer
  );

  // Clean intermediate AAD buffer
  wipeArray(aad);

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    counter: sequenceCounter,
  };
}

// ─── Decrypt ─────────────────────────────────────────────────────────────

export async function decryptMessage(
  aesKey: CryptoKey,
  payload: EncryptedPayload,
  sessionId: string,
  roomCode: string
): Promise<string> {
  const ciphertextBuffer = base64ToArrayBuffer(payload.ciphertext);
  const ivBuffer = base64ToArrayBuffer(payload.iv);

  // Build the matching AAD
  const aad = buildAAD(payload.counter, sessionId, roomCode);

  const plaintextBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer, additionalData: aad as any, tagLength: 128 },
    aesKey,
    ciphertextBuffer
  );

  // Clean intermediate AAD buffer
  wipeArray(aad);

  return new TextDecoder().decode(plaintextBuffer);
}
