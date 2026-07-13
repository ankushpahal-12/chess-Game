/**
 * chat/types/chat.ts
 *
 * Shared TypeScript interfaces and union types for the hidden encrypted chat system.
 */

// ─────────────────────────────────────────────
// Message
// ─────────────────────────────────────────────

export interface SecureMessage {
  /** Unique UUID for each message. */
  id: string;
  text: string;
  sender: 'me' | 'opponent';
  /** Timestamp when the user sent / the message was encrypted locally. */
  createdAt: Date;
  /** Timestamp when the message was received and decrypted (opponent) or echoed (me). */
  receivedAt: Date;
}

// ─────────────────────────────────────────────
// Activation State Machine
// ─────────────────────────────────────────────

/**
 * Tracks the physical gesture sequence that reveals the hidden lock icon.
 *
 * INACTIVE ──► HOLDING ──► LOCK_VISIBLE
 *     ▲                        │
 *     └────────────────────────┘  (lock tapped, dismissed, or cooldown reset)
 */
export type ActivationState = 'INACTIVE' | 'HOLDING' | 'LOCK_VISIBLE';

// ─────────────────────────────────────────────
// Crypto Session State Machine
// ─────────────────────────────────────────────

/**
 * Tracks the ECDH key exchange and AES-GCM session lifecycle.
 *
 * INACTIVE
 *   ↓
 * GENERATING_KEYS   ← local ECDH keypair generation
 *   ↓
 * WAITING_FOR_PEER  ← secure_key emitted, awaiting peer
 *   ↓
 * DERIVING_SECRET   ← peer key received, deriving AES key
 *   ↓
 * READY             ← AES-GCM session active
 *   ↓
 * FAILED            ← timeout/error after 3 retries
 *   ↓
 * DESTROYED         ← keys and state wiped
 */
export type CryptoSessionState =
  | 'INACTIVE'
  | 'GENERATING_KEYS'
  | 'WAITING_FOR_PEER'
  | 'DERIVING_SECRET'
  | 'READY'
  | 'FAILED'
  | 'DESTROYED';

// ─────────────────────────────────────────────
// UI (Drawer) State Machine
// ─────────────────────────────────────────────

/**
 * Controls the chat drawer slide animation.
 * The drawer is always mounted; CSS transitions move it on/off screen.
 *
 * CLOSED ──► OPEN ──► MINIMIZED
 *   ▲                    │
 *   └────────────────────┘  (game end destroys the session)
 */
export type ChatUIState = 'CLOSED' | 'OPEN' | 'MINIMIZED';

// ─────────────────────────────────────────────
// Lock icon position (percentage coordinates relative to board)
// ─────────────────────────────────────────────

export interface LockIconPosition {
  /** Percentage from left edge of the board container (0-100). */
  leftPct: number;
  /** Percentage from top edge of the board container (0-100). */
  topPct: number;
}
