
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import NotesPanel from './components/NotesPanel';
import QuizView from './components/QuizView';
import FlashcardView from './components/FlashcardView';
import MindMapView from './components/MindMapView';
import InfographicView from './components/InfographicView';
import PresentationView from './components/PresentationView';
import QuizSetupModal from './components/QuizSetupModal';
import FlashcardSetupModal from './components/FlashcardSetupModal';
import InfographicSetupModal from './components/InfographicSetupModal';
import PresentationSetupModal from './components/PresentationSetupModal';
import MindMapSetupModal from './components/MindMapSetupModal';
import SourceAdditionModal from './components/SourceAdditionModal';
import { Source, Note, Message, StudyMaterialType, QuizData, FlashcardData, MindMapData, PresentationData } from './types';
import { 
  BookOpen, HelpCircle, User, Pencil, Settings, KeyRound, Check, FlaskConical
} from 'lucide-react';
import { openRouterService, AnyAIConfig, InfographicConfig, MindMapConfig } from './services/openRouterService';

const App: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set());
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [generatingMaterials, setGeneratingMaterials] = useState<Set<StudyMaterialType>>(new Set());
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [compactTab, setCompactTab] = useState<'sources' | 'chat' | 'studio'>('chat');
  const [isSourceAdditionOpen, setIsSourceAdditionOpen] = useState(false);
  
  const [isQuizSetupOpen, setIsQuizSetupOpen] = useState(false);
  const [isFlashcardSetupOpen, setIsFlashcardSetupOpen] = useState(false);
  const [isInfographicSetupOpen, setIsInfographicSetupOpen] = useState(false);
  const [isPresentationSetupOpen, setIsPresentationSetupOpen] = useState(false);
  const [isMindMapSetupOpen, setIsMindMapSetupOpen] = useState(false);

  const [activeQuiz, setActiveQuiz] = useState<{ data: QuizData, sourceCount: number, title: string } | null>(null);
  const [activeFlashcards, setActiveFlashcards] = useState<{ data: FlashcardData, sourceCount: number, title: string } | null>(null);
  const [activeMindMap, setActiveMindMap] = useState<{ data: MindMapData, sourceCount: number, title: string } | null>(null);
  const [activeInfographic, setActiveInfographic] = useState<{ imageUrl: string, title: string } | null>(null);
  const [activePresentation, setActivePresentation] = useState<{ data: PresentationData, sourceCount: number, title: string } | null>(null);

  const [appTitle, setAppTitle] = useState('Nomsiz daftar');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isDemoEnabled, setIsDemoEnabled] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const analyzedSourcesRef = useRef<Set<string>>(new Set());
  const DEMO_SOURCE_PREFIX = 'demo-source-';
  const DEMO_NOTE_PREFIXES = ['demo-review-', 'demo-quiz-', 'demo-flash-', 'demo-mindmap-', 'demo-presentation-', 'demo-infographic-'];

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const localDemo = window.localStorage.getItem('DEMO_MODE');
    setIsDemoEnabled(localDemo === 'true');
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!settingsMenuRef.current) return;
      if (!settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    if (isSettingsMenuOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isSettingsMenuOpen]);

  useEffect(() => {
    const syncLayout = () => {
      const compact = window.innerWidth < 1280;
      setIsCompactLayout(compact);
      if (compact) {
        setIsSidebarOpen(false);
        setIsNotesOpen(false);
        setCompactTab('chat');
      }
    };
    syncLayout();
    window.addEventListener('resize', syncLayout);
    return () => window.removeEventListener('resize', syncLayout);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const isDemoSource = (id: string) => id.startsWith(DEMO_SOURCE_PREFIX);
    const isDemoNote = (id: string) => DEMO_NOTE_PREFIXES.some((p) => id.startsWith(p));

    if (!isDemoEnabled) {
      setSources(prev => prev.filter((s) => !isDemoSource(s.id)));
      setNotes(prev => prev.filter((n) => !isDemoNote(n.id)));
      setActiveSourceIds(prev => {
        const next = new Set(prev);
        Array.from(next).forEach((id) => {
          if (isDemoSource(id)) next.delete(id);
        });
        return next;
      });
      setSelectedSourceId(prev => (prev && isDemoSource(prev) ? null : prev));
      setActiveNoteId(prev => (prev && isDemoNote(prev) ? null : prev));
      return;
    }

    const seedDemoWorkspace = async () => {
      const existingDemoSource = sources.find((s) => isDemoSource(s.id));
      const demoSource: Source = existingDemoSource || {
        id: `${DEMO_SOURCE_PREFIX}${Date.now()}`,
        name: 'Demo manba',
        content:
          "Bu demo manba. Ushbu matn demo rejimda chat, test, kartochka, aqliy xarita, taqdimot va infografika yaratishni ko'rsatish uchun ishlatiladi.",
        type: 'text',
        timestamp: Date.now(),
        status: 'ready'
      };

      if (!existingDemoSource) {
        setSources(prev => [demoSource, ...prev]);
      }
      setActiveSourceIds(prev => {
        const next = new Set(prev);
        next.add(demoSource.id);
        return next;
      });

      const hasDemoNotes = notes.some((n) => isDemoNote(n.id));
      if (hasDemoNotes) return;

      try {
        const [quiz, flashcard, mindmap, presentation, infographic] = await Promise.all([
          openRouterService.generateStudyMaterial('quiz', [demoSource], { questionCount: 4, difficulty: 'easy', topic: 'Demo review' }),
          openRouterService.generateStudyMaterial('flashcard', [demoSource], { cardCount: 'standard', style: 'qa', topic: 'Demo review' }),
          openRouterService.generateStudyMaterial('mindmap', [demoSource], { complexity: 'standard', topic: 'Demo review' }),
          openRouterService.generateStudyMaterial('presentation', [demoSource], { slideCount: 'short', audience: 'general', topic: 'Demo review' }),
          openRouterService.generateInfographicImage([demoSource], { style: 'minimalist', layout: '16:9', topic: 'Demo review' })
        ]);

        if (cancelled) return;

        const ts = Date.now();
        const demoNotes: Note[] = [
          {
            id: `demo-review-${ts}`,
            title: 'AI Javobi',
            content: "DEMO review: Ushbu joyda demo manba asosida mock tahlil va natijalar ko'rsatiladi.",
            timestamp: ts,
            type: 'reminders',
            isReadOnly: true,
            sourceCount: 1
          },
          {
            id: `demo-quiz-${ts + 1}`,
            title: 'Demo Test',
            content: '',
            timestamp: ts + 1,
            type: 'quiz',
            data: quiz,
            sourceCount: 1
          },
          {
            id: `demo-flash-${ts + 2}`,
            title: 'Demo Kartochkalar',
            content: '',
            timestamp: ts + 2,
            type: 'flashcard',
            data: flashcard,
            sourceCount: 1
          },
          {
            id: `demo-mindmap-${ts + 3}`,
            title: 'Demo Aqliy xarita',
            content: '',
            timestamp: ts + 3,
            type: 'mindmap',
            data: mindmap,
            sourceCount: 1
          },
          {
            id: `demo-presentation-${ts + 4}`,
            title: 'Demo Taqdimot',
            content: '',
            timestamp: ts + 4,
            type: 'presentation',
            data: presentation,
            sourceCount: 1
          },
          {
            id: `demo-infographic-${ts + 5}`,
            title: 'Demo Infografika',
            content: '',
            timestamp: ts + 5,
            type: 'infographic',
            data: infographic,
            sourceCount: 1
          }
        ];

        setNotes(prev => {
          if (prev.some((n) => isDemoNote(n.id))) return prev;
          return [...demoNotes, ...prev];
        });
      } catch (err) {
        // Demo seed xatoligida ilova ishlashini to'xtatmaymiz.
      }
    };

    seedDemoWorkspace();

    return () => {
      cancelled = true;
    };
  }, [isDemoEnabled]);

  useEffect(() => {
    const processAnalyzingSources = async () => {
      const analyzingSource = sources.find(s => s.status === 'analyzing' && !analyzedSourcesRef.current.has(s.id));
      if (!analyzingSource) return;

      analyzedSourcesRef.current.add(analyzingSource.id);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress > 90) clearInterval(interval);
        setSources(prev => prev.map(s => s.id === analyzingSource.id ? { ...s, progress } : s));
      }, 300);

      try {
        let title = analyzingSource.name;
        let content = analyzingSource.content;

        if (analyzingSource.type === 'file' && analyzingSource.base64Data && analyzingSource.mimeType) {
          content = await openRouterService.analyzeMediaSource(analyzingSource.base64Data, analyzingSource.mimeType, analyzingSource.name);
        } else if (analyzingSource.type === 'link' || analyzingSource.type === 'youtube') {
          const urlResult = await openRouterService.analyzeUrlSource(analyzingSource.content);
          title = urlResult.title;
          content = urlResult.content;
        }

        clearInterval(interval);
        setSources(prev => prev.map(s => s.id === analyzingSource.id ? { 
          ...s, 
          name: title,
          content: content, 
          status: 'ready', 
          progress: 100 
        } : s));
        setActiveSourceIds(prev => new Set(prev).add(analyzingSource.id));
      } catch (err) {
        console.error("Analysis process error:", err);
        clearInterval(interval);
        setSources(prev => prev.map(s => s.id === analyzingSource.id ? { ...s, status: 'error' } : s));
      }
    };
    processAnalyzingSources();
  }, [sources]);

  const getEnabledSources = () => sources.filter(s => activeSourceIds.has(s.id) && s.status === 'ready');

  const handleAddSource = (source: Source) => {
    setSources(prev => [source, ...prev]);
    if (source.status === 'ready') setActiveSourceIds(prev => new Set(prev).add(source.id));
  };

  const handleRemoveSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    setActiveSourceIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedSourceId === id) setSelectedSourceId(null);
    analyzedSourcesRef.current.delete(id);
  };

  const handleRenameSource = (id: string, newName: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const handleRenameNote = (id: string, newTitle: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title: newTitle } : n));
  };

  const handleCreateNewNote = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setNotes(prev => [{ id: newId, title: 'Yangi eslatma', content: '', timestamp: Date.now(), type: 'reminders' }, ...prev]);
    setActiveNoteId(newId);
    setIsNotesOpen(true);
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title, content } : n));
  };

  const handleConvertToSource = (title: string, content: string) => {
    handleAddSource({
      id: Math.random().toString(36).substr(2, 9),
      name: title || 'Eslatmadan olingan',
      content: content,
      type: 'text',
      timestamp: Date.now(),
      status: 'ready'
    });
    setActiveNoteId(null);
  };

  const toggleSourceActive = (id: string) => {
    const source = sources.find(s => s.id === id);
    if (!source || source.status !== 'ready') return;
    setActiveSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSources = (active: boolean) => {
    if (active) {
      const readyIds = sources.filter(s => s.status === 'ready').map(s => s.id);
      setActiveSourceIds(new Set(readyIds));
    } else setActiveSourceIds(new Set());
  };

  const handleOpenNote = (note: Note) => {
    if (note.type === 'quiz') {
      setActiveQuiz({ data: note.data, sourceCount: note.sourceCount || 1, title: note.title });
    } else if (note.type === 'infographic') {
      setActiveInfographic({ imageUrl: note.data, title: note.title });
    } else if (note.type === 'mindmap') {
      setActiveMindMap({ data: note.data, sourceCount: note.sourceCount || 1, title: note.title });
    } else if (note.type === 'flashcard') {
      setActiveFlashcards({ data: note.data, sourceCount: note.sourceCount || 1, title: note.title });
    } else if (note.type === 'presentation') {
      setActivePresentation({ data: note.data, sourceCount: note.sourceCount || 1, title: note.title });
    } else {
      setActiveNoteId(note.id);
      setIsNotesOpen(true);
    }
  };

  const handleAIAction = async (type: StudyMaterialType, aiConfig?: AnyAIConfig, customContext?: string) => {
    const enabledSources = getEnabledSources();
    if (enabledSources.length === 0 && !customContext) {
      alert("Iltimos, kamida bitta manbani belgilang.");
      return;
    }
    
    if (type === 'quiz' && !aiConfig) { setIsQuizSetupOpen(true); return; }
    if (type === 'flashcard' && !aiConfig) { setIsFlashcardSetupOpen(true); return; }
    if (type === 'infographic' && !aiConfig) { setIsInfographicSetupOpen(true); return; }
    if (type === 'presentation' && !aiConfig) { setIsPresentationSetupOpen(true); return; }
    if (type === 'mindmap' && !aiConfig) { setIsMindMapSetupOpen(true); return; }
    
    setGeneratingMaterials(prev => new Set(prev).add(type));
    setIsQuizSetupOpen(false); 
    setIsFlashcardSetupOpen(false); 
    setIsInfographicSetupOpen(false); 
    setIsPresentationSetupOpen(false);
    setIsMindMapSetupOpen(false);

    try {
      const activeSources = customContext ? [{ id: 'temp', name: 'Tanlangan matn', content: customContext, type: 'text' as const, timestamp: Date.now(), status: 'ready' as const }] : enabledSources;
      const labels: Record<StudyMaterialType, string> = { infographic: 'Infografika', mindmap: 'Aqliy xarita', quiz: 'Test', presentation: 'Taqdimot', reminders: 'Eslatma', flashcard: 'Kartochkalar' };

      let result: any;
      if (type === 'infographic') {
        result = await openRouterService.generateInfographicImage(activeSources, aiConfig as InfographicConfig);
      } else {
        result = await openRouterService.generateStudyMaterial(type, activeSources, aiConfig);
      }

      const newId = Math.random().toString(36).substr(2, 9);
      const newNote: Note = {
        id: newId,
        title: (aiConfig as any)?.topic ? `${labels[type]}: ${(aiConfig as any).topic}` : labels[type],
        content: type === 'reminders' ? result : '',
        timestamp: Date.now(),
        type: type,
        data: type !== 'reminders' ? result : undefined,
        sourceCount: activeSources.length
      };

      setNotes(prev => [newNote, ...prev]);
      setIsNotesOpen(true);
    } catch (e: any) { 
      alert(e.message || "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring."); 
    } finally { 
      setGeneratingMaterials(prev => { const n = new Set(prev); n.delete(type); return n; }); 
    }
  };

  const handleActionWithSelection = (text: string, type: StudyMaterialType | 'note' | 'chat') => {
    if (type === 'note') {
       const newId = Date.now().toString();
       setNotes(prev => [{ id: newId, title: 'Tanlangan matndan', content: text, timestamp: Date.now(), type: 'reminders' }, ...prev]);
       setActiveNoteId(newId);
       setIsNotesOpen(true);
    } else if (type === 'chat') {
      window.dispatchEvent(new CustomEvent('send-to-chat', { detail: `Tahlil qiling: "${text}"` }));
    } else handleAIAction(type as StudyMaterialType, undefined, text);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#1a1c1e] text-gray-100">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-14 px-3 sm:px-8 flex items-center justify-between border-b bg-[#1e1e1e] border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><BookOpen size={18} /></div>
            <div className="relative group flex items-center">
              {isEditingTitle ? (
                <input ref={titleInputRef} type="text" value={appTitle} onChange={(e) => setAppTitle(e.target.value)} onBlur={() => setIsEditingTitle(false)} onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)} className="bg-[#2a2d32] border border-indigo-500/50 outline-none text-sm font-bold text-white tracking-tight px-2 py-0.5 rounded-md w-48" />
              ) : (
                <div onClick={() => setIsEditingTitle(true)} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1 rounded-md transition-colors">
                  <h1 className="text-sm font-bold text-white tracking-tight">{appTitle}</h1>
                  <Pencil size={12} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative" ref={settingsMenuRef}>
               <button
                 onClick={() => setIsSettingsMenuOpen((v) => !v)}
                 className="p-2 text-gray-400 hover:text-white transition-all"
                 title="Sozlamalar"
               >
                 <Settings size={18} />
               </button>
               {isSettingsMenuOpen && (
                 <div className="absolute right-0 mt-2 w-56 bg-[#2d3136] border border-white/10 rounded-xl shadow-2xl py-1.5 z-[120] animate-in fade-in zoom-in-95 duration-100">
                   <button
                     onClick={() => { setIsSettingsMenuOpen(false); setIsAboutOpen(true); }}
                     className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/5 transition-colors text-left"
                   >
                     <HelpCircle size={14} className="text-indigo-400" />
                     Ilova haqida
                   </button>
                   <button
                     onClick={() => {
                       const next = !isDemoEnabled;
                       setIsDemoEnabled(next);
                       window.localStorage.setItem('DEMO_MODE', next ? 'true' : 'false');
                     }}
                     className="w-full flex items-center justify-between gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/5 transition-colors text-left"
                   >
                     <span className="inline-flex items-center gap-2.5">
                       <FlaskConical size={14} className="text-indigo-400" />
                       Demo rejim
                     </span>
                     <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isDemoEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-300'}`}>
                       {isDemoEnabled ? 'ON' : 'OFF'}
                     </span>
                   </button>
                   <button
                     onClick={() => {
                       setIsSettingsMenuOpen(false);
                       const stored = window.localStorage.getItem('OPENROUTER_API_KEY') || '';
                       setApiKeyInput(stored);
                       setIsApiKeySaved(false);
                       setIsApiKeyModalOpen(true);
                     }}
                     className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-white/5 transition-colors text-left"
                   >
                     <KeyRound size={14} className="text-indigo-400" />
                     OpenRouter API kalit
                   </button>
                 </div>
               )}
             </div>
             <button className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs"><User size={16} /></button>
          </div>
        </header>

        {isCompactLayout && (
          <div className="h-11 px-2 sm:px-3 border-b border-white/5 bg-[#1e1e1e] flex items-end gap-1">
            <button
              onClick={() => { setCompactTab('sources'); }}
              className={`relative flex-1 h-full text-[12px] font-bold transition-colors ${
                compactTab === 'sources' ? 'text-gray-100' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Manbalar
              {compactTab === 'sources' && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-10 h-[2px] bg-indigo-500 rounded-full" />}
            </button>
            <button
              onClick={() => { setCompactTab('chat'); }}
              className={`relative flex-1 h-full text-[12px] font-bold transition-colors ${
                compactTab === 'chat' ? 'text-gray-100' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Chat
              {compactTab === 'chat' && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-10 h-[2px] bg-indigo-500 rounded-full" />}
            </button>
            <button
              onClick={() => { setCompactTab('studio'); }}
              className={`relative flex-1 h-full text-[12px] font-bold transition-colors ${
                compactTab === 'studio' ? 'text-gray-100' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Studio
              {compactTab === 'studio' && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-10 h-[2px] bg-indigo-500 rounded-full" />}
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden p-2 sm:p-3 gap-2 sm:gap-3">
          {isCompactLayout ? (
            <div className="flex-1 min-w-0 h-full overflow-hidden">
              {compactTab === 'chat' && (
                <ChatInterface
                  sources={getEnabledSources()}
                  onAddNote={(n) => {
                    const newId = Date.now().toString();
                    setNotes(prev => [{ id: newId, ...n, timestamp: Date.now() }, ...prev]);
                    setActiveNoteId(newId);
                  }}
                  theme="dark"
                  messages={chatMessages}
                  onMessagesChange={setChatMessages}
                />
              )}
              {compactTab === 'sources' && (
                <Sidebar
                  sources={sources}
                  activeSourceIds={activeSourceIds}
                  onToggleSourceActive={toggleSourceActive}
                  onToggleAllSources={toggleAllSources}
                  onAddSource={handleAddSource}
                  onRemoveSource={handleRemoveSource}
                  onRenameSource={handleRenameSource}
                  selectedSourceId={selectedSourceId}
                  onSelectSource={(id) => setSelectedSourceId(id)}
                  onOpenSourceAddition={() => setIsSourceAdditionOpen(true)}
                  theme="dark"
                  isOpen={true}
                  onToggle={() => setCompactTab('chat')}
                  onActionWithSelection={handleActionWithSelection}
                  onOpenYoutubeModal={() => {}}
                  onOpenUrlModal={() => {}}
                  onOpenSearchModal={() => {}}
                  compactMode={true}
                />
              )}
              {compactTab === 'studio' && (
                <NotesPanel
                  notes={notes}
                  onRemoveNote={(id) => setNotes(prev => prev.filter(n => n.id !== id))}
                  onRenameNote={handleRenameNote}
                  onUpdateNote={handleUpdateNote}
                  onConvertToSource={handleConvertToSource}
                  onGenerateAction={handleAIAction}
                  onOpenNote={handleOpenNote}
                  theme="dark"
                  onOpenManualNote={handleCreateNewNote}
                  generatingMaterials={generatingMaterials}
                  isOpen={true}
                  onToggle={() => setCompactTab('chat')}
                  isSourcesActive={getEnabledSources().length > 0}
                  activeNoteId={activeNoteId}
                  onSetActiveNote={setActiveNoteId}
                  compactMode={true}
                />
              )}
            </div>
          ) : (
            <>
              <Sidebar sources={sources} activeSourceIds={activeSourceIds} onToggleSourceActive={toggleSourceActive} onToggleAllSources={toggleAllSources} onAddSource={handleAddSource} onRemoveSource={handleRemoveSource} onRenameSource={handleRenameSource} selectedSourceId={selectedSourceId} onSelectSource={(id) => { setSelectedSourceId(id); if (id) setIsSidebarOpen(true); }} onOpenSourceAddition={() => setIsSourceAdditionOpen(true)} theme="dark" isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} onActionWithSelection={handleActionWithSelection} onOpenYoutubeModal={()=>{}} onOpenUrlModal={()=>{}} onOpenSearchModal={()=>{}} />

              <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <ChatInterface sources={getEnabledSources()} onAddNote={(n) => { const newId = Date.now().toString(); setNotes(prev => [{ id: newId, ...n, timestamp: Date.now() }, ...prev]); setActiveNoteId(newId); setIsNotesOpen(true); }} theme="dark" messages={chatMessages} onMessagesChange={setChatMessages} />
              </div>
              
              <NotesPanel 
                notes={notes} 
                onRemoveNote={(id) => setNotes(prev => prev.filter(n => n.id !== id))} 
                onRenameNote={handleRenameNote}
                onUpdateNote={handleUpdateNote}
                onConvertToSource={handleConvertToSource}
                onGenerateAction={handleAIAction} 
                onOpenNote={handleOpenNote}
                theme="dark" onOpenManualNote={handleCreateNewNote} 
                generatingMaterials={generatingMaterials} 
                isOpen={isNotesOpen} 
                onToggle={() => setIsNotesOpen(!isNotesOpen)}
                isSourcesActive={getEnabledSources().length > 0}
                activeNoteId={activeNoteId}
                onSetActiveNote={setActiveNoteId}
              />
            </>
          )}
        </div>

        <SourceAdditionModal isOpen={isSourceAdditionOpen} onClose={() => setIsSourceAdditionOpen(false)} onAddSource={handleAddSource} sourcesCount={sources.length} theme="dark" />
        {isQuizSetupOpen && <QuizSetupModal onClose={() => setIsQuizSetupOpen(false)} onGenerate={(c) => handleAIAction('quiz', c)} theme="dark" />}
        {isFlashcardSetupOpen && <FlashcardSetupModal onClose={() => setIsFlashcardSetupOpen(false)} onGenerate={(c) => handleAIAction('flashcard', c)} theme="dark" />}
        {isInfographicSetupOpen && <InfographicSetupModal onClose={() => setIsInfographicSetupOpen(false)} onGenerate={(c) => handleAIAction('infographic', c)} theme="dark" />}
        {isPresentationSetupOpen && <PresentationSetupModal onClose={() => setIsPresentationSetupOpen(false)} onGenerate={(c) => handleAIAction('presentation', c)} theme="dark" />}
        {isMindMapSetupOpen && <MindMapSetupModal onClose={() => setIsMindMapSetupOpen(false)} onGenerate={(c) => handleAIAction('mindmap', c)} theme="dark" />}
        
        {activeQuiz && <QuizView quiz={activeQuiz.data} sourceCount={activeQuiz.sourceCount} onClose={() => setActiveQuiz(null)} theme="dark" mode="fullscreen" />}
        {activeFlashcards && <FlashcardView data={activeFlashcards.data} sourceCount={activeFlashcards.sourceCount} onClose={() => setActiveFlashcards(null)} theme="dark" mode="fullscreen" />}
        {activeMindMap && <MindMapView data={activeMindMap.data} sourceCount={activeMindMap.sourceCount} onClose={() => setActiveMindMap(null)} onReview={(q) => { setActiveMindMap(null); setTimeout(() => window.dispatchEvent(new CustomEvent('send-to-chat', { detail: q })), 100); }} theme="dark" mode="fullscreen" />}
        
        {activeInfographic && <InfographicView imageUrl={activeInfographic.imageUrl} title={activeInfographic.title} onClose={() => setActiveInfographic(null)} theme="dark" mode="fullscreen" />}
        {activePresentation && <PresentationView data={activePresentation.data} sourceCount={activePresentation.sourceCount} onClose={() => setActivePresentation(null)} theme="dark" mode="fullscreen" />}

        {isAboutOpen && (
          <div className="fixed inset-0 z-[520] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1f232b] p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle size={18} className="text-indigo-400" />
                <h3 className="text-base font-bold text-gray-100">Ilova haqida</h3>
              </div>
              <div className="space-y-4 text-sm text-gray-300 leading-relaxed max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
                <p>
                  Ushbu ilova yuklangan manbalar asosida tezkor o'rganish va kontent tayyorlashga yordam beradi.
                  Siz fayl, havola yoki oddiy matn qo'shasiz, ilova esa shu manbalardan foydalanib turli formatlarda natija yaratadi.
                </p>
                <div>
                  <h4 className="text-gray-100 font-semibold mb-1">Nimalar qilish mumkin</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Chat orqali manbalar bo'yicha savol-javob qilish.</li>
                    <li>Test (quiz) yaratish va javoblarni tekshirish.</li>
                    <li>Kartochkalar (flashcards) bilan takrorlash.</li>
                    <li>Aqliy xarita (mindmap) ko'rinishida mavzuni tuzish.</li>
                    <li>Taqdimot va infografika tayyorlash.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-gray-100 font-semibold mb-1">Ishlash tartibi</h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Manba qo'shing (`Manbalar` bo'limi).</li>
                    <li>Aktiv manbalarni belgilang.</li>
                    <li>Chat yoki `Studio` orqali kerakli formatni tanlang.</li>
                    <li>Natijani ko'rib chiqing, kerak bo'lsa eksport qiling.</li>
                  </ol>
                </div>
                <div>
                  <h4 className="text-gray-100 font-semibold mb-1">API va Demo rejimi</h4>
                  <p>
                    Sozlamalardagi <b>OpenRouter API kalit</b> orqali haqiqiy AI bilan ishlaysiz.
                  </p>
                </div>
                <div>
                  <h4 className="text-gray-100 font-semibold mb-1">Muhim eslatma</h4>
                  <p>
                    AI javoblarida xatolik bo'lishi mumkin. Muhim qarorlar oldidan natijalarni asl manba bilan tekshirish tavsiya etiladi.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}

        {isApiKeyModalOpen && (
          <div className="fixed inset-0 z-[520] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1f232b] p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound size={18} className="text-indigo-400" />
                <h3 className="text-base font-bold text-gray-100">OpenRouter API kalit</h3>
              </div>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full bg-[#161a20] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 outline-none focus:border-indigo-500/60"
              />
              <p className="mt-2 text-xs text-gray-400">
                Kalit brauzerda saqlanadi va `OPENROUTER_API_KEY` sifatida ishlatiladi.
              </p>
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-sm font-bold transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => {
                    const normalizedKey = apiKeyInput.trim().replace(/^Bearer\s+/i, '');
                    if (normalizedKey) {
                      window.localStorage.setItem('OPENROUTER_API_KEY', normalizedKey);
                      // API kalit ishlashi uchun demo rejimni avtomatik o'chiramiz
                      window.localStorage.setItem('DEMO_MODE', 'false');
                      setIsDemoEnabled(false);
                    } else {
                      window.localStorage.removeItem('OPENROUTER_API_KEY');
                    }
                    setIsApiKeySaved(true);
                    setTimeout(() => setIsApiKeySaved(false), 1500);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all inline-flex items-center gap-2"
                >
                  {isApiKeySaved ? <Check size={14} /> : null}
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;

