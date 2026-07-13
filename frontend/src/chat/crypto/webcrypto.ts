
export async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false, // Private key is NOT extractable. Public key can still be exported.
    ['deriveKey', 'deriveBits']
  );
}

// Exports a public CryptoKey into raw byte format (ArrayBuffer)
export async function exportRawPublicKey(publicKey: CryptoKey): Promise<ArrayBuffer> {
  return window.crypto.subtle.exportKey('raw', publicKey);
}

// Imports a raw public key back into a P-256 ECDH CryptoKey object
export async function importRawPublicKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return window.crypto.subtle.importKey(
    'raw',
    rawKey,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // Public key is extractable
    []
  );
}

// Derives a 256-bit AES-GCM encryption key from ECDH private key and peer public key
export async function deriveAESGCMKey(
  privateKey: CryptoKey,
  opponentPublicKey: CryptoKey
): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: opponentPublicKey,
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // Symmetric key is NOT extractable for maximum security in memory
    ['encrypt', 'decrypt']
  );
}
