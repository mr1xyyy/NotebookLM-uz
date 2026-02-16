
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Download, Plus, Minus, ChevronRight, RotateCcw, Maximize2 } from 'lucide-react';

interface InfographicViewProps {
  imageUrl: string;
  title: string;
  onClose: () => void;
  onExpand?: () => void;
  onShrink?: () => void;
  theme: 'light' | 'dark';
  mode: 'sidebar' | 'fullscreen';
}

const InfographicView: React.FC<InfographicViewProps> = ({ imageUrl, title, onClose, onExpand, onShrink, theme, mode }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleReset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    handleReset();
  }, [imageUrl, handleReset]);

  const handleZoomChange = (delta: number) => {
    setZoom(prev => Math.min(Math.max(prev + delta, 0.1), 8.0));
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const factor = Math.pow(1.1, -e.deltaY / 120);
    const newZoom = Math.min(Math.max(zoom * factor, 0.1), 8.0);
    
    if (newZoom !== zoom) {
      const worldX = (mouseX - position.x) / zoom;
      const worldY = (mouseY - position.y) / zoom;

      const newX = mouseX - worldX * newZoom;
      const newY = mouseY - worldY * newZoom;

      setZoom(newZoom);
      setPosition({ x: newX, y: newY });
    }
  }, [zoom, position]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => container?.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/\s+/g, '_')}_infographic.png`;
    link.click();
  };

  if (mode === 'sidebar') {
    return (
      <div className="flex flex-col h-full bg-[#1e1e1e] animate-in fade-in duration-300">
        <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-[#25282c] border-b border-white/5 z-30 relative">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest shrink-0">Studio</span>
            <ChevronRight size={10} className="text-gray-700 shrink-0" />
            <h3 className="text-[11px] font-bold text-gray-200 truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={onExpand} 
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all" 
              title="To'liq ekranda ko'rish"
            >
              <Maximize2 size={16} />
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className={`flex-1 relative overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ backgroundColor: '#1e1e1e' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div 
            className="absolute flex items-center justify-center min-w-full min-h-full"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`, 
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <img 
              src={imageUrl} 
              alt={title} 
              draggable={false} 
              className="max-w-full max-h-full object-contain select-none shadow-2xl p-4" 
            />
          </div>
          
          <div className="absolute bottom-4 right-4 flex flex-col bg-black/60 border border-white/10 rounded-lg overflow-hidden backdrop-blur-md">
            <button onClick={() => handleZoomChange(0.25)} className="p-2 hover:bg-white/10 text-gray-300 border-b border-white/5"><Plus size={14} /></button>
            <button onClick={() => handleZoomChange(-0.25)} className="p-2 hover:bg-white/10 text-gray-300"><Minus size={14} /></button>
            <button onClick={handleReset} className="p-2 hover:bg-white/10 text-gray-300 border-t border-white/5"><RotateCcw size={14} /></button>
          </div>
        </div>
      </div>
    );
  }

  // Fullscreen mode aligned with other fullscreen views
  return (
    <div className="fixed inset-0 z-[500] bg-[#1a1c1f] text-white animate-in fade-in duration-300 p-2 sm:p-3">
      <div className="relative h-full w-full rounded-[18px] border border-[#2b3139] overflow-hidden bg-[linear-gradient(180deg,#232831_0%,#1f242c_18%,#1b1f25_100%)] flex flex-col">
        <div className="h-16 px-5 flex items-center justify-between shrink-0 bg-transparent border-b border-white/5">
          <div className="flex flex-col">
            <h2 className="text-[22px] font-semibold text-gray-100 leading-none">{title}</h2>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={handleDownload} 
              className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all"
              title="Yuklab olish"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all"
              title="Yopish"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div 
          ref={containerRef}
          className={`flex-1 relative overflow-hidden flex items-center justify-center cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div 
            className="absolute flex items-center justify-center min-w-full min-h-full"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`, 
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            <img 
              src={imageUrl} 
              alt={title} 
              draggable={false}
              className="max-w-[96vw] max-h-[78vh] object-contain select-none"
            />
          </div>

          <div className="absolute bottom-8 right-8 flex flex-col items-center bg-[#25282c]/80 border border-white/10 rounded-3xl p-1 shadow-2xl backdrop-blur-xl">
            <button onClick={() => handleZoomChange(0.3)} className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Plus size={20} /></button>
            <div className="w-4 h-px bg-white/10 my-1"></div>
            <button onClick={() => handleZoomChange(-0.3)} className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><Minus size={20} /></button>
          </div>
        </div>

        <div className="h-10 px-10 flex items-center justify-center shrink-0 border-t border-white/5 bg-black/10">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] text-center opacity-70">
            Javoblar noto'g'ri bo'lishi mumkin. Ularni albatta tekshirib ko'ring.
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfographicView;
