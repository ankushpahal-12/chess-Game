import { useState, useRef, useEffect, useCallback } from 'react';
import type { ActivationState, LockIconPosition } from '../types/chat';
import type { Chess } from 'chess.js';

const HOLD_DURATION_MS = 3_000;  // mobile: press duration
const LOCK_AUTODISMISS_MS = 5_000;  // lock auto-hides after 5 s
const COOLDOWN_MS = 5_000;  // cooldown after lock dismissed
const DRAG_CANCEL_THRESHOLD = 15;     // px of movement that cancels a hold

interface UseHiddenActivationOptions {
  chess: Chess;
  role: 'white' | 'black' | null;
  isMyTurn: boolean;
  isBoardBusy: boolean;
  /** Full block — used for mobile hold path (game over, offline, disconnect, modal, etc.) */
  isBlocked: boolean;
  /** Only game-over — used for keyboard shortcut (shortcut works even when offline/disconnected) */
  isGameOver: boolean;
  boardContainerRef: React.RefObject<HTMLDivElement | null>;
  onLockTapped: () => void;
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
  isGameOver,
  boardContainerRef,
  onLockTapped,
  fen,
}: UseHiddenActivationOptions): UseHiddenActivationReturn {
  const [activationState, setActivationState] = useState<ActivationState>('INACTIVE');
  const [lockPosition, setLockPosition] = useState<LockIconPosition | null>(null);

  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startClientRef = useRef<{ x: number; y: number } | null>(null);
  const targetSquareRef = useRef<string | null>(null);
  const lastFenRef = useRef(fen);

  // Always-fresh ref for use inside event listeners
  const activationStateRef = useRef<ActivationState>('INACTIVE');
  useEffect(() => { activationStateRef.current = activationState; }, [activationState]);

  // ─── Timer helpers ────────────────────────────────────────────────────────

  const clearHoldTimer = () => {
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
  };

  const clearDismissTimer = () => {
    if (dismissTimerRef.current) { clearTimeout(dismissTimerRef.current); dismissTimerRef.current = null; }
  };

  const startCooldown = useCallback(() => {
    cooldownRef.current = true;
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
  }, []);

  const triggerVibration = () => {
    if ('vibrate' in navigator) { try { navigator.vibrate(50); } catch { /* silent */ } }
  };

  /** Compute the King square's % position inside the board container. */
  const computeKingPosition = useCallback(
    (square: string): LockIconPosition | null => {
      const container = boardContainerRef.current;
      if (!container) return null;

      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const fileIndex = files.indexOf(square[0]);
      const rankIndex = parseInt(square[1], 10) - 1;
      if (fileIndex === -1 || rankIndex < 0 || rankIndex > 7) return null;

      const isBlackOrientation = role === 'black';

      const colPct = isBlackOrientation
        ? ((7 - fileIndex) / 8) * 100 + 100 / 8 / 2
        : (fileIndex / 8) * 100 + 100 / 8 / 2;

      const rowPct = isBlackOrientation
        ? (rankIndex / 8) * 100 + 100 / 8 / 2
        : ((7 - rankIndex) / 8) * 100 + 100 / 8 / 2;

      const topPct = Math.max(0, rowPct - 100 / 8);
      return { leftPct: colPct, topPct };
    },
    [role, boardContainerRef]
  );

  /** Find the local player's King square from the current board state. */
  const findLocalKingSquare = useCallback((): string | null => {
    if (!role) return null;
    const board = chess.board();
    const targetColor = role === 'white' ? 'w' : 'b';
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === targetColor) {
          return `${files[c]}${8 - r}`;
        }
      }
    }
    return null;
  }, [chess, role]);

  const dismiss = useCallback((withCooldown = true) => {
    clearHoldTimer();
    clearDismissTimer();
    setActivationState('INACTIVE');
    setLockPosition(null);
    targetSquareRef.current = null;
    startClientRef.current = null;
    if (withCooldown) startCooldown();
  }, [startCooldown]);

  /** Show the floating lock icon at the given square and start the 5 s auto-dismiss. */
  const showLock = useCallback((square: string) => {
    triggerVibration();
    targetSquareRef.current = square;
    const pos = computeKingPosition(square);
    setLockPosition(pos);
    setActivationState('LOCK_VISIBLE');
    dismissTimerRef.current = setTimeout(() => dismiss(true), LOCK_AUTODISMISS_MS);
  }, [computeKingPosition, dismiss]);

  // ─── Auto-dismiss when a move is made ────────────────────────────────────

  useEffect(() => {
    if (fen !== lastFenRef.current) {
      lastFenRef.current = fen;
      if (activationStateRef.current === 'LOCK_VISIBLE') dismiss(true);
    }
  }, [fen, dismiss]);

  // ─── App backgrounding ────────────────────────────────────────────────────

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) return;
      if (activationStateRef.current === 'HOLDING') {
        clearHoldTimer();
        setActivationState('INACTIVE');
        startClientRef.current = null;
      } else if (activationStateRef.current === 'LOCK_VISIBLE') {
        dismiss(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [dismiss]);

  // ─── Recompute lock position on window resize ─────────────────────────────

  useEffect(() => {
    if (activationState !== 'LOCK_VISIBLE' || !targetSquareRef.current) return;
    const handleResize = () => {
      if (targetSquareRef.current) setLockPosition(computeKingPosition(targetSquareRef.current));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activationState, computeKingPosition]);

  // ─── Desktop: Ctrl+Shift+M keyboard shortcut ─────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.altKey &&
        e.shiftKey &&
        !e.ctrlKey &&
        (e.key === 'h' || e.key === 'H')
      ) {
        // Keyboard shortcut only blocks on game-over or cooldown
        // (works even when offline or opponent is disconnected)
        if (activationStateRef.current !== 'INACTIVE') return;
        if (isGameOver || cooldownRef.current) return;

        e.preventDefault();

        const kingSquare = findLocalKingSquare();
        if (kingSquare) {
          showLock(kingSquare);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // findLocalKingSquare and showLock are stable useCallbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver, findLocalKingSquare, showLock]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearHoldTimer();
      clearDismissTimer();
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  // ─── Mobile: pointer-based hold gesture ──────────────────────────────────

  const onPointerDown = useCallback(
    (square: string, clientX: number, clientY: number) => {
      if (
        isBlocked || !isMyTurn || isBoardBusy ||
        cooldownRef.current || activationState !== 'INACTIVE'
      ) return;

      const piece = chess.get(square as Parameters<Chess['get']>[0]);
      const isLocalKing =
        piece?.type === 'k' &&
        ((piece.color === 'w' && role === 'white') ||
          (piece.color === 'b' && role === 'black'));
      if (!isLocalKing) return;

      targetSquareRef.current = square;
      startClientRef.current = { x: clientX, y: clientY };
      setActivationState('HOLDING');

      holdTimerRef.current = setTimeout(() => {
        setActivationState((prev) => {
          if (prev !== 'HOLDING') return prev;
          if (targetSquareRef.current) showLock(targetSquareRef.current);
          return 'LOCK_VISIBLE';
        });
      }, HOLD_DURATION_MS);
    },
    [activationState, chess, role, isMyTurn, isBoardBusy, isBlocked, showLock]
  );

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

  const onPointerUp = useCallback(() => {
    if (activationState === 'HOLDING') {
      clearHoldTimer();
      setActivationState('INACTIVE');
      startClientRef.current = null;
    }
  }, [activationState]);

  const onPointerCancel = useCallback(() => {
    clearHoldTimer();
    if (activationState === 'HOLDING') {
      setActivationState('INACTIVE');
      startClientRef.current = null;
    }
  }, [activationState]);

  // ─── Shared: lock icon tapped ─────────────────────────────────────────────

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
