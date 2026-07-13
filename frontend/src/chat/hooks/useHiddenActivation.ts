/**
 * chat/hooks/useHiddenActivation.ts
 *
 * Custom hook that manages the hidden gesture activation sequence:
 *
 *  INACTIVE  ──(3s hold on local King)──►  HOLDING
 *  HOLDING   ──(hold complete + vibrate)──► LOCK_VISIBLE
 *  LOCK_VISIBLE ──(lock tapped)──►  opens chat drawer
 *  LOCK_VISIBLE ──(5s auto-dismiss OR move made OR game ends)──► INACTIVE + cooldown
 *  INACTIVE  ──(5s cooldown active)──► block new activation
 *
 * Responsibilities:
 *  - Detecting a 3-second press on the local player's King.
 *  - Cancelling on drag (>15px) or pointer cancel.
 *  - Triggering short haptic feedback via navigator.vibrate.
 *  - Computing King square position as CSS % relative to the board container.
 *  - Respecting prefers-reduced-motion (fade vs bounce animation).
 *  - Handling app backgrounding and window resize.
 *  - Enforcing 5s cooldown after dismissal.
 *  - Blocking activation during critical game states.
 *
 * Does NOT: manage crypto, messages, or sockets.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ActivationState, LockIconPosition } from '../types/chat';
import type { Chess } from 'chess.js';

const HOLD_DURATION_MS      = 3_000;
const LOCK_AUTODISMISS_MS   = 5_000;
const COOLDOWN_MS           = 5_000;
const DRAG_CANCEL_THRESHOLD = 15; // pixels

interface UseHiddenActivationOptions {
  chess: Chess;
  role: 'white' | 'black' | null;
  /** True when it is this player's turn. */
  isMyTurn: boolean;
  /** True when the board is animating, promotion modal open, or similar. */
  isBoardBusy: boolean;
  /** Blocks activation for any critical game state (game over, reconnecting, offline, etc.). */
  isBlocked: boolean;
  /** Ref to the outer board container DOM element. */
  boardContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Called when the lock icon is tapped. */
  onLockTapped: () => void;
  /** Current FEN — used to auto-dismiss lock when a move is made. */
  fen: string;
}

interface UseHiddenActivationReturn {
  activationState: ActivationState;
  lockPosition: LockIconPosition | null;
  prefersReducedMotion: boolean;
  onPointerDown: (square: string, clientX: number, clientY: number) => void;
  onPointerMove: (clientX: number, clientY: number) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onLockTap: () => void;
}

export function useHiddenActivation({
  chess,
  role,
  isMyTurn,
  isBoardBusy,
  isBlocked,
  boardContainerRef,
  onLockTapped,
  fen,
}: UseHiddenActivationOptions): UseHiddenActivationReturn {
  const [activationState, setActivationState] = useState<ActivationState>('INACTIVE');
  const [lockPosition, setLockPosition]       = useState<LockIconPosition | null>(null);

  // Track system motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  // Internal refs (avoid stale closures)
  const holdTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownRef     = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startClientRef  = useRef<{ x: number; y: number } | null>(null);
  const targetSquareRef = useRef<string | null>(null);
  const lastFenRef      = useRef(fen);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const clearDismissTimer = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  };

  const startCooldown = useCallback(() => {
    cooldownRef.current = true;
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => {
      cooldownRef.current = false;
    }, COOLDOWN_MS);
  }, []);

  const triggerVibration = () => {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(50); } catch { /* silent */ }
    }
  };

  /** Compute the King's percentage position inside the board container. */
  const computeKingPosition = useCallback(
    (square: string): LockIconPosition | null => {
      const container = boardContainerRef.current;
      if (!container) return null;

      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const fileIndex = files.indexOf(square[0]);
      const rankIndex = parseInt(square[1], 10) - 1; // 0-based from bottom

      if (fileIndex === -1 || rankIndex < 0 || rankIndex > 7) return null;

      // For white orientation: file 'a'=left, rank 1=bottom
      // For black orientation: the board is flipped
      const isBlackOrientation = role === 'black';

      const colPct = isBlackOrientation
        ? ((7 - fileIndex) / 8) * 100 + 100 / 8 / 2
        : (fileIndex / 8) * 100 + 100 / 8 / 2;

      const rowPct = isBlackOrientation
        ? (rankIndex / 8) * 100 + 100 / 8 / 2
        : ((7 - rankIndex) / 8) * 100 + 100 / 8 / 2;

      // Place lock icon one square above the King (subtract one square height in %)
      const topPct = Math.max(0, rowPct - 100 / 8);

      return { leftPct: colPct, topPct };
    },
    [role, boardContainerRef]
  );

  const dismiss = useCallback(() => {
    clearHoldTimer();
    clearDismissTimer();
    setActivationState('INACTIVE');
    setLockPosition(null);
    startCooldown();
  }, [startCooldown]);

  // ─── Auto-dismiss lock when FEN changes (move made) ──────────────────────

  useEffect(() => {
    if (fen !== lastFenRef.current) {
      lastFenRef.current = fen;
      if (activationState === 'LOCK_VISIBLE') {
        dismiss();
      }
    }
  }, [fen, activationState, dismiss]);

  // ─── App backgrounding: cancel hold or dismiss lock ──────────────────────

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (activationState === 'HOLDING') {
          clearHoldTimer();
          setActivationState('INACTIVE');
        } else if (activationState === 'LOCK_VISIBLE') {
          dismiss();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activationState, dismiss]);

  // ─── Recompute lock position on resize/orientation change ────────────────

  useEffect(() => {
    if (activationState !== 'LOCK_VISIBLE' || !targetSquareRef.current) return;

    const handleResize = () => {
      if (targetSquareRef.current) {
        setLockPosition(computeKingPosition(targetSquareRef.current));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activationState, computeKingPosition]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearHoldTimer();
      clearDismissTimer();
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  // ─── Gesture handlers ────────────────────────────────────────────────────

  /** Called by ChessBoardWrapper when a pointer-down event occurs on a square. */
  const onPointerDown = useCallback(
    (square: string, clientX: number, clientY: number) => {
      // Gate checks
      if (
        isBlocked ||
        !isMyTurn ||
        isBoardBusy ||
        cooldownRef.current ||
        activationState !== 'INACTIVE'
      ) return;

      // Must be the local player's King
      const piece = chess.get(square as Parameters<Chess['get']>[0]);
      const isLocalKing =
        piece?.type === 'k' &&
        ((piece.color === 'w' && role === 'white') ||
          (piece.color === 'b' && role === 'black'));

      if (!isLocalKing) return;

      targetSquareRef.current = square;
      startClientRef.current  = { x: clientX, y: clientY };
      setActivationState('HOLDING');

      holdTimerRef.current = setTimeout(() => {
        // Only activate if we're still in HOLDING state
        setActivationState((prev) => {
          if (prev !== 'HOLDING') return prev;

          triggerVibration();
          const pos = computeKingPosition(square);
          setLockPosition(pos);

          // Auto-dismiss after 5 s
          dismissTimerRef.current = setTimeout(() => {
            dismiss();
          }, LOCK_AUTODISMISS_MS);

          return 'LOCK_VISIBLE';
        });
      }, HOLD_DURATION_MS);
    },
    [isBlocked, isMyTurn, isBoardBusy, activationState, chess, role, computeKingPosition, dismiss]
  );

  /** Called on pointer move; cancels hold if dragged beyond threshold. */
  const onPointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (activationState !== 'HOLDING' || !startClientRef.current) return;

      const dx = clientX - startClientRef.current.x;
      const dy = clientY - startClientRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_CANCEL_THRESHOLD) {
        clearHoldTimer();
        setActivationState('INACTIVE');
        startClientRef.current = null;
      }
    },
    [activationState]
  );

  /** Called on pointer up; cancels hold if released before 3s. */
  const onPointerUp = useCallback(() => {
    if (activationState === 'HOLDING') {
      clearHoldTimer();
      setActivationState('INACTIVE');
      startClientRef.current = null;
    }
  }, [activationState]);

  /** Called on pointer cancel (e.g. scroll, touch interrupted). */
  const onPointerCancel = useCallback(() => {
    clearHoldTimer();
    if (activationState === 'HOLDING') {
      setActivationState('INACTIVE');
      startClientRef.current = null;
    }
  }, [activationState]);

  /** Called when the floating lock icon is tapped. */
  const onLockTap = useCallback(() => {
    if (activationState !== 'LOCK_VISIBLE') return;
    clearDismissTimer();
    setActivationState('INACTIVE');
    setLockPosition(null);
    targetSquareRef.current = null;
    onLockTapped();
  }, [activationState, onLockTapped]);

  return {
    activationState,
    lockPosition,
    prefersReducedMotion,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLockTap,
  };
}

export default useHiddenActivation;
