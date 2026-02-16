
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, MoreVertical, Trash, Settings2, Pin, Copy, Check, ArrowRight, Loader2, MessageCircle, X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, Source, Note, ChatConfig } from '../types';
import { geminiService } from '../services/geminiService';

interface ChatInterfaceProps {
  sources: Source[];
  onAddNote: (note: Omit<Note, 'id' | 'timestamp'>) => void;
  theme: 'light' | 'dark';
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  isCompact?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  sources, 
  onAddNote, 
  theme, 
  messages, 
  onMessagesChange,
  isCompact = false 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig>({
    goal: 'default',
    responseLength: 'default'
  });
  const [tempConfig, setTempConfig] = useState<ChatConfig>(chatConfig);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSendRef = useRef<any>(null);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading || sources.length === 0) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    onMessagesChange(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiService.chatWithSources(updatedMessages, sources, chatConfig);
      onMessagesChange([...updatedMessages, { id: Date.now().toString(), role: 'assistant', text: response, timestamp: Date.now() }]);
    } catch (err) {
      onMessagesChange([...updatedMessages, { id: Date.now().toString(), role: 'assistant', text: "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  handleSendRef.current = handleSend;

  useEffect(() => {
    const handleExternalMessage = (e: any) => {
      if (handleSendRef.current) {
        handleSendRef.current(e.detail);
      }
    };
    
    window.addEventListener('send-to-chat', handleExternalMessage);
    return () => window.removeEventListener('send-to-chat', handleExternalMessage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    if (scrollRef.current && !isLoading && messages.length > 0) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleClearChat = () => {
    onMessagesChange([]);
    setShowMenu(false);
  };

  const handleSaveToNote = (text: string) => {
    onAddNote({
      title: "AI Javobi",
      content: text,
      type: 'reminders',
      isReadOnly: true
    });
  };

  const handleCopyMessage = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveSettings = () => {
    const normalized: ChatConfig = {
      goal: tempConfig.goal,
      responseLength: tempConfig.responseLength || 'default',
      customGoalText: (tempConfig.customGoalText || '').trim()
    };
    setChatConfig(normalized);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('CHAT_CONFIG', JSON.stringify(normalized));
    }
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem('CHAT_CONFIG');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ChatConfig;
      const safeConfig: ChatConfig = {
        goal: parsed.goal || 'default',
        responseLength: parsed.responseLength || 'default',
        customGoalText: parsed.customGoalText || ''
      };
      setChatConfig(safeConfig);
      setTempConfig(safeConfig);
    } catch {
      // ignore corrupted local value
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] relative border border-white/5 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
      {/* Header */}
      <div className="h-12 px-4 flex items-center justify-between shrink-0 bg-[#25282c] border-b border-white/5 z-30 relative">
        <div className="flex items-center gap-2">
          <MessageCircle size={14} className="text-gray-400" />
          <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Chat</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setTempConfig(chatConfig); setIsSettingsOpen(true); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-gray-400"
          >
            <Settings2 size={16} />
          </button>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
              className={`p-1.5 rounded-lg transition-colors text-gray-400 ${showMenu ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#2d3136] border border-white/10 rounded-xl shadow-2xl py-2 z-[60] animate-in fade-in zoom-in-95 duration-150">
                <button 
                  onClick={handleClearChat} 
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors text-left"
                >
                  <Trash size={14} /> Chatni tozalash
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 bg-[#1e1e1e] relative">
        <div className="max-w-4xl mx-auto w-full space-y-8 min-h-full flex flex-col justify-start pb-4">
          {messages.length === 0 && (
            <div className="h-full flex-1 flex flex-col items-center justify-center text-center opacity-30 py-20">
              <Sparkles size={40} className="text-indigo-500 mb-4" />
              <p className="text-sm font-bold text-white uppercase tracking-widest">Savollaringizga javob beraman</p>
              <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Kamida bitta manbani belgilang</p>
            </div>
          )}
          
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`
                ${m.role === 'user' 
                  ? 'max-w-[85%] p-4 rounded-2xl bg-indigo-600 text-white text-[13px] font-medium shadow-lg' 
                  : 'w-full max-w-none p-6 sm:p-8 rounded-2xl bg-[#25282c]/40 border border-white/5'
                }
              `}>
                <div className={`${m.role === 'assistant' ? 'prose prose-invert prose-sm max-w-none text-gray-200 leading-relaxed' : 'text-white'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {m.text}
                  </ReactMarkdown>
                </div>
              </div>

              {m.role === 'assistant' && (
                <div className="flex items-center gap-3 mt-3 ml-2">
                  <button 
                    onClick={() => handleSaveToNote(m.text)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2d3136] border border-white/5 text-[11px] font-bold text-gray-300 hover:bg-[#363a40] transition-all active:scale-95 group"
                  >
                    <Pin size={12} className="text-indigo-400 group-hover:rotate-12 transition-transform" />
                    <span>Eslatmaga saqlash</span>
                  </button>
                  <button 
                    onClick={() => handleCopyMessage(m.id, m.text)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-all active:scale-90"
                    title="Nusxa olish"
                  >
                    {copiedId === m.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-200">
              <div className="bg-[#25282c] px-4 py-2.5 rounded-full flex items-center gap-2.5 border border-white/5 shadow-sm">
                <Loader2 size={16} className="text-indigo-500 animate-spin" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="pb-3 sm:pb-6 px-3 sm:px-8 pt-2 bg-[#1e1e1e] shrink-0 border-t border-white/5">
        <div className="max-w-4xl mx-auto w-full transition-all">
          <div className={`
            relative flex items-center bg-[#25282c] border border-white/10 rounded-[2.5rem] px-4 sm:px-8 py-2 transition-all shadow-xl
            ${sources.length === 0 ? 'opacity-50' : 'focus-within:border-white/20 focus-within:bg-[#2a2d32]'}
          `}>
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              disabled={sources.length === 0}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={sources.length > 0 ? "Savol bering..." : "Avval manba yuklang..."}
              className="w-full bg-transparent border-none outline-none text-gray-200 text-[13px] sm:text-[14px] py-2.5 sm:py-3 resize-none max-h-[150px] min-h-[24px] custom-scrollbar placeholder-gray-500 font-medium"
              rows={1}
            />
            <button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || isLoading || sources.length === 0} 
              className="ml-4 w-9 h-9 bg-[#e8eaed] text-[#1e1e1e] rounded-full hover:bg-white disabled:bg-gray-700 disabled:text-gray-500 transition-all shadow-md active:scale-95 shrink-0 flex items-center justify-center group"
            >
              <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <p className="text-center text-[9px] text-gray-600 mt-4 font-bold uppercase tracking-[0.2em]">
            Javoblar noto'g'ri bo'lishi mumkin. Ularni albatta tekshirib ko'ring.
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#1e1e1e] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 flex items-center justify-between border-b border-white/5">
              <h2 className="text-xl font-bold text-gray-100">Chat sozlamalari</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-10">
              <section className="space-y-4">
                <h3 className="text-[12px] font-black uppercase tracking-widest text-gray-500">Muloqot uslubi yoki rolni tanlang</h3>
                <div className="flex flex-wrap gap-2.5">
                  {['default', 'tutor', 'custom'].map(opt => (
                    <button 
                      key={opt}
                      onClick={() => setTempConfig(prev => ({ ...prev, goal: opt as any }))}
                      className={`
                        px-6 py-2.5 rounded-full text-[13px] font-bold transition-all flex items-center gap-2
                        ${tempConfig.goal === opt 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-[#25282c] text-gray-400 border border-white/5'}
                      `}
                    >
                      {tempConfig.goal === opt && <Check size={14} strokeWidth={3} />}
                      {opt === 'default' ? 'Standart' : opt === 'tutor' ? 'Repetitor' : "O'z variantingiz"}
                    </button>
                  ))}
                </div>
                {tempConfig.goal === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={tempConfig.customGoalText || ''}
                      onChange={(e) => setTempConfig(prev => ({ ...prev, customGoalText: e.target.value }))}
                      placeholder="Masalan: qisqa va amaliy javob bering, misollar bilan tushuntiring"
                      className="w-full px-4 py-3 rounded-xl bg-[#25282c] border border-white/10 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500/60"
                    />
                  </div>
                )}
              </section>
              <section className="space-y-4">
                <h3 className="text-[12px] font-black uppercase tracking-widest text-gray-500">Javob uzunligi</h3>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { key: 'default', label: 'Standart' },
                    { key: 'shorter', label: "Qisqaroq" },
                    { key: 'longer', label: "Batafsilroq" }
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setTempConfig(prev => ({ ...prev, responseLength: opt.key as ChatConfig['responseLength'] }))}
                      className={`
                        px-6 py-2.5 rounded-full text-[13px] font-bold transition-all flex items-center gap-2
                        ${tempConfig.responseLength === opt.key
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#25282c] text-gray-400 border border-white/5'}
                      `}
                    >
                      {tempConfig.responseLength === opt.key && <Check size={14} strokeWidth={3} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
            <div className="px-8 py-6 bg-[#25282c]/30 flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="px-10 py-3 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
