
import React, { useState } from 'react';
import { X, Check, MonitorPlay, Sparkles } from 'lucide-react';
import { PresentationConfig } from '../services/geminiService';

interface PresentationSetupModalProps {
  onClose: () => void;
  onGenerate: (config: PresentationConfig) => void;
  theme: 'light' | 'dark';
}

const PresentationSetupModal: React.FC<PresentationSetupModalProps> = ({ onClose, onGenerate, theme }) => {
  const [config, setConfig] = useState<PresentationConfig>({
    slideCount: 'standard',
    audience: 'general',
    topic: ''
  });

  const bgColor = theme === 'dark' ? 'bg-[#121214]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const subTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const buttonBase = theme === 'dark' ? 'bg-[#1e1e22] text-gray-400 hover:bg-[#25252b]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200';
  const buttonActive = theme === 'dark' ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 ring-1 ring-blue-500/20' : 'bg-blue-50 border-blue-200 text-blue-600 ring-1 ring-blue-100';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'} ${bgColor}`}>
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <MonitorPlay size={20} />
            </div>
            <h2 className={`text-lg font-bold tracking-tight ${textColor}`}>Taqdimotni sozlash</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-2 space-y-6">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section>
                <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Slaydlar soni</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'short', label: 'Qisqa (5 ta)' },
                    { id: 'standard', label: 'Standart (10 ta)' },
                    { id: 'detailed', label: 'Batafsil (15 ta)' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setConfig(prev => ({ ...prev, slideCount: opt.id as any }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-transparent flex items-center gap-1.5 whitespace-nowrap ${config.slideCount === opt.id ? buttonActive : buttonBase}`}
                    >
                      {config.slideCount === opt.id && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Auditoriya</h3>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'general', label: 'Umumiy' },
                    { id: 'professional', label: 'Professional' },
                    { id: 'academic', label: 'Akademik' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setConfig(prev => ({ ...prev, audience: opt.id as any }))}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border border-transparent flex items-center gap-1.5 whitespace-nowrap ${config.audience === opt.id ? buttonActive : buttonBase}`}
                    >
                      {config.audience === opt.id && <Check size={12} />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <section>
              <h3 className={`text-[10px] font-black mb-3 uppercase tracking-[0.2em] ${subTextColor}`}>Mavzu fokusi (ixtiyoriy)</h3>
              <div className={`relative p-4 rounded-[1.5rem] border transition-all ${theme === 'dark' ? 'bg-black/20 border-gray-800 focus-within:border-blue-500/50' : 'bg-gray-50 border-gray-200 focus-within:border-blue-500'}`}>
                <textarea
                  placeholder="Masalan: Faqat loyiha xarajatlariga e'tibor qarating..."
                  value={config.topic}
                  onChange={e => setConfig(prev => ({ ...prev, topic: e.target.value }))}
                  className={`w-full bg-transparent outline-none resize-none h-20 text-xs leading-relaxed ${textColor} placeholder-gray-500 font-medium`}
                />
                <div className={`mt-3 text-[10px] leading-relaxed border-t pt-3 ${theme === 'dark' ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
                  <p className="font-bold mb-1.5 text-blue-500">Maslahatlar:</p>
                  <ul className="space-y-0.5 pl-1 opacity-80">
                    <li className="flex items-center gap-2">• Muhim natijalarni ajratib ko'rsatish</li>
                    <li className="flex items-center gap-2">• Xaritalar va jadvallar rejasini tuzish</li>
                    <li className="flex items-center gap-2">• Kelajakdagi qadamlarni belgilash</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-6 pt-0 flex justify-end">
          <button
            onClick={() => onGenerate(config)}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-[1rem] text-sm font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 group"
          >
            <Sparkles size={16} className="group-hover:animate-pulse" />
            Rejani yaratish
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresentationSetupModal;
