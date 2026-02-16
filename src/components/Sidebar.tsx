
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Plus, Trash2, Globe, Youtube, Search, 
  Image as ImageIcon, FileType, MoreVertical, 
  Check, Pencil, PanelLeftClose, PanelLeftOpen,
  ArrowLeft, Sparkles, AlertCircle, StickyNote
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Source, StudyMaterialType } from '../types';

interface SidebarProps {
  sources: Source[];
  activeSourceIds: Set<string>;
  onToggleSourceActive: (id: string) => void;
  onToggleAllSources: (active: boolean) => void;
  onAddSource: (source: Source) => void;
  onRemoveSource: (id: string) => void;
  onRenameSource: (id: string, newName: string) => void;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onOpenSourceAddition: () => void;
  onOpenUrlModal: () => void;
  onOpenYoutubeModal: () => void;
  onOpenSearchModal: () => void;
  theme: 'dark';
  isOpen: boolean;
  onToggle: () => void;
  onActionWithSelection?: (text: string, type: StudyMaterialType | 'note' | 'chat') => void;
  compactMode?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sources, activeSourceIds, onToggleSourceActive, onToggleAllSources, 
  onRemoveSource, onRenameSource, selectedSourceId, onSelectSource, onOpenSourceAddition, 
  isOpen, onToggle, onActionWithSelection, compactMode = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [currentExtension, setCurrentExtension] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (menuOpenId && !target.closest('.context-menu-container')) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpenId]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text: sel.toString().trim(),
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 10
      });
    } else setSelection(null);
  };

  const filteredSources = sources.filter(source => 
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (source: Source) => {
    const lastDotIndex = source.name.lastIndexOf('.');
    if (lastDotIndex !== -1 && lastDotIndex > 0) {
      setEditValue(source.name.substring(0, lastDotIndex));
      setCurrentExtension(source.name.substring(lastDotIndex));
    } else {
      setEditValue(source.name);
      setCurrentExtension('');
    }
    setEditingId(source.id);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    const newFullName = editValue.trim() + currentExtension;
    const originalSource = sources.find(s => s.id === id);
    if (editValue.trim() && newFullName !== originalSource?.name) onRenameSource(id, newFullName);
    setEditingId(null);
  };

  const getSourceIcon = (source: Source) => {
    if (source.status === 'error') return <AlertCircle size={18} className="text-red-500" />;
    const name = source.name.toLowerCase();
    
    const imageRegex = new RegExp('\\.(png|jpg|jpeg|gif)$');
    const docRegex = new RegExp('\\.(docx|doc)$');
    
    if (source.type === 'youtube') return <Youtube size={18} className="text-red-500" />;
    if (source.type === 'link') return <Globe size={18} className="text-blue-400" />;
    if (imageRegex.test(name)) return <ImageIcon size={18} className="text-red-500" />;
    if (name.endsWith('.pdf')) return (
      <div className="relative">
        <FileText size={18} className="text-red-500" />
        <span className="absolute -bottom-1 -right-1 text-[5px] font-black bg-red-500 text-white px-0.5 rounded-sm">PDF</span>
      </div>
    );
    if (docRegex.test(name)) return <FileText size={18} className="text-blue-500" />;
    return <FileType size={18} className="text-indigo-400" />;
  };

  const isAllSelected = sources.length > 0 && Array.from(activeSourceIds).length === sources.filter(s => s.status === 'ready').length;
  const selectedSource = sources.find(s => s.id === selectedSourceId);

  // COLLAPSED SIDEBAR
  if (!isOpen) {
    return (
      <div className="h-full bg-[#1e1e1e] border border-white/5 w-[56px] sm:w-[60px] flex flex-col items-center py-4 shrink-0 transition-all gap-6 shadow-xl rounded-2xl">
        <button onClick={onToggle} className="p-2 rounded-xl transition-all hover:bg-white/5 text-gray-400">
          <PanelLeftOpen size={18} />
        </button>
        <button 
          onClick={onOpenSourceAddition} 
          className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={18} />
        </button>
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-4 px-2 custom-scrollbar">
          {sources.map(s => (
            <div 
              key={s.id} 
              onClick={() => (s.status === 'ready' || s.status === 'error') && onSelectSource(s.id)} 
              className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all relative ${selectedSourceId === s.id ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5 opacity-50'}`}
              title={s.name}
            >
              {s.status === 'analyzing' ? (
                <div className="relative w-5 h-5">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-white/5" />
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="56.5" strokeDashoffset={56.5 - (56.5 * (s.progress || 0)) / 100} strokeLinecap="round" className="text-blue-500 transition-all duration-300" />
                  </svg>
                </div>
              ) : (
                getSourceIcon(s)
              )}
              {activeSourceIds.has(s.id) && s.status === 'ready' && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[#1e1e1e]"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // READER MODE
  if (selectedSourceId && selectedSource) {
    return (
      <div ref={sidebarRef} className={`${compactMode ? 'w-full' : 'w-[500px]'} max-w-full h-full bg-[#1e1e1e] border border-white/5 flex flex-col shrink-0 transition-all rounded-2xl overflow-hidden relative shadow-2xl z-40`}>
        <div className="h-14 px-4 flex items-center justify-between shrink-0 bg-[#25282c] border-b border-white/5">
          <div className="flex items-center gap-3">
            <button onClick={() => onSelectSource(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"><ArrowLeft size={18} /></button>
            <div className="flex items-center gap-2 max-w-[300px]">
              {getSourceIcon(selectedSource)}
              <h2 className="text-xs font-bold text-gray-200 truncate">{selectedSource.name}</h2>
            </div>
          </div>
          {!compactMode && (
            <button onClick={onToggle} className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-gray-400"><PanelLeftClose size={16} /></button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#1e1e1e]" onMouseUp={handleMouseUp}>
          {selectedSource.status === 'error' ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-60">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Tahlil muvaffaqiyatsiz</h3>
              <p className="text-sm text-gray-400">{selectedSource.content}</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                {selectedSource.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {selection && onActionWithSelection && selectedSource.status !== 'error' && (
          <div 
            className="absolute z-[1000] -translate-x-1/2 -translate-y-[120%] flex items-center bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl p-1 gap-1 animate-in zoom-in-95 duration-200"
            style={{ left: selection.x - sidebarRef.current!.getBoundingClientRect().left, top: selection.y - sidebarRef.current!.getBoundingClientRect().top }}
          >
            <button 
              onClick={() => { onActionWithSelection!(selection.text, 'chat'); setSelection(null); }} 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Sparkles size={14} />
              AI Tahlil
            </button>
          </div>
        )}
      </div>
    );
  }

  // LIST MODE
  return (
    <div ref={sidebarRef} className={`${compactMode ? 'w-full' : 'w-72'} max-w-full h-full bg-[#1e1e1e] border border-white/5 flex flex-col shrink-0 transition-all rounded-2xl overflow-hidden shadow-2xl z-40`}>
      <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-[#25282c] border-b border-white/5">
        <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Manbalar</h2>
        {!compactMode && (
          <button onClick={onToggle} className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-gray-400"><PanelLeftClose size={16} /></button>
        )}
      </div>
      
      <div className="p-3 space-y-3">
        <button onClick={onOpenSourceAddition} className="flex items-center justify-center w-full gap-2 p-2.5 bg-white/5 border border-white/5 text-gray-200 hover:bg-white/10 rounded-xl font-bold text-[11px] transition-all"><Plus size={14} /><span>Manba qo'shish</span></button>
        <div className="relative flex items-center p-2 rounded-xl bg-black/20 border border-white/5 focus-within:border-blue-500/30 transition-all">
          <Search className="text-gray-500 mr-2" size={14} />
          <input type="text" placeholder="Manbalarni qidirish" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-[11px] flex-1 text-gray-300 font-medium" />
        </div>
      </div>

      <div className="px-4 flex items-center justify-between mb-2">
        <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Yuklanganlar ({sources.length})</span>
        <button onClick={() => onToggleAllSources(!isAllSelected)} className={`shrink-0 w-4 h-4 rounded-[3px] border transition-all flex items-center justify-center ${isAllSelected ? 'bg-[#3c4043] border-[#5f6368]' : 'bg-transparent border-white/10 hover:border-white/30'}`}>{isAllSelected && <Check size={12} className="text-gray-200" strokeWidth={3} />}</button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
        {filteredSources.map(source => (
          <div 
            key={source.id} 
            onClick={() => (source.status === 'ready' || source.status === 'error') && editingId !== source.id && onSelectSource(source.id)} 
            className={`group relative flex items-center gap-3 p-2 rounded-xl transition-all ${selectedSourceId === source.id ? 'bg-white/5' : 'hover:bg-white/5'} ${source.status === 'analyzing' ? 'cursor-default opacity-70' : 'cursor-pointer'} ${source.status === 'ready' && !activeSourceIds.has(source.id) && 'opacity-60'} ${source.status === 'error' && 'border-red-500/20 border'}`}
          >
            <div className="shrink-0 w-6 h-6 flex items-center justify-center">
              {getSourceIcon(source)}
            </div>

            <div className="flex-1 min-w-0">
              {editingId === source.id ? (
                <div className="flex items-center gap-0.5">
                  <input autoFocus className="flex-1 min-w-0 bg-blue-600/10 border border-blue-500/30 outline-none text-[12px] font-medium text-gray-100 px-1.5 py-0.5 rounded-l-md" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(source.id)} onBlur={() => handleSaveRename(source.id)} onClick={(e) => e.stopPropagation()} />
                </div>
              ) : (
                <div>
                  <p className={`text-[12px] font-medium truncate ${source.status === 'error' ? 'text-red-400' : 'text-gray-100'}`}>{source.name}</p>
                  {source.status === 'error' && <p className="text-[9px] text-red-500 font-black uppercase truncate">Tahlil xatosi</p>}
                </div>
              )}
            </div>

            <div className="relative context-menu-container">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === source.id ? null : source.id); }}
                className={`p-1 rounded-md transition-all ${
                  menuOpenId === source.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-white hover:bg-white/5 xl:opacity-0 xl:group-hover:opacity-100'
                }`}
              >
                <MoreVertical size={16} />
              </button>
              {menuOpenId === source.id && (
                <div className="absolute right-0 top-8 w-44 bg-[#2d3136] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => startEditing(source)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/5 transition-colors"><Pencil size={14} className="text-gray-400" /> Nomini o'zgartirish</button>
                  <button onClick={() => { onRemoveSource(source.id); setMenuOpenId(null); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /> O'chirish</button>
                </div>
              )}
            </div>

            <div className="shrink-0 w-6 h-6 flex items-center justify-center">
              {source.status === 'analyzing' ? (
                <div className="relative w-5 h-5">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-white/5" />
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="56.5" strokeDashoffset={56.5 - (56.5 * (source.progress || 0)) / 100} strokeLinecap="round" className="text-blue-500 transition-all duration-300" />
                  </svg>
                </div>
              ) : source.status === 'error' ? (
                <AlertCircle size={14} className="text-red-500" />
              ) : (
                <div 
                  onClick={(e) => { e.stopPropagation(); onToggleSourceActive(source.id); }}
                  className={`w-4 h-4 rounded-[3px] border transition-all flex items-center justify-center cursor-pointer ${activeSourceIds.has(source.id) ? 'bg-[#3c4043] border-[#5f6368]' : 'bg-transparent border-white/10'}`}
                >
                  {activeSourceIds.has(source.id) && <Check size={11} className="text-gray-200" strokeWidth={3} />}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-white/5 bg-black/10">
        <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest">{activeSourceIds.size} aktiv manba</p>
      </div>
    </div>
  );
};

export default Sidebar;
