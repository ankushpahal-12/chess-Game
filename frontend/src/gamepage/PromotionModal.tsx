import React, { useState } from 'react';

interface PromotionModalProps {
  isOpen: boolean;
  onSelect: (pieceValue: string) => void;
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onSelect,
  onClose,
  theme = 'dark'
}) => {
  const [selectedPiece, setSelectedPiece] = useState<string>('q');

  if (!isOpen) return null;

  const promotionOptions = [
    {
      name: 'Queen',
      value: 'q',
      icon: (
        <svg className="w-8 h-8 text-amber-500 fill-current filter drop-shadow-md" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 5l3 7.5L12 4l7 8.5L22 5v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5zm18 11H4v2h16v-2z" />
          <circle cx="12" cy="3" r="1" className="fill-amber-400" />
          <circle cx="2" cy="4" r="0.75" className="fill-amber-400" />
          <circle cx="22" cy="4" r="0.75" className="fill-amber-400" />
        </svg>
      )
    },
    {
      name: 'Rook',
      value: 'r',
      icon: (
        <svg className="w-7 h-7 text-slate-300 fill-current filter drop-shadow-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 21h14a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1zm2-4h10V9H7v8zM5 8h14V4a1 1 0 0 0-1-1h-2v2h-2V3h-4v2H8V3H6a1 1 0 0 0-1 1v4z" />
        </svg>
      )
    },
    {
      name: 'Bishop',
      value: 'b',
      icon: (
        <svg className="w-7 h-7 text-slate-400 fill-current filter drop-shadow-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 4a6.5 6.5 0 0 0-6.5 6.5c0 2 1.3 3.5 2.5 4.5h8c1.2-1 2.5-2.5 2.5-4.5A6.5 6.5 0 0 0 12 6zm-1.5 4h3v2h-3v-2zm0 3h3v2h-3v-2zM5 19h14a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2z" />
        </svg>
      )
    },
    {
      name: 'Knight',
      value: 'n',
      icon: (
        <svg className="w-7 h-7 text-amber-500 fill-current filter drop-shadow-md" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 21H5v-2a1 1 0 0 1 .5-.8l2-1.5c1.5-1.1 2.5-2.8 2.5-4.7V10c0-3.3 2.7-6 6-6s6 2.7 6 6c0 1.2-.4 2.3-1 3.2l1.5 1.5A1 1 0 0 1 20 19v2h-1zm-6-13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
        </svg>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-250">
      <div className={`relative max-w-[340px] w-full rounded-3xl border p-6 animate-in fade-in zoom-in-95 duration-200 shadow-2xl transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-[#0d1321]/95 border-slate-800 text-white'
          : 'bg-white border-slate-205 text-slate-800 shadow-slate-300/30'
      }`}>
        
        {/* Header Title with X Close Button on Right */}
        <div className="flex items-center justify-between mb-5">
          <h3 className={`text-lg font-black tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-905'}`}>
            Choose Promotion
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-900/60' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Promotion Options - Vertical List */}
        <div className="flex flex-col gap-3">
          {promotionOptions.map((opt) => {
            const isSelected = selectedPiece === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSelectedPiece(opt.value);
                  onSelect(opt.value);
                }}
                className={`flex items-center gap-4.5 p-4 border rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left w-full ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/20'
                    : theme === 'dark'
                      ? 'border-slate-850 bg-[#090d16]/30 text-slate-450 hover:border-slate-800 hover:text-slate-200'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-xs'
                }`}
              >
                {/* Icon */}
                <div className={`transition-all duration-300 shrink-0 w-8 flex items-center justify-center ${isSelected ? 'scale-105' : 'opacity-85'}`}>
                  {opt.icon}
                </div>
                {/* Name */}
                <span className={`text-sm font-black transition-colors duration-200 ${
                  isSelected ? 'text-blue-500' : theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                }`}>
                  {opt.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
