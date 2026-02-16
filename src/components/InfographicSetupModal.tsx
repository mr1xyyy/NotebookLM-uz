
import React, { useState } from 'react';
import { X, Check, BarChart3, Sparkles } from 'lucide-react';
import { InfographicConfig } from '../services/geminiService';

interface InfographicSetupModalProps {
  onClose: () => void;
  onGenerate: (config: InfographicConfig) => void;
  theme: 'light' | 'dark';
}

const InfographicSetupModal: React.FC<InfographicSetupModalProps> = ({ onClose, onGenerate, theme }) => {
  const [config, setConfig] = useState<InfographicConfig>({
    style: 'vibrant',
    layout: '9:16',
    topic: ''
  });

  const bgColor = theme === 'dark' ? 'bg-[#121214]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const subTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const buttonBase = theme === 'dark' ? 'bg-[#1e1e22] text-gray-400 hover:bg-[#25252b]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200';
  const buttonActive = theme === 'dark' ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400 ring-1 ring-cyan-500/20' : 'bg-cyan-50 border-cyan-200 text-cyan-600 ring-1 ring-cyan-100';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'} ${bgColor}`}>
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
              <BarChart3 size={20} />
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${textColor}`}>Infografikani sozlash</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-2 space-y-6">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section>
                <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Vizual uslub</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'minimalist', label: 'Minimalist' },
                    { id: 'detailed', label: 'Batafsil' },
                    { id: 'vibrant', label: 'Yorqin' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setConfig(prev => ({ ...prev, style: opt.id as any }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-transparent flex items-center gap-1.5 whitespace-nowrap ${config.style === opt.id ? buttonActive : buttonBase}`}
                    >
                      {config.style === opt.id && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Format (Layout)</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '9:16', label: 'Portret (9:16)' },
                    { id: '1:1', label: 'Kvadrat (1:1)' },
                    { id: '16:9', label: 'Landshaft (16:9)' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setConfig(prev => ({ ...prev, layout: opt.id as any }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-transparent flex items-center gap-1.5 whitespace-nowrap ${config.layout === opt.id ? buttonActive : buttonBase}`}
                    >
                      {config.layout === opt.id && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <section>
              <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Mavzu (ixtiyoriy)</h3>
              <div className={`relative p-4 rounded-[1.5rem] border transition-all ${theme === 'dark' ? 'bg-black/20 border-gray-800 focus-within:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus-within:border-cyan-500'}`}>
                <textarea
                  placeholder="Masalan: Python dasturlash tili asoslari bo'yicha infografika yarat..."
                  value={config.topic}
                  onChange={e => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                  className={`w-full bg-transparent outline-none resize-none h-20 text-xs leading-relaxed ${textColor} placeholder-gray-500 font-medium`}
                />
                <div className={`mt-3 text-[10px] leading-relaxed border-t pt-3 ${theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                  <p className="font-bold mb-1.5 text-cyan-500">Vizualizatsiya g'oyalari:</p>
                  <ul className="space-y-0.5 pl-1 opacity-80">
                    <li className="flex items-center gap-2">• Jarayonlar ketma-ketligi</li>
                    <li className="flex items-center gap-2">• Solishtirma statistikalar</li>
                    <li className="flex items-center gap-2">• Muhim faktlar jamlanmasi</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 pt-0 flex justify-end">
          <button
            onClick={() => onGenerate(config)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-cyan-600 text-white rounded-[1rem] text-sm font-black hover:bg-cyan-700 transition-all shadow-xl shadow-cyan-600/20 active:scale-95 group"
          >
            <Sparkles size={16} className="group-hover:animate-pulse" />
            Infografikani yaratish
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfographicSetupModal;
