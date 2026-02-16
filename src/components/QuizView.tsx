
import React, { useState } from 'react';
import { X, Check, Maximize2, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { QuizData } from '../types';

interface QuizViewProps {
  quiz: QuizData;
  sourceCount: number;
  onClose: () => void;
  onExpand?: () => void;
  theme: 'light' | 'dark';
  mode?: 'sidebar' | 'fullscreen';
}

const QuizView: React.FC<QuizViewProps> = ({ quiz, sourceCount, onClose, onExpand, theme, mode = 'sidebar' }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [showSummary, setShowSummary] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  const isSidebar = mode === 'sidebar';
  const isFullscreen = mode === 'fullscreen';

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setSelectedOption(userAnswers[nextIdx]);
    } else {
      setShowSummary(true);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      setSelectedOption(userAnswers[prevIdx]);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (reviewMode) return; 
    setSelectedOption(idx);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = idx;
    setUserAnswers(newAnswers);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setUserAnswers(new Array(totalQuestions).fill(null));
    setShowSummary(false);
    setReviewMode(false);
  };

  const calculateStats = () => {
    const correct = userAnswers.filter((ans, idx) => ans === quiz.questions[idx].correctAnswerIndex).length;
    const skipped = userAnswers.filter(ans => ans === null).length;
    const incorrect = totalQuestions - correct - skipped;
    const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    return { correct, incorrect, skipped, accuracy };
  };

  const SummaryContent = () => {
    const { correct, incorrect, skipped, accuracy } = calculateStats();
    
    if (isSidebar) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
            <Check size={32} className="text-indigo-400" />
          </div>
          
          <h2 className="text-[12px] font-black text-white mb-2 tracking-widest uppercase">Test yakunlandi</h2>
          <p className="text-[10px] text-gray-500 font-bold mb-6 uppercase tracking-widest truncate max-w-full px-4">{quiz.title}</p>
          
          <div className="w-full space-y-2.5 mb-8">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#25282c] p-3.5 rounded-2xl border border-white/5 flex flex-col items-center justify-center shadow-lg">
                <span className="text-[8px] font-black text-gray-500 uppercase mb-1 tracking-tighter">NATIJA</span>
                <span className="text-lg font-black text-white">{correct} / {totalQuestions}</span>
              </div>
              <div className="bg-[#25282c] p-3.5 rounded-2xl border border-white/5 flex flex-col items-center justify-center shadow-lg">
                <span className="text-[8px] font-black text-gray-500 uppercase mb-1 tracking-tighter">ANIQLIK</span>
                <span className="text-lg font-black text-white">{accuracy}%</span>
              </div>
            </div>
            
            <div className="bg-[#25282c] p-3.5 rounded-2xl border border-white/5 shadow-lg space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 uppercase tracking-tighter">To'g'ri</span>
                <span className="text-green-400">{correct}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 uppercase tracking-tighter">Xato</span>
                <span className="text-red-400">{incorrect}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-gray-500 uppercase tracking-tighter">O'tkazildi</span>
                <span className="text-gray-300">{skipped}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-2 px-2">
            <button 
              onClick={() => { setShowSummary(false); setReviewMode(true); setCurrentQuestionIndex(0); setSelectedOption(userAnswers[0]); }} 
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
            >
              Javoblarni ko'rish
            </button>
            <button 
              onClick={handleRestart} 
              className="w-full py-2.5 rounded-xl bg-[#25282c] border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all active:scale-95"
            >
              Qayta yechish
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
        <h2 className="text-2xl font-black text-white mb-6 tracking-tight uppercase">
          Natija! Test yakunlandi
        </h2>
        
        <div className="sm:grid-cols-3 grid grid-cols-1 gap-4 w-full max-w-2xl mb-8">
          <div className="bg-[#25282c] p-4 rounded-3xl flex flex-col items-start justify-between min-h-[100px] border border-white/5 shadow-xl">
            <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em]">NATIJA</span>
            <span className="text-3xl font-black text-white">{correct} / {totalQuestions}</span>
          </div>
          <div className="bg-[#25282c] p-4 rounded-3xl flex flex-col items-start justify-between min-h-[100px] border border-white/5 shadow-xl">
            <span className="text-gray-500 text-[9px] font-black uppercase tracking-[0.2em]">ANIQLIK</span>
            <span className="text-3xl font-black text-white">{accuracy}%</span>
          </div>
          <div className="bg-[#25282c] p-4 rounded-3xl flex flex-col justify-center gap-2 min-h-[100px] border border-white/5 shadow-xl text-[11px] font-bold">
            <div className="flex justify-between items-center"><span className="text-gray-400">To'g'ri</span><span className="text-white">{correct}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-400">Noto'g'ri</span><span className="text-white">{incorrect}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-400">O'tkazildi</span><span className="text-white">{skipped}</span></div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => { setShowSummary(false); setReviewMode(true); setCurrentQuestionIndex(0); setSelectedOption(userAnswers[0]); }} className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-[11px] font-black uppercase hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20">Javoblarni ko'rish</button>
          <button onClick={handleRestart} className="px-6 py-2.5 rounded-full bg-[#25282c] border border-white/10 text-gray-300 text-[11px] font-black uppercase hover:bg-white/5 hover:text-white transition-all active:scale-95">Qayta yechish</button>
        </div>
      </div>
    );
  };

  const headerUI = (
    <header className={`${isSidebar ? 'h-12 px-4 bg-[#25282c]' : 'h-16 px-5 bg-transparent'} flex items-center justify-between shrink-0 border-b border-white/5`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
           {isSidebar && (
             <>
               <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest whitespace-nowrap">Studio</span>
               <ChevronRightIcon size={10} className="text-gray-700 shrink-0" />
             </>
           )}
           <h1 className={`${isSidebar ? 'text-[11px]' : 'text-[22px]'} font-semibold text-gray-100 truncate pr-4 leading-none`}>
             {isSidebar ? 'Test' : quiz.title}
           </h1>
        </div>
        {isFullscreen && <p className="text-[11px] text-gray-400 mt-1">{sourceCount} ta manba asosida</p>}
      </div>
      
      <div className="flex items-center gap-3">
        {isSidebar && onExpand && (
          <button onClick={onExpand} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all" title="Kengaytirish">
            <Maximize2 size={16} />
          </button>
        )}
        <button 
          onClick={onClose} 
          className={`rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all ${isSidebar ? 'p-1.5' : 'p-2'}`}
          title="Yopish"
        >
          <X size={isSidebar ? 18 : 20} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-[500] bg-[#1a1c1f] p-2 sm:p-3 flex items-stretch justify-stretch animate-in fade-in duration-300" 
    : "flex flex-col h-full bg-[#1e1e1e] animate-in fade-in overflow-hidden";

  const innerContainerClasses = isFullscreen
    ? "w-full h-full bg-[linear-gradient(180deg,#232831_0%,#1f242c_18%,#1b1f25_100%)] rounded-[18px] flex flex-col overflow-hidden border border-[#2b3139]"
    : "flex flex-col h-full overflow-hidden";

  if (showSummary) {
    return (
      <div className={containerClasses}>
        <div className={innerContainerClasses}>
          {headerUI}
          <SummaryContent />
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={innerContainerClasses}>
        {headerUI}

        <main className={`flex-1 flex flex-col items-center overflow-y-auto custom-scrollbar ${isSidebar ? 'justify-center px-4 py-4' : 'justify-start px-10 pt-8 pb-24'}`}>
          <div className={`${isSidebar ? 'max-w-[460px] mx-auto w-full' : 'max-w-[640px] w-full'}`}>
            <div className="mb-4 flex items-center justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
              <span>Savol {currentQuestionIndex + 1} / {totalQuestions}</span>
              <div className="flex gap-1.5">
                {userAnswers.map((ans, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentQuestionIndex ? 'bg-indigo-500 scale-125' : ans !== null ? 'bg-gray-600' : 'bg-gray-800'}`}></div>
                ))}
              </div>
            </div>

            <h2 className={`${isSidebar ? 'text-[13px] mb-5' : 'text-[15px] mb-7'} font-bold text-gray-100 leading-snug`}>
              {currentQuestion.question}
            </h2>

            <div className={`grid grid-cols-1 ${isSidebar ? 'gap-2 mb-6' : 'gap-1.5 mb-8'}`}>
              {currentQuestion.options.map((option, idx) => {
                const labels = ['A', 'B', 'C', 'D'];
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQuestion.correctAnswerIndex;
                const hasAnswered = selectedOption !== null || reviewMode;

                let cardStyles = isSidebar
                  ? 'bg-[#25282c] border-white/5 hover:bg-[#2d3136] transition-all cursor-pointer shadow-sm'
                  : 'bg-[#121824] border-[#223145] hover:bg-[#182233] transition-all cursor-pointer';
                if (hasAnswered) {
                  if (isCorrect) cardStyles = isSidebar
                    ? 'bg-[#25282c] border-green-500/50 ring-1 ring-green-500/20'
                    : 'bg-[#16231d] border-green-500/40 ring-1 ring-green-500/20';
                  else if (isSelected) cardStyles = isSidebar
                    ? 'bg-[#25282c] border-red-500/50 ring-1 ring-red-500/20'
                    : 'bg-[#2a1a1f] border-red-500/40 ring-1 ring-red-500/20';
                  else cardStyles = isSidebar
                    ? 'bg-[#25282c] border-white/5 opacity-40 grayscale-[0.5]'
                    : 'bg-[#121824] border-[#223145] opacity-45 grayscale-[0.45]';
                }

                return (
                  <button 
                    key={idx} 
                    disabled={hasAnswered && !reviewMode}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left rounded-xl border flex flex-col gap-1 transition-all active:scale-[0.99] ${isSidebar ? 'p-3' : 'p-4'} ${cardStyles}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${hasAnswered && isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-black/20 text-gray-500'}`}>
                        {labels[idx]}
                      </div>
                      <span className={`${isSidebar ? 'text-[12px]' : 'text-[13px]'} font-medium text-gray-200 leading-tight flex-1`}>
                        {option}
                      </span>
                    </div>

                    {hasAnswered && (isCorrect || (isSelected && !reviewMode) || (reviewMode && isSelected)) && (
                      <div className={`mt-2 pt-2 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-300`}>
                        <div className={`flex items-center gap-2 text-[10px] font-bold mb-1 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                           <span>{isCorrect ? "TO'G'RI JAVOB" : "XATO JAVOB"}</span>
                        </div>
                        <p className={`${isSidebar ? 'text-[10px]' : 'text-[11px]'} text-gray-500 leading-relaxed font-medium`}>
                          {currentQuestion.optionExplanations?.[idx] || (isCorrect ? "Ushbu variant mantiqan to'g'ri." : "Ushbu variant savol mazmuniga mos kelmaydi.")}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {isSidebar ? (
              <div className="flex items-center justify-between mt-auto border-t border-white/5 py-4">
                <button 
                  onClick={handlePrev} 
                  disabled={currentQuestionIndex === 0} 
                  className="text-gray-500 hover:text-white transition-all text-[11px] font-bold px-5 py-2 hover:bg-white/5 rounded-full disabled:opacity-0 active:scale-95"
                >
                  Orqaga
                </button>
                <button 
                  onClick={handleNext}
                  className="px-8 py-2.5 rounded-full text-[11px] font-black transition-all active:scale-95 shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 uppercase tracking-widest"
                >
                  {currentQuestionIndex === totalQuestions - 1 ? 'Tugatish' : 'Keyingisi'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-auto border-t border-white/5 py-5">
                <button 
                  onClick={handlePrev} 
                  disabled={currentQuestionIndex === 0} 
                  className="text-gray-500 hover:text-white transition-all text-[11px] font-bold px-5 py-2 hover:bg-white/5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  Orqaga
                </button>
                <button 
                  onClick={handleNext}
                  className="px-6 py-2 rounded-full text-[11px] font-black transition-all active:scale-95 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {currentQuestionIndex === totalQuestions - 1 ? 'Tugatish' : 'Keyingisi'}
                </button>
              </div>
            )}
          </div>
        </main>
        {isFullscreen && (
          <div className="h-12 border-t border-white/5 px-4 flex items-center justify-end text-[11px] text-gray-400 bg-black/10">
            <span className="text-[10px] text-gray-500">Javoblar noto'g'ri bo'lishi mumkin</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;

