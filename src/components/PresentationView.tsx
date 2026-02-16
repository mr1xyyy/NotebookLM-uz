
import React, { useState, useEffect } from 'react';
import { 
  X, Download, ChevronLeft, ChevronRight, Loader2, Check, Maximize2, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { PresentationData } from '../types';
import { jsPDF } from 'jspdf';

const PRESENTATION_SLIDE_INDEX_KEY = 'presentation_selected_slide_index';

interface PresentationViewProps {
  data: PresentationData;
  sourceCount: number;
  onClose: () => void;
  onExpand?: () => void;
  theme: 'dark';
  mode?: 'sidebar' | 'fullscreen';
  title?: string;
}

const PresentationView: React.FC<PresentationViewProps> = ({ data, sourceCount, onClose, onExpand, theme, mode = 'sidebar', title }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isExported, setIsExported] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');

  const currentSlide = data.slides[currentSlideIndex];
  const isSidebar = mode === 'sidebar';
  const isFullscreen = mode === 'fullscreen';

  useEffect(() => {
    if (!isFullscreen) return;
    const saved = window.sessionStorage.getItem(PRESENTATION_SLIDE_INDEX_KEY);
    if (saved == null) return;
    const parsed = Number(saved);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed < data.slides.length) {
      setCurrentSlideIndex(parsed);
    }
    window.sessionStorage.removeItem(PRESENTATION_SLIDE_INDEX_KEY);
  }, [isFullscreen, data.slides.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.code === 'Space') {
          e.preventDefault();
          handleNext();
          return;
        }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') handleNext();
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') handlePrev();
        if (e.key === 'Escape') onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlideIndex, isFullscreen]);

  const handleNext = () => {
    if (currentSlideIndex < data.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
    const factor = Math.pow(1.1, -e.deltaY / 120);
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.3), 2));
  };

  const downloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;
    setIsExporting(true);
    
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });
    const pageWidth = 1280;
    const margin = 60;
    const contentWidth = pageWidth - (margin * 2);

    try {
      for (let i = 0; i < data.slides.length; i++) {
        const slide = data.slides[i];
        if (i > 0) pdf.addPage([1280, 720], 'landscape');
        
        pdf.setFillColor(245, 242, 235); 
        pdf.rect(0, 0, 1280, 720, 'F');

        pdf.setTextColor(26, 28, 30);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(48);
        
        const titleLines = pdf.splitTextToSize(slide.title, contentWidth);
        pdf.text(titleLines, margin, 180);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(24);
        pdf.setTextColor(55, 65, 81); 

        let currentY = 280;
        slide.content.forEach((line) => {
          const wrappedLine = pdf.splitTextToSize(`• ${line}`, contentWidth);
          pdf.text(wrappedLine, margin + 20, currentY);
          currentY += (wrappedLine.length * 34) + 12;
        });

        pdf.setFontSize(14);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`AI Research Assistant | Slayd ${i + 1} / ${data.slides.length}`, margin, 680);
      }

      const safeTitle = (title || data.title).replace(new RegExp('\\s+', 'g'), '_');
      pdf.save(`${safeTitle}.pdf`);
      setIsExported(true);
      setTimeout(() => setIsExported(false), 3000);
    } catch (err) {
      console.error("PDF yaratishda xatolik:", err);
    } finally {
      setIsExporting(false);
    }
  };

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
            <button 
              onClick={downloadPdf} 
              className={`p-1.5 rounded-lg hover:bg-white/5 transition-all ${isExporting ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : (isExported ? <Check size={16} className="text-green-500" /> : <Download size={16} />)}
            </button>
            <button onClick={onExpand} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"><Maximize2 size={16} /></button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"><X size={16} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
          <div className="space-y-2">
            {data.slides.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentSlideIndex(idx);
                  if (onExpand) {
                    window.sessionStorage.setItem(PRESENTATION_SLIDE_INDEX_KEY, String(idx));
                    onExpand();
                  }
                }}
                className={`w-full text-left rounded-xl border overflow-hidden transition-all ${
                  currentSlideIndex === idx
                    ? 'border-indigo-500/70 ring-2 ring-indigo-500/25'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="aspect-[16/9] bg-[#f5f2eb] flex flex-col overflow-hidden">
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-4 flex flex-col h-full">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5b6472]/70 mb-2">
                        Slayd {idx + 1}
                      </div>
                      <h4 className="text-[19px] font-black text-[#1a1c1e] leading-tight mb-3 line-clamp-2">
                        {slide.title}
                      </h4>
                      <div className="flex-1 grid grid-cols-5 gap-3">
                        <div className="col-span-3">
                          <ul className="space-y-1.5">
                            {slide.content.slice(0, 4).map((item, i) => (
                              <li key={i} className="flex gap-2 text-[10px] text-[#374151] leading-snug">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                                <span className="line-clamp-2">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="col-span-2 rounded-md border border-[#d6d2ca] bg-[#ede9e1] p-2 flex flex-col justify-center gap-1.5">
                          <div className="h-1.5 w-4/5 bg-black/10 rounded-sm" />
                          <div className="h-1.5 w-full bg-black/10 rounded-sm" />
                          <div className="h-1.5 w-3/4 bg-black/10 rounded-sm" />
                          <div className="h-1.5 w-2/3 bg-black/10 rounded-sm" />
                          <div className="h-1.5 w-1/2 bg-black/10 rounded-sm" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-[#1a1c1f] text-white animate-in fade-in duration-500 p-2 sm:p-3">
      <div className="relative h-full w-full rounded-[18px] border border-[#2b3139] overflow-hidden bg-[linear-gradient(180deg,#232831_0%,#1f242c_18%,#1b1f25_100%)] flex flex-col">
        <header className="h-16 px-5 flex items-center justify-between shrink-0 bg-transparent border-b border-white/5">
          <div className="flex flex-col">
            <h2 className="text-[22px] font-semibold text-gray-100 leading-none">{title || data.title}</h2>
            <p className="text-[11px] text-gray-400 mt-1">{sourceCount} ta manba asosida</p>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={downloadPdf} 
              className={`p-2 rounded-md hover:bg-white/5 transition-all ${isExporting ? 'text-indigo-400' : 'text-gray-400 hover:text-white'}`}
            >
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : (isExported ? <Check size={18} className="text-green-500" /> : <Download size={18} />)}
            </button>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all">
              <X size={20} />
            </button>
          </div>
        </header>

      <div className="flex-1 flex overflow-hidden px-10 pb-10" onWheel={handleWheelZoom}>
        {/* Main Presentation Area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <div
            className="aspect-[16/9]"
            style={{
              width: 'min(1920px, 90vw, calc((100vh - 180px) * 16 / 9))',
              transform: `scale(${zoom})`,
              transformOrigin: zoomOrigin,
            }}
          >
            {/* The Slide Card - Minimalist & Sharp Corners */}
            <div className="w-full h-full bg-[#f5f2eb] rounded-none shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden relative animate-in zoom-in-95 duration-700 ease-out">
              {currentSlide.imageUrl ? (
                <img src={currentSlide.imageUrl} alt={currentSlide.title} className="w-full h-full object-contain bg-[#f5f2eb]" />
              ) : (
                <div className="w-full h-full p-20 sm:p-28 flex flex-col justify-center">
                  <h3 className="text-5xl font-black mb-12 tracking-tight text-[#1a1c1e] leading-tight max-w-[90%]">
                    {currentSlide.title}
                  </h3>
                  <ul className="space-y-10">
                    {currentSlide.content.map((item, i) => (
                      <li key={i} className="flex items-start gap-7 text-2xl text-[#374151] font-medium leading-relaxed">
                        <div className="w-4 h-4 rounded-full bg-indigo-500 mt-3 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="absolute bottom-12 right-16 flex items-center gap-2 opacity-10 grayscale pointer-events-none">
                     <div className="w-4 h-4 bg-indigo-600 rounded-sm" />
                     <span className="text-[9px] font-black text-black tracking-[0.3em] uppercase">NotebookLM</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Thumbnails Sidebar */}
        <div className="w-64 shrink-0 flex flex-col ml-8 overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 pt-2">
            {data.slides.map((slide, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className="group cursor-pointer flex items-start gap-3"
              >
                <div className={`w-4 text-center text-sm font-bold pt-1 ${currentSlideIndex === idx ? 'text-gray-100' : 'text-gray-500'}`}>
                  {idx + 1}
                </div>

                <div
                  className={`
                    relative flex-1 rounded-xl overflow-hidden border transition-all duration-200
                    ${currentSlideIndex === idx
                      ? 'border-indigo-500 ring-2 ring-indigo-500/25 shadow-[0_10px_24px_-14px_rgba(99,102,241,0.8)]'
                      : 'border-white/10 hover:border-white/20 opacity-85 hover:opacity-100'}
                  `}
                >
                  <div className="aspect-[16/9] w-full bg-[#f5f2eb] p-3.5 flex flex-col justify-center">
                    <div className="h-1.5 w-1/2 bg-black/10 rounded-sm mb-2" />
                    <div className="h-1.5 w-full bg-black/10 rounded-sm mb-1" />
                    <div className="h-1.5 w-[88%] bg-black/10 rounded-sm mb-1" />
                    <div className="h-1.5 w-[72%] bg-black/10 rounded-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="h-12 px-10 flex items-center justify-center shrink-0 border-t border-white/5 bg-black/10">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] opacity-70">
          Javoblar noto'g'ri bo'lishi mumkin
        </p>
      </footer>
      </div>
    </div>
  );
};

export default PresentationView;

