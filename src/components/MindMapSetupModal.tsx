
import React, { useState } from 'react';
import { X, Check, Network, Sparkles } from 'lucide-react';
import { MindMapConfig } from '../services/geminiService';

interface MindMapSetupModalProps {
  onClose: () => void;
  onGenerate: (config: MindMapConfig) => void;
  theme: 'light' | 'dark';
}

const MindMapSetupModal: React.FC<MindMapSetupModalProps> = ({ onClose, onGenerate, theme }) => {
  const [config, setConfig] = useState<MindMapConfig>({
    complexity: 'standard',
    topic: ''
  });

  const bgColor = theme === 'dark' ? 'bg-[#121214]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const subTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const buttonBase = theme === 'dark' ? 'bg-[#1e1e22] text-gray-400 hover:bg-[#25252b]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200';
  const buttonActive = theme === 'dark' ? 'bg-green-600/20 border-green-500/50 text-green-400 ring-1 ring-green-500/20' : 'bg-green-50 border-green-200 text-green-600 ring-1 ring-green-100';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'} ${bgColor}`}>
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
              <Network size={20} />
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${textColor}`}>Aqliy xaritani sozlash</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-2 space-y-6">
          <div className="flex flex-col gap-6">
            <section>
              <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Murakkablik darajasi</h3>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'simple', label: 'Oddiy' },
                  { id: 'standard', label: 'Standart' },
                  { id: 'complex', label: 'Murakkab (Batafsil)' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setConfig(prev => ({ ...prev, complexity: opt.id as any }))}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-transparent flex items-center gap-1.5 whitespace-nowrap ${config.complexity === opt.id ? buttonActive : buttonBase}`}
                  >
                    {config.complexity === opt.id && <Check size={12} />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Fokus nuqtasi (ixtiyoriy)</h3>
              <div className={`relative p-4 rounded-[1.5rem] border transition-all ${theme === 'dark' ? 'bg-black/20 border-gray-800 focus-within:border-green-500/50' : 'bg-gray-50 border-gray-200 focus-within:border-green-500'}`}>
                <textarea
                  placeholder="Masalan: Faqat iqtisodiy bog'liqliklarni ko'rsat..."
                  value={config.topic}
                  onChange={e => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                  className={`w-full bg-transparent outline-none resize-none h-20 text-xs leading-relaxed ${textColor} placeholder-gray-500 font-medium`}
                />
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 pt-0 flex justify-end">
          <button
            onClick={() => onGenerate(config)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-[1rem] text-sm font-black hover:bg-green-700 transition-all shadow-xl shadow-green-600/20 active:scale-95 group"
          >
            <Sparkles size={16} className="group-hover:animate-pulse" />
            Xaritani yaratish
          </button>
        </div>
      </div>
    </div>
  );
};

export default MindMapSetupModal;
