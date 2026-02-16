import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, RotateCcw, Download, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { FlashcardData } from '../types';

interface FlashcardViewProps {
  data: FlashcardData;
  sourceCount: number;
  onClose: () => void;
  onExpand?: () => void;
  theme: 'light' | 'dark';
  mode?: 'sidebar' | 'fullscreen';
  title?: string;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ data, sourceCount, onClose, onExpand, theme, mode = 'sidebar', title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const cards = data?.cards || [];

  const isSidebar = mode === 'sidebar';
  const isFullscreen = mode === 'fullscreen';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isTyping) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowLeft') handlePrev();
      else if (e.code === 'ArrowRight') handleNext();
      else if (e.code === 'Escape' && isFullscreen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length, isFullscreen, isSidebar]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleDownloadCsv = () => {
    const escapeCsv = (value: string) => {
      const normalized = String(value ?? '');
      return `"${normalized.replace(/"/g, '""')}"`;
    };

    const rows = cards.map((card) => `${escapeCsv(card.question)};${escapeCsv(card.answer)}`);
    const csv = ['question;answer', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const baseName = (title || data.title || 'flashcards').replace(/\s+/g, '_');
    link.href = url;
    link.download = `${baseName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (cards.length === 0) return null;
  const currentCard = cards[currentIndex];

  if (isSidebar) {
    return (
      <div className="flex flex-col h-full bg-[#1e1e1e] animate-in fade-in duration-300">
        <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-[#25282c] border-b border-white/5 z-30 relative">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest shrink-0">Studio</span>
            <ChevronRightIcon size={10} className="text-gray-700 shrink-0" />
            <h3 className="text-[11px] font-bold text-gray-200 truncate">{title || data.title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onExpand} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"><Maximize2 size={16} /></button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"><X size={16} /></button>
          </div>
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden"></div>

        <div className="flex-1 flex flex-col relative z-10 px-5 pt-4 pb-3">
          <p className="text-[11px] text-gray-300 text-center mb-3">
            Kartochkani aylantirish uchun Space tugmasini, o'tish uchun chap/o'ng strelkalarni bosing.
          </p>

          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center justify-center gap-5 w-full">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              <div onClick={() => setIsFlipped(!isFlipped)} className="w-full max-w-[290px] aspect-[3/4] perspective-1000 cursor-pointer">
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  <div className="absolute inset-0 backface-hidden bg-[#25282c] border border-white/5 rounded-[2rem] p-8 flex items-center justify-center text-center text-[14px] font-bold text-white shadow-xl">
                    {currentCard.question}
                    <button className="absolute bottom-7 text-[10px] font-black text-gray-500 uppercase tracking-widest opacity-70">Javobni ko'rish</button>
                  </div>
                  <div className="absolute inset-0 backface-hidden bg-[#25282c] border border-white/5 rounded-[2rem] p-8 flex items-center justify-center text-center text-[12px] font-medium text-gray-400 rotate-y-180 shadow-xl">
                    {currentCard.answer}
                    <button className="absolute bottom-7 text-[10px] font-black text-gray-500 uppercase tracking-widest opacity-70">Savolga qaytish</button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={currentIndex === cards.length - 1}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="h-14 border-t border-white/5 mt-4 flex items-center justify-between gap-4 px-2">
            <button onClick={handleRestart} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
              <RotateCcw size={12} /> Qayta boshlash
            </button>

            <div className="flex items-center gap-2 flex-1 max-w-[190px]">
              <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}></div>
              </div>
              <span className="text-[10px] font-black text-gray-500 whitespace-nowrap uppercase tracking-widest">{currentIndex + 1}/{cards.length}</span>
            </div>

            <button onClick={handleDownloadCsv} className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
              <Download size={12} /> Yuklab olish
            </button>
          </div>
        </div>
        <style>{`.perspective-1000 { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-[#12161c] text-white animate-in fade-in duration-500 font-sans p-2 sm:p-3">
      <div className="relative h-full w-full rounded-[18px] border border-[#2b3139] overflow-hidden bg-[linear-gradient(90deg,#171b23_0%,#1a1e26_45%,#1b2029_100%)] flex flex-col">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        </div>

        <header className="h-16 px-5 flex items-center justify-between shrink-0 z-10 border-b border-white/5">
          <div className="flex flex-col">
            <h2 className="text-[22px] font-semibold text-gray-100 leading-none">{title || data.title}</h2>
            <p className="text-[11px] text-gray-400 mt-1">{sourceCount} ta manba asosida</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center relative px-10">
          <p className="absolute top-6 left-1/2 -translate-x-1/2 text-[12px] text-gray-300 font-medium tracking-tight z-10 text-center w-full max-w-[820px] px-6">
            Kartochkani aylantirish uchun Space tugmasini, o'tish uchun chap/o'ng strelkalarni bosing.
          </p>

          <div className="flex items-center justify-center gap-12 w-full max-w-5xl">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="w-12 h-12 rounded-full bg-[#2d3136]/50 backdrop-blur-md border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:bg-[#363a40] disabled:opacity-25 disabled:cursor-not-allowed active:scale-90"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="w-full max-w-[420px] aspect-[3/4] relative perspective-1000">
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''} shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-[2.5rem]`}
              >
                <div className="absolute inset-0 backface-hidden bg-[#2d3136] p-12 flex flex-col items-center justify-center text-center rounded-[2.5rem] border border-white/5">
                  <p className="text-3xl font-bold text-white leading-snug tracking-tight">{currentCard.question}</p>
                  <button className="absolute bottom-10 text-[11px] font-black text-gray-500 uppercase tracking-widest opacity-60">Javobni ko'rish</button>
                </div>
                <div className="absolute inset-0 backface-hidden bg-[#2d3136] p-12 flex flex-col items-center justify-center text-center rotate-y-180 rounded-[2.5rem] border border-white/5">
                  <p className="text-2xl font-medium text-gray-300 leading-relaxed tracking-tight">{currentCard.answer}</p>
                  <button className="absolute bottom-10 text-[11px] font-black text-gray-500 uppercase tracking-widest opacity-60">Savolga qaytish</button>
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
              className="w-12 h-12 rounded-full bg-[#2d3136]/50 backdrop-blur-md border border-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all hover:bg-[#363a40] disabled:opacity-25 disabled:cursor-not-allowed active:scale-90"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <footer className="h-24 px-10 flex items-center justify-center gap-12 shrink-0 z-10 border-t border-white/5">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            <RotateCcw size={14} /> Qayta boshlash
          </button>

          <div className="flex items-center gap-4 flex-1 max-w-sm">
            <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              ></div>
            </div>
            <span className="text-[11px] font-black text-gray-500 whitespace-nowrap uppercase tracking-widest">
              Kartochka: {currentIndex + 1} / {cards.length}
            </span>
          </div>

          <button onClick={handleDownloadCsv} className="flex items-center gap-2 text-xs font-black text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
            <Download size={14} /> Yuklab olish
          </button>
        </footer>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default FlashcardView;

