
import React, { useState } from 'react';
import { X, Check, CopyPlus, Sparkles } from 'lucide-react';
import { FlashcardConfig } from '../services/geminiService';

interface FlashcardSetupModalProps {
  onClose: () => void;
  onGenerate: (config: FlashcardConfig) => void;
  theme: 'light' | 'dark';
}

const FlashcardSetupModal: React.FC<FlashcardSetupModalProps> = ({ onClose, onGenerate, theme }) => {
  const [config, setConfig] = useState<FlashcardConfig>({
    cardCount: 'standard',
    style: 'concepts',
    topic: ''
  });

  const bgColor = theme === 'dark' ? 'bg-[#121214]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const subTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const buttonBase = theme === 'dark' ? 'bg-[#1e1e22] text-gray-400 hover:bg-[#25252b]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200';
  const buttonActive = theme === 'dark' ? 'bg-orange-600/20 border-orange-500/50 text-orange-400 ring-1 ring-orange-500/20' : 'bg-orange-50 border-orange-200 text-orange-600 ring-1 ring-orange-100';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'} ${bgColor}`}>
        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
              <CopyPlus size={20} />
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${textColor}`}>Kartochkalarni sozlash</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-2 space-y-6">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Count */}
              <section>
                <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Kartochkalar soni</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'less', label: 'Kamroq' },
                    { id: 'standard', label: 'Standart (15)' },
                    { id: 'more', label: 'Ko\'proq' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setConfig(prev => ({ ...prev, cardCount: opt.id as any }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-transparent flex items-center gap-1.5 whitespace-nowrap ${
                        config.cardCount === opt.id ? buttonActive : buttonBase
                      }`}
                    >
                      {config.cardCount === opt.id && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Style */}
              <section>
                <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Uslubi</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'concepts', label: 'Tushunchalar' },
                    { id: 'definitions', label: 'Ta\'riflar' },
                    { id: 'qa', label: 'Savol-javob' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setConfig(prev => ({ ...prev, style: opt.id as any }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-transparent flex items-center gap-1.5 whitespace-nowrap ${
                        config.style === opt.id ? buttonActive : buttonBase
                      }`}
                    >
                      {config.style === opt.id && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Topic Focus */}
            <section>
              <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Fokus (ixtiyoriy)</h3>
              <div className={`relative p-4 rounded-[1.5rem] border transition-all ${theme === 'dark' ? 'bg-black/20 border-gray-800 focus-within:border-orange-500/50' : 'bg-gray-50 border-gray-200 focus-within:border-orange-400'}`}>
                <textarea
                  placeholder="Masalan: Faqat tarixiy sanalar haqida bo'lsin..."
                  value={config.topic}
                  onChange={e => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                  className={`w-full bg-transparent outline-none resize-none h-20 text-xs leading-relaxed ${textColor} placeholder-gray-500 font-medium`}
                />
                <div className={`mt-3 text-[10px] leading-relaxed border-t pt-3 ${theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                  <p className="font-bold mb-1.5 text-orange-500">G'oyalar:</p>
                  <ul className="space-y-0.5 pl-1 opacity-80">
                    <li className="flex items-center gap-2">• Muhim formulalarni chiqarish</li>
                    <li className="flex items-center gap-2">• Xronologik voqealar ro'yxati</li>
                    <li className="flex items-center gap-2">• Lug'at va terminologiya</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 pt-0 flex justify-end">
          <button
            onClick={() => onGenerate(config)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-orange-600 text-white rounded-[1rem] text-sm font-black hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 active:scale-95 group"
          >
            <Sparkles size={16} className="group-hover:animate-pulse" />
            Kartochkalarni yaratish
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardSetupModal;
