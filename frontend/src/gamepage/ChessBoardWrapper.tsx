import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { sounds } from '../utils/sound';
import PromotionModal from './PromotionModal';
import { Lock } from 'lucide-react';
import { useChatSession } from '../chat/context/ChatSessionContext';
import { useHiddenActivation } from '../chat/hooks/useHiddenActivation';

interface ChessBoardWrapperProps {
  fen: string;
  role: 'white' | 'black' | null;
  turn: 'w' | 'b';
  onMove: (from: string, to: string, promotion?: string) => boolean;
  chess: Chess;
  isGameOver: boolean;
  isOffline?: boolean;
  isBlocked?: boolean;
}

export const ChessBoardWrapper: React.FC<ChessBoardWrapperProps> = ({
  fen,
  role,
  turn,
  onMove,
  chess,
  isGameOver,
  isOffline = false,
  isBlocked = false,
}) => {
  const chatSession = useChatSession();
  const boardRef = useRef<HTMLDivElement>(null);

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, any>>({});
  const [boardWidth, setBoardWidth] = useState(560);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
    color: 'w' | 'b';
  } | null>(null);

  const [isBoardAnimating, setIsBoardAnimating] = useState(false);

  // Track if a board animation is running
  useEffect(() => {
    setIsBoardAnimating(true);
    const timer = setTimeout(() => setIsBoardAnimating(false), 400);
    return () => clearTimeout(timer);
  }, [fen]);

  const isMyTurn = (turn === 'w' && role === 'white') || (turn === 'b' && role === 'black');

  const {
    activationState,
    lockPosition,
    prefersReducedMotion,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLockTap,
  } = useHiddenActivation({
    chess,
    role,
    isMyTurn,
    isBoardBusy: isBoardAnimating || !!pendingPromotion,
    isBlocked,
    isGameOver,
    boardContainerRef: boardRef,
    onLockTapped: () => chatSession.open(),
    fen,
  });

  // Resize board dynamically to be fully responsive and fit viewport height without scroll
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      const width = isMobile
        ? Math.max(Math.min(window.innerWidth - 32, window.innerHeight - 260, 460), 240)
        : Math.min(window.innerWidth - 480, window.innerHeight - 220, 680);
      setBoardWidth(width);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger sound effects based on board moves, checks, and captures
  useEffect(() => {
    if (chess.history().length === 0) return;

    if (chess.isGameOver()) {
      sounds.playMate();
      return;
    }

    if (chess.inCheck()) {
      sounds.playCheck();
      return;
    }

    const lastMove = chess.history({ verbose: true }).pop();
    if (lastMove) {
      if (lastMove.captured) {
        sounds.playCapture();
      } else {
        sounds.playMove();
      }
    }
  }, [fen]);

  const getMoveOptions = (square: string) => {
    // Prevent selecting opponent pieces
    const piece = chess.get(square as any);
    if (!piece) return;
    const isPlayerPiece = isOffline || (piece.color === 'w' && role === 'white') || (piece.color === 'b' && role === 'black');
    if (!isPlayerPiece) return;

    const moves = chess.moves({
      square: square as any,
      verbose: true
    });

    if (moves.length === 0) return;

    const newSquares: Record<string, any> = {};
    moves.forEach((move) => {
      newSquares[move.to] = {
        background:
          chess.get(move.to as any)
            ? 'radial-gradient(circle, rgba(168,85,247,0.35) 75%, transparent 80%)' // Highlight capture option
            : 'radial-gradient(circle, rgba(168,85,247,0.4) 22%, transparent 25%)', // Dot for standard move
        borderRadius: '50%'
      };
    });

    // Highlight the selected square
    newSquares[square] = {
      background: 'rgba(168, 85, 247, 0.25)'
    };

    setOptionSquares(newSquares);
  };

  const onSquareClick = (square: string) => {
    if (isGameOver) return;
    const isActiveColor = isOffline || (turn === 'w' && role === 'white') || (turn === 'b' && role === 'black');
    if (!isActiveColor) return;

    // If there is already a selected square, try making a move
    if (selectedSquare) {
      // Check if clicked square is one of the legal targets
      if (square in optionSquares && square !== selectedSquare) {
        // Check for promotion
        const piece = chess.get(selectedSquare as any);
        const isPromotion = piece?.type === 'p' && (square.endsWith('8') || square.endsWith('1'));

        if (isPromotion) {
          setPendingPromotion({
            from: selectedSquare,
            to: square,
            color: piece.color
          });
          return;
        }

        const success = onMove(selectedSquare, square);
        if (success) {
          setSelectedSquare(null);
          setOptionSquares({});
          return;
        }
      }
    }

    // Otherwise, select the new square and find its options
    setSelectedSquare(square);
    getMoveOptions(square);
  };

  const isDraggable = !isGameOver && !chess.isGameOver() && (isOffline || (turn === 'w' && role === 'white') || (turn === 'b' && role === 'black'));

  const getCheckStyle = () => {
    if (!chess.inCheck()) return null;
    const activeColor = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === activeColor) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          const square = `${files[c]}${8 - r}`;
          return { square, style: { animation: 'king-glow 1.2s infinite alternate', borderRadius: '16px' } };
        }
      }
    }
    return null;
  };

  const getSquareFromCoords = (clientX: number, clientY: number): string | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const colIndex = Math.floor((x / rect.width) * 8);
    const rowIndex = Math.floor((y / rect.height) * 8);

    if (colIndex < 0 || colIndex >= 8 || rowIndex < 0 || rowIndex >= 8) return null;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const isReversed = role === 'black';
    const file = isReversed ? files[7 - colIndex] : files[colIndex];
    const rank = isReversed ? rowIndex + 1 : 8 - rowIndex;
    return `${file}${rank}`;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const square = getSquareFromCoords(e.clientX, e.clientY);
    if (square) {
      onPointerDown(square, e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove(e.clientX, e.clientY);
  };


  return (
    <div className="flex items-center justify-center p-2 bg-slate-950/40 rounded-3xl border border-slate-800/80 shadow-2xl relative">
      <div
        ref={boardRef}
        style={{ width: boardWidth }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="relative"
      >
        <Chessboard
          options={{
            position: fen,
            boardOrientation: role === 'black' ? 'black' : 'white',
            allowDragging: isDraggable,
            squareStyles: (() => {
              const styles = { ...optionSquares };
              const checkInfo = getCheckStyle();
              if (checkInfo) {
                styles[checkInfo.square] = checkInfo.style;
              }
              return styles;
            })(),
            darkSquareStyle: { backgroundColor: '#769656' },
            lightSquareStyle: { backgroundColor: '#eeeed2' },
            boardStyle: {
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)'
            },
            onPieceDrop: ({ piece, sourceSquare, targetSquare }) => {
              if (!targetSquare) return false;

              // Verify pawn promotion
              const isPawn = piece.pieceType.toLowerCase().endsWith('p');
              const isPromotion = isPawn && (targetSquare.endsWith('8') || targetSquare.endsWith('1'));

              if (isPromotion) {
                setPendingPromotion({
                  from: sourceSquare,
                  to: targetSquare,
                  color: piece.pieceType[0].toLowerCase() as 'w' | 'b'
                });
                return false; // Snap back piece until promotion selected
              }

              const success = onMove(sourceSquare, targetSquare);
              if (success) {
                setSelectedSquare(null);
                setOptionSquares({});
              }
              return success;
            },
            onSquareClick: ({ square }) => {
              onSquareClick(square);
            }
          }}
        />

        {/* Floating Lock Icon Overlay */}
        {activationState === 'LOCK_VISIBLE' && lockPosition && (
          <button
            onClick={onLockTap}
            style={{
              position: 'absolute',
              left: `${lockPosition.leftPct}%`,
              top: `${lockPosition.topPct}%`,
              transform: 'translate(-50%, -100%)',
              zIndex: 40,
              width: '44px',
              height: '44px',
              padding: '10px',
            }}
            className={`flex items-center justify-center bg-blue-600 border border-blue-400 text-white rounded-full shadow-lg transition-all duration-200 cursor-pointer ${
              prefersReducedMotion ? 'opacity-100' : 'animate-bounce'
            }`}
            aria-label="Secure Channel Activation Link"
          >
            <Lock className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Floating Pawn Promotion Overlay */}
      <PromotionModal
        isOpen={!!pendingPromotion}
        onSelect={(pieceOpt) => {
          if (pendingPromotion) {
            onMove(pendingPromotion.from, pendingPromotion.to, pieceOpt);
            setPendingPromotion(null);
            setSelectedSquare(null);
            setOptionSquares({});
          }
        }}
        onClose={() => {
          setPendingPromotion(null);
          setSelectedSquare(null);
          setOptionSquares({});
        }}
        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
      />
    </div>
  );
};
export default ChessBoardWrapper;
