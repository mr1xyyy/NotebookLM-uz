
import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2, HelpCircle, BarChart3, CopyPlus, MonitorPlay, FileText, Network, 
  PanelRightClose, PanelRightOpen, Pencil, Lock, Check, X, 
  Plus, MoreVertical, RefreshCw, Wand2, ChevronRight, ArrowLeft,
  Bold, Italic, FilePlus, List, ListOrdered, RemoveFormatting, Undo2, Redo2, Heading2, Sparkles, Shield, Pin, StickyNote
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Note, StudyMaterialType } from '../types';
import InfographicView from './InfographicView';
import QuizView from './QuizView';
import PresentationView from './PresentationView';
import FlashcardView from './FlashcardView';

interface NotesPanelProps {
  notes: Note[];
  onRemoveNote: (id: string) => void;
  onRenameNote: (id: string, newTitle: string) => void;
  onUpdateNote: (id: string, title: string, content: string) => void;
  onConvertToSource: (title: string, content: string) => void;
  onGenerateAction: (type: StudyMaterialType) => void;
  onOpenNote: (note: Note) => void;
  theme: 'light' | 'dark';
  onOpenManualNote: () => void;
  generatingMaterials: Set<StudyMaterialType>;
  isOpen: boolean;
  onToggle: () => void;
  isSourcesActive: boolean;
  activeNoteId: string | null;
  onSetActiveNote: (id: string | null) => void;
  compactMode?: boolean;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ 
  notes, onRemoveNote, onRenameNote, onUpdateNote, onConvertToSource, 
  onGenerateAction, onOpenNote, theme, onOpenManualNote,
  generatingMaterials, isOpen, onToggle, isSourcesActive, activeNoteId, onSetActiveNote, compactMode = false
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const activeNote = notes.find(n => n.id === activeNoteId);
  const [editorTitle, setEditorTitle] = useState('');

  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';

  useEffect(() => {
    if (activeNote) {
      setEditorTitle(activeNote.title);
      if (editorRef.current && !activeNote.isReadOnly && editorRef.current.innerHTML !== activeNote.content) {
        editorRef.current.innerHTML = activeNote.content || '';
      }
    }
  }, [activeNoteId, activeNote]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeMenuId]);

  const handleFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleSaveEditor();
  };

  const handleSaveEditor = () => {
    if (activeNoteId && !activeNote?.isReadOnly) {
      onUpdateNote(activeNoteId, editorTitle, editorRef.current?.innerHTML || '');
    } else if (activeNoteId && activeNote?.isReadOnly) {
      onRenameNote(activeNoteId, editorTitle);
    }
  };

  const handleStartRename = (note: Note) => {
    setEditingId(note.id);
    setEditTitleValue(note.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitleValue.trim()) {
      onRenameNote(id, editTitleValue.trim());
    }
    setEditingId(null);
  };

  const actions = [
    { type: 'quiz' as StudyMaterialType, label: 'Test', icon: <HelpCircle size={14} /> },
    { type: 'mindmap' as StudyMaterialType, label: 'Aqliy xarita', icon: <Network size={14} /> },
    { type: 'presentation' as StudyMaterialType, label: 'Taqdimot', icon: <MonitorPlay size={14} /> },
    { type: 'infographic' as StudyMaterialType, label: 'Infografika', icon: <BarChart3 size={14} /> },
    { type: 'flashcard' as StudyMaterialType, label: 'Kartochkalar', icon: <CopyPlus size={14} /> },
  ];

  const getNoteIcon = (note: Note, size = 18) => {
    if (note.isReadOnly && note.type === 'reminders') return <Pin size={size} className="text-indigo-400" />;
    switch (note.type) {
      case 'mindmap': return <Network size={size} className="text-indigo-400" />;
      case 'quiz': return <HelpCircle size={size} className="text-blue-400" />;
      case 'presentation': return <MonitorPlay size={size} className="text-emerald-400" />;
      case 'infographic': return <BarChart3 size={size} className="text-cyan-400" />;
      case 'flashcard': return <CopyPlus size={size} className="text-orange-400" />;
      default: return <StickyNote size={size} className="text-gray-400" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hozirgina';
    if (mins < 60) return `${mins} min avval`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!isOpen) {
    return (
      <div className="h-full bg-[#1e1e1e] border border-white/5 w-[56px] sm:w-[60px] flex flex-col items-center py-4 shrink-0 transition-all gap-4 shadow-xl rounded-2xl">
        <button onClick={onToggle} className="p-2 rounded-xl transition-all hover:bg-white/5 text-gray-400 mb-2">
          <PanelRightOpen size={18} />
        </button>
        <div className="flex flex-col items-center gap-3 w-full px-2">
          {actions.map((action) => (
            <button key={action.type} disabled={!isSourcesActive} onClick={() => onGenerateAction(action.type)} className={`w-10 h-10 rounded-xl bg-[#25282c] border border-white/5 flex items-center justify-center transition-all ${!isSourcesActive ? 'opacity-20 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
              {generatingMaterials.has(action.type) ? <RefreshCw size={14} className="animate-spin text-indigo-400" /> : action.icon}
            </button>
          ))}
        </div>
        <div className="w-8 h-[1px] bg-white/5 my-2"></div>
        <div className="flex-1 flex flex-col items-center gap-3 w-full px-2 overflow-y-auto custom-scrollbar">
          {notes.map(note => (
            <button key={note.id} onClick={() => { onOpenNote(note); onToggle(); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-transparent ${activeNoteId === note.id ? 'bg-indigo-600/20 border-indigo-500/30' : 'hover:bg-white/5'}`}>
              {getNoteIcon(note, 16)}
            </button>
          ))}
        </div>
        <button onClick={onOpenManualNote} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-gray-900 shadow-lg mt-auto shrink-0 transition-transform active:scale-90"><Plus size={18} /></button>
      </div>
    );
  }

  // Sidebar-da materiallarni ko'rish rejimi
  if (activeNoteId && activeNote) {
    const commonProps = {
      title: activeNote.title,
      onClose: () => onSetActiveNote(null),
      onExpand: () => onOpenNote(activeNote),
      theme: 'dark' as const,
      mode: 'sidebar' as const,
      sourceCount: activeNote.sourceCount || 1,
    };

    if (activeNote.type === 'infographic') {
      return (
        <div className={`h-full bg-[#1e1e1e] border border-white/5 ${compactMode ? 'w-full' : 'w-[500px]'} max-w-full flex flex-col shrink-0 transition-all rounded-2xl overflow-hidden relative shadow-2xl animate-in slide-in-from-right-10 duration-300 z-40`}>
          <InfographicView imageUrl={activeNote.data} {...commonProps} />
        </div>
      );
    }

    if (activeNote.type === 'quiz') {
      return (
        <div className={`h-full bg-[#1e1e1e] border border-white/5 ${compactMode ? 'w-full' : 'w-[500px]'} max-w-full flex flex-col shrink-0 transition-all rounded-2xl overflow-hidden relative shadow-2xl animate-in slide-in-from-right-10 duration-300 z-40`}>
          <QuizView quiz={activeNote.data} {...commonProps} />
        </div>
      );
    }

    if (activeNote.type === 'presentation') {
      return (
        <div className={`h-full bg-[#1e1e1e] border border-white/5 ${compactMode ? 'w-full' : 'w-[500px]'} max-w-full flex flex-col shrink-0 transition-all rounded-2xl overflow-hidden relative shadow-2xl animate-in slide-in-from-right-10 duration-300 z-40`}>
          <PresentationView data={activeNote.data} {...commonProps} />
        </div>
      );
    }

    if (activeNote.type === 'flashcard') {
      return (
        <div className={`h-full bg-[#1e1e1e] border border-white/5 ${compactMode ? 'w-full' : 'w-[500px]'} max-w-full flex flex-col shrink-0 transition-all rounded-2xl overflow-hidden relative shadow-2xl animate-in slide-in-from-right-10 duration-300 z-40`}>
          <FlashcardView data={activeNote.data} {...commonProps} />
        </div>
      );
    }
  }

  // Eslatma (Reminders) rejimi uchun mavjud mantiq
  if (activeNoteId && activeNote && activeNote.type === 'reminders') {
    const isReadOnly = activeNote.isReadOnly;
    return (
      <div className={`h-full bg-[#1e1e1e] border border-white/5 ${compactMode ? 'w-full' : 'w-[500px]'} max-w-full flex flex-col shrink-0 transition-all rounded-2xl overflow-hidden relative shadow-2xl animate-in slide-in-from-right-10 duration-300 z-40`}>
        <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-[#25282c] border-b border-white/5 z-30 relative">
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <button onClick={() => onSetActiveNote(null)} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors"><ArrowLeft size={12} />Studio</button>
            <ChevronRight size={12} className="text-gray-600" />
            <span className="text-gray-200">{isReadOnly ? 'AI Review' : 'Eslatma'}</span>
          </div>
          {isReadOnly && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Shield size={9} className="text-indigo-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Ko'rish rejimi</span>
            </div>
          )}
        </div>
        <div className="px-6 pt-6 pb-2 flex items-center justify-between gap-4">
          <div className="flex-1 relative group">
            <input type="text" value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} onBlur={handleSaveEditor} className={`w-full bg-transparent border-none outline-none text-xl font-bold tracking-tight ${textColor} placeholder-gray-600 focus:ring-0`} placeholder="Sarlavha kiritilmagan" />
            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-500 group-focus-within:w-full transition-all duration-300"></div>
          </div>
          <button onClick={() => { onRemoveNote(activeNoteId); onSetActiveNote(null); }} className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all shrink-0"><Trash2 size={18} /></button>
        </div>
        {!isReadOnly && (
          <div className="px-6 py-2.5 flex items-center gap-2 border-b border-white/5 bg-[#25282c]/10 relative overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-1 pr-2 border-r border-white/10">
              <button onClick={() => handleFormat('undo')} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all"><Undo2 size={15} /></button>
              <button onClick={() => handleFormat('redo')} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all"><Redo2 size={15} /></button>
            </div>
            <div className="flex items-center gap-1 px-2 border-r border-white/10">
              <button onClick={() => handleFormat('formatBlock', 'H2')} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all"><Heading2 size={15} /></button>
              <button onClick={() => handleFormat('bold')} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all"><Bold size={15} /></button>
              <button onClick={() => handleFormat('italic')} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all"><Italic size={15} /></button>
            </div>
            <div className="flex items-center gap-1 px-2 border-r border-white/10">
              <button onClick={() => handleFormat('insertUnorderedList')} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all"><List size={15} /></button>
              <button onClick={() => handleFormat('insertOrderedList')} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all"><ListOrdered size={15} /></button>
            </div>
            <button onClick={() => handleFormat('removeFormat')} className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-all"><RemoveFormatting size={15} /></button>
          </div>
        )}
        <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${isReadOnly ? 'justify-between gap-4' : ''}`}>
          {isReadOnly ? (
            <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed selection:bg-indigo-500/30">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{activeNote.content}</ReactMarkdown>
            </div>
          ) : (
            <div ref={editorRef} contentEditable onInput={handleSaveEditor} className="w-full min-h-full outline-none text-[14px] leading-relaxed text-gray-300 prose prose-invert prose-sm" />
          )}
        </div>
        <div className="p-5 border-t border-white/5 flex items-center justify-start bg-[#1e1e1e]/50 backdrop-blur-sm">
          <button onClick={() => { const content = isReadOnly ? activeNote.content : (editorRef.current?.innerHTML || ''); onConvertToSource(editorTitle, content); }} className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-[12px] font-bold text-indigo-400 transition-all active:scale-95 shadow-lg shadow-indigo-600/5">
            <FilePlus size={16} /> Manbaga aylantirish
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = notes.length === 0 && generatingMaterials.size === 0;

  return (
    <div className={`h-full bg-[#1e1e1e] border border-white/5 ${compactMode ? 'w-full' : 'w-80'} max-w-full flex flex-col shrink-0 transition-all rounded-2xl overflow-hidden relative shadow-2xl`}>
      <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-[#25282c] border-b border-white/5">
        <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Studio</h2>
        {!compactMode && (
          <button onClick={onToggle} className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-gray-400"><PanelRightClose size={16} /></button>
        )}
      </div>

      <div className="p-3 grid grid-cols-2 gap-2 border-b border-white/5 bg-black/5">
        {actions.map((action) => (
          <button key={action.type} disabled={!isSourcesActive} onClick={() => onGenerateAction(action.type)} className={`flex items-center gap-2.5 p-2.5 rounded-xl text-[10px] font-bold transition-all border border-white/5 bg-[#25282c] hover:bg-[#2d3136] disabled:opacity-30`}>
            <div className="text-indigo-400">{generatingMaterials.has(action.type) ? <RefreshCw size={14} className="animate-spin" /> : action.icon}</div>
            <span className="truncate text-gray-200">{action.label}</span>
            {!isSourcesActive && <Lock size={10} className="ml-auto opacity-40" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar p-3 space-y-4 pb-24">
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-20 min-h-[300px]">
            <Wand2 size={32} className="text-gray-500/60 mb-6 -rotate-[15deg]" />
            <p className="text-[13px] font-medium text-gray-300 leading-snug">Studiyadan olingan natijalar shu yerda saqlanadi</p>
          </div>
        ) : (
          <>
            {Array.from(generatingMaterials).map((type) => (
              <div key={type} className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-[#25282c]/60 border border-white/5 animate-pulse">
                <RefreshCw size={18} className="text-indigo-400 animate-spin" />
                <span className="text-[13px] font-medium text-gray-300">Yaratilmoqda...</span>
              </div>
            ))}

            {notes.map((note) => (
              <div 
                key={note.id} 
                onClick={() => {
                  if (editingId !== note.id) {
                    if (note.type === 'mindmap') {
                      onOpenNote(note); // Mindmap darhol fullscreen ochiladi
                    } else {
                      onSetActiveNote(note.id); // Boshqalar sidebar rejimida
                    }
                  }
                }} 
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl group cursor-pointer transition-all border border-transparent relative ${activeNoteId === note.id ? 'bg-indigo-600/10 border-indigo-500/30' : 'hover:bg-white/5'}`}
              >
                <div className="shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeNoteId === note.id ? 'bg-indigo-500/20' : 'bg-[#25282c]'}`}>
                    {getNoteIcon(note, 20)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === note.id ? (
                    <input autoFocus type="text" value={editTitleValue} onChange={(e) => setEditTitleValue(e.target.value)} onBlur={() => handleSaveRename(note.id)} onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(note.id)} onClick={(e) => e.stopPropagation()} className="w-full bg-blue-600/10 border border-blue-500/30 outline-none text-[14px] font-bold text-gray-100 px-1.5 py-0.5 rounded-md" />
                  ) : (
                    <>
                      <h4 className="text-[14px] font-bold text-gray-200 truncate">{note.title}</h4>
                      <p className="text-[11px] text-gray-500">{note.sourceCount ? `${note.sourceCount} ta manba • ` : ''}{formatTime(note.timestamp)}</p>
                    </>
                  )}
                </div>
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === note.id ? null : note.id); }} className={`p-1.5 rounded-lg transition-all ${activeMenuId === note.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><MoreVertical size={16} /></button>
                  {activeMenuId === note.id && (
                    <div ref={menuRef} className="absolute right-0 top-8 w-48 bg-[#2d3136] border border-white/10 rounded-xl shadow-2xl py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleStartRename(note)} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-gray-200 hover:bg-white/5 transition-colors"><Pencil size={14} className="text-gray-400" /> Nomini o'zgartirish</button>
                      <button onClick={() => { onRemoveNote(note.id); setActiveMenuId(null); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={14} /> O'chirish</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <div className="absolute bottom-4 right-4 z-10"><button onClick={onOpenManualNote} className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-full font-bold text-[11px] shadow-2xl hover:bg-gray-100 transition-all active:scale-95"><Plus size={14} strokeWidth={3} /> Eslatma qo'shish</button></div>
    </div>
  );
};

export default NotesPanel;

