
import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Globe, 
  Youtube, 
  FileText, 
  Clipboard,
  LayoutGrid
} from 'lucide-react';
import { Source } from '../types';

interface SourceAdditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (source: Source) => void;
  sourcesCount: number;
  theme: 'light' | 'dark';
}

const SourceAdditionModal: React.FC<SourceAdditionModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddSource, 
  sourcesCount,
  theme 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'main' | 'text' | 'link'>('main');
  const [textInput, setTextInput] = useState({ title: '', content: '' });
  const [urlInput, setUrlInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      
      const isMedia = file.type.startsWith('image/') || file.type === 'application/pdf';
      
      onAddSource({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        content: isMedia ? "" : (event.target?.result as string),
        type: 'file',
        timestamp: Date.now(),
        status: isMedia ? 'analyzing' : 'ready',
        progress: 0,
        mimeType: file.type,
        base64Data: isMedia ? base64 : undefined
      });
      onClose();
    };

    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.content.trim()) return;
    onAddSource({
      id: Math.random().toString(36).substr(2, 9),
      name: textInput.title || 'Kiritilgan matn',
      content: textInput.content,
      type: 'text',
      timestamp: Date.now(),
      status: 'ready'
    });
    setTextInput({ title: '', content: '' });
    onClose();
  };

  const handleUrlSubmit = (type: 'link' | 'youtube') => {
    if (!urlInput.trim()) return;
    onAddSource({
      id: Math.random().toString(36).substr(2, 9),
      name: urlInput, // Vaqtinchalik nom, keyin tahlil jarayonida o'zgaradi
      content: urlInput,
      type: type,
      timestamp: Date.now(),
      status: 'analyzing', // Endilikda URL ham tahlil qilinadi
      progress: 0
    });
    setUrlInput('');
    onClose();
  };

  const modalBg = theme === 'dark' ? 'bg-[linear-gradient(180deg,#232831_0%,#1f242c_18%,#1b1f25_100%)]' : 'bg-white';
  const cardBg = theme === 'dark' ? 'bg-[#252b34]' : 'bg-gray-50';
  const borderColor = theme === 'dark' ? 'border-[#2b3139]' : 'border-gray-100';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-5xl h-[92vh] sm:h-[86vh] sm:min-h-[760px] rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border ${borderColor} ${modalBg} animate-in zoom-in-95 duration-300 relative`}>
        
        <div className="p-4 sm:p-8 sm:pb-4 pb-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <LayoutGrid size={20} />
             </div>
             <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${textColor}`}>Manbalarni qo'shing</h1>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-gray-500 hover:text-gray-200 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="px-4 sm:px-8 mb-3 sm:mb-4 shrink-0">
           <p className={`text-sm leading-relaxed max-w-2xl ${subTextColor}`}>
             Fayllar yoki havolalarni yuklang. AI ularni avtomatik tahlil qilib, nomlaydi va mazmunini chiqaradi.
           </p>
        </div>

        <div className="flex-1 px-4 sm:px-8 pb-4 flex flex-col">
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if(f) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative w-full h-[19rem] sm:h-[26rem] rounded-[1.6rem] sm:rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer group
              ${isDragging ? 'border-indigo-500/80 bg-indigo-500/10' : 'border-indigo-500/45 hover:border-indigo-500/75 bg-[#242a33]/65 hover:bg-[#262d37]'}
            `}
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 ${theme === 'dark' ? 'bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 shadow-xl shadow-indigo-600/5' : 'bg-indigo-50 text-indigo-600'}`}>
                 <UploadCloud size={32} />
              </div>
              <div className="text-center">
                <h3 className={`text-lg font-bold ${textColor}`}>Faylni tanlang</h3>
                <p className={`text-sm mt-1 ${subTextColor}`}>PDF, Rasmlar yoki Matnli fayllar</p>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
            <button onClick={() => setActiveTab('link')} className={`p-6 rounded-3xl border ${borderColor} ${cardBg} hover:bg-[#2a313b] transition-all flex items-center gap-5 group text-left`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform"><Globe size={24} /></div>
              <div><h4 className={`text-sm font-bold ${textColor}`}>Havola qo'shish</h4><p className="text-[11px] text-gray-500 mt-0.5">Veb-sahifa yoki YouTube</p></div>
            </button>
            <button onClick={() => setActiveTab('text')} className={`p-6 rounded-3xl border ${borderColor} ${cardBg} hover:bg-[#2a313b] transition-all flex items-center gap-5 group text-left`}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform"><Clipboard size={24} /></div>
              <div><h4 className={`text-sm font-bold ${textColor}`}>Matnni joylang</h4><p className="text-[11px] text-gray-500 mt-0.5">Shaxsiy eslatmalar</p></div>
            </button>
          </div>
        </div>

        <div className={`px-4 sm:px-10 py-3 sm:py-4 border-t ${borderColor} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <FileText size={18} className="text-gray-500" />
            <div className="flex-1">
               <div className="flex justify-between items-center mb-1.5 text-[11px] font-bold">
                  <span className={subTextColor}>Xotira holati:</span>
                  <span className={textColor}>{sourcesCount}/50 ta manba</span>
               </div>
               <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" style={{ width: `${(sourcesCount/50)*100}%` }}></div>
               </div>
            </div>
          </div>
        </div>

        {activeTab !== 'main' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-8 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
             <div className={`w-full max-w-lg rounded-[2rem] shadow-2xl p-8 border ${borderColor} ${modalBg} animate-in zoom-in-95 duration-300`}>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`text-xl font-bold ${textColor}`}>{activeTab === 'text' ? 'Matnli manba' : 'Havola qo\'shish'}</h3>
                  <button onClick={() => setActiveTab('main')} className="p-2 rounded-full hover:bg-white/5 text-gray-400"><X size={20} /></button>
                </div>
                {activeTab === 'text' ? (
                  <div className="space-y-4">
                    <input type="text" placeholder="Sarlavha" value={textInput.title} onChange={e => setTextInput(prev => ({ ...prev, title: e.target.value }))} className={`w-full p-4 rounded-2xl border outline-none text-sm font-bold ${borderColor} ${theme === 'dark' ? 'bg-black/20 text-white' : 'bg-gray-50'}`} />
                    <textarea placeholder="Matnni bu yerga joylang..." value={textInput.content} onChange={e => setTextInput(prev => ({ ...prev, content: e.target.value }))} className={`w-full h-48 p-4 rounded-2xl border outline-none text-sm resize-none ${borderColor} ${theme === 'dark' ? 'bg-black/20 text-white' : 'bg-gray-50'}`}></textarea>
                    <button onClick={handleTextSubmit} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20">MANBANI QO'SHISH</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input type="url" placeholder="Havola (URL) manzilini kiriting..." value={urlInput} onChange={e => setUrlInput(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none text-sm font-bold ${borderColor} ${theme === 'dark' ? 'bg-black/20 text-white' : 'bg-gray-50'}`} />
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                       <p className="text-[11px] text-blue-400 leading-relaxed font-medium">
                         AI ushbu linkni o'rganib chiqadi, unga munosib nom beradi va mazmunini chat uchun tayyorlaydi.
                       </p>
                    </div>
                    <button onClick={() => handleUrlSubmit('link')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20">HAVOLANI TAHLIL QILISH</button>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceAdditionModal;

