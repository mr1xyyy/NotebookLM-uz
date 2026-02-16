import React, { useState } from 'react';
import { 
  X, Trash2, Undo2, Redo2, Bold, Italic, Link, 
  List, ListOrdered, RemoveFormatting, ChevronDown, 
  Maximize2, Share2, FilePlus, ChevronRight
} from 'lucide-react';

interface NoteEditorViewProps {
  note: { id: string; title: string; content: string };
  onClose: () => void;
  onSave: (id: string, title: string, content: string) => void;
  onDelete: (id: string) => void;
  onConvertToSource: (title: string, content: string) => void;
}

const NoteEditorView: React.FC<NoteEditorViewProps> = ({ note, onClose, onSave, onDelete, onConvertToSource }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const handleSave = () => {
    onSave(note.id, title, content);
  };

  const toolbarButtons = [
    { icon: <Undo2 size={16} />, title: 'Undo' },
    { icon: <Redo2 size={16} />, title: 'Redo' },
  ];

  const formatButtons = [
    { icon: <Bold size={16} />, title: 'Bold' },
    { icon: <Italic size={16} />, title: 'Italic' },
    { icon: <Link size={16} />, title: 'Link' },
  ];

  const listButtons = [
    { icon: <List size={16} />, title: 'Bullet List' },
    { icon: <ListOrdered size={16} />, title: 'Numbered List' },
  ];

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl h-[85vh] bg-[#1a1c1e] rounded-2xl shadow-2xl border border-white/5 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Breadcrumb Header */}
        <div className="h-12 px-6 flex items-center justify-between border-b border-white/5 bg-[#25282c]/30">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">Studiya</span>
            <ChevronRight size={14} className="text-gray-600" />
            <span className="text-gray-200">Eslatma</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-white transition-all"><Maximize2 size={16} /></button>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-all"><X size={18} /></button>
          </div>
        </div>

        {/* Title and Controls Area */}
        <div className="px-8 pt-6 pb-2 flex items-center justify-between">
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            className="bg-transparent border-none outline-none text-2xl font-bold text-gray-100 placeholder-gray-600 flex-1"
            placeholder="Yangi eslatma"
          />
          <button 
            onClick={() => onDelete(note.id)}
            className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Rich Text Toolbar Sim */}
        <div className="px-8 py-3 flex items-center gap-6 border-b border-white/5">
          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            {toolbarButtons.map((btn, i) => (
              <button key={i} className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all">{btn.icon}</button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all text-[13px] font-medium">
              Normal <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            {formatButtons.map((btn, i) => (
              <button key={i} className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all">{btn.icon}</button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-r border-white/10 pr-4">
            {listButtons.map((btn, i) => (
              <button key={i} className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all">{btn.icon}</button>
            ))}
          </div>

          <button className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <RemoveFormatting size={16} />
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            placeholder="Eslatma matnini bu yerga yozing..."
            className="w-full h-full bg-transparent border-none outline-none resize-none text-[15px] leading-relaxed text-gray-300 placeholder-gray-700 font-medium"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 flex items-center justify-start bg-[#1a1c1e]">
          <button 
            onClick={() => onConvertToSource(title, content)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[13px] font-bold text-gray-200 transition-all active:scale-95"
          >
            <FilePlus size={16} className="text-indigo-400" />
            Manbaga aylantirish
          </button>
        </div>

      </div>
    </div>
  );
};

export default NoteEditorView;