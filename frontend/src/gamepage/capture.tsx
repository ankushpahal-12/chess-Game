import React from 'react';

interface CapturedPiecesProps {
  fen: string;
  theme?: 'dark' | 'light';
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({ fen, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  // Count pieces currently on board from FEN placement string
  const getCaptured = () => {
    const piecePlacement = fen.split(' ')[0];
    const currentCounts = {
      p: 0, r: 0, n: 0, b: 0, q: 0, k: 0, // Black pieces (lowercase)
      P: 0, R: 0, N: 0, B: 0, Q: 0, K: 0  // White pieces (uppercase)
    };

    for (let char of piecePlacement) {
      if (char in currentCounts) {
        currentCounts[char as keyof typeof currentCounts]++;
      }
    }

    // Default chess starting piece set totals
    const startingCounts = {
      p: 8, r: 2, n: 2, b: 2, q: 1,
      P: 8, R: 2, N: 2, B: 2, Q: 1
    };

    // Calculate captured pieces
    const capturedWhite: string[] = [];
    const capturedBlack: string[] = [];

    // White pieces captured (represented by White symbols)
    for (let i = 0; i < startingCounts.P - currentCounts.P; i++) capturedWhite.push('♙');
    for (let i = 0; i < startingCounts.N - currentCounts.N; i++) capturedWhite.push('♘');
    for (let i = 0; i < startingCounts.B - currentCounts.B; i++) capturedWhite.push('♗');
    for (let i = 0; i < startingCounts.R - currentCounts.R; i++) capturedWhite.push('♖');
    for (let i = 0; i < startingCounts.Q - currentCounts.Q; i++) capturedWhite.push('♕');

    // Black pieces captured (represented by Black symbols)
    for (let i = 0; i < startingCounts.p - currentCounts.p; i++) capturedBlack.push('♟');
    for (let i = 0; i < startingCounts.n - currentCounts.n; i++) capturedBlack.push('♞');
    for (let i = 0; i < startingCounts.b - currentCounts.b; i++) capturedBlack.push('♝');
    for (let i = 0; i < startingCounts.r - currentCounts.r; i++) capturedBlack.push('♜');
    for (let i = 0; i < startingCounts.q - currentCounts.q; i++) capturedBlack.push('♛');

    return { capturedWhite, capturedBlack };
  };

  const { capturedWhite, capturedBlack } = getCaptured();

  return (
    <div className={`p-5 rounded-2xl border text-left flex flex-col space-y-4 transition-all duration-300 w-full ${
      isDark ? 'bg-[#0d1321]/80 border-slate-850' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-450'}`}>
        Captured Pieces
      </div>

      <div className="flex flex-col space-y-3">
        {/* Captured Black Pieces (Won by White) */}
        <div className="flex flex-wrap gap-1.5 items-center min-h-[24px]">
          <span className="text-[10px] text-slate-500 font-bold tracking-wider mr-2 uppercase">White won:</span>
          {capturedBlack.length === 0 ? (
            <span className="text-[10px] text-slate-500 italic">None</span>
          ) : (
            capturedBlack.map((symbol, idx) => (
              <span 
                key={idx} 
                className={`text-lg leading-none ${isDark ? 'text-slate-200' : 'text-slate-850'}`}
                title="Captured Black Piece"
              >
                {symbol}
              </span>
            ))
          )}
        </div>

        {/* Divider */}
        <div className={`border-t border-dashed ${isDark ? 'border-slate-850' : 'border-slate-150'}`} />

        {/* Captured White Pieces (Won by Black) */}
        <div className="flex flex-wrap gap-1.5 items-center min-h-[24px]">
          <span className="text-[10px] text-slate-500 font-bold tracking-wider mr-2 uppercase">Black won:</span>
          {capturedWhite.length === 0 ? (
            <span className="text-[10px] text-slate-500 italic">None</span>
          ) : (
            capturedWhite.map((symbol, idx) => (
              <span 
                key={idx} 
                className={`text-lg leading-none ${isDark ? 'text-indigo-400' : 'text-indigo-650'}`}
                title="Captured White Piece"
              >
                {symbol}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
export default CapturedPieces;
