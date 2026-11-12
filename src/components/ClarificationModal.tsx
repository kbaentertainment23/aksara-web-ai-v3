import React, { useState } from 'react';
import { HelpCircle, X, Sparkles, ArrowRight } from 'lucide-react';

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: string[];
  onSubmitAnswers: (answers: Record<string, string>) => void;
  onProceedAnyway: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSubmitAnswers,
  onProceedAnyway,
}) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!isOpen || questions.length === 0) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAnswers(answers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92dvh] flex flex-col">
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-[#F0F9FF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8] text-white flex items-center justify-center shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#1E3A5F]">
                Pertanyaan Klarifikasi Penelitian
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                Lengkapi rincian berikut agar naskah akademik lebih presisi dan kontekstual.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
          {questions.map((q, idx) => (
            <div key={idx} className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 leading-snug">
                {idx + 1}. {q}
              </label>
              <textarea
                rows={2}
                value={answers[idx] || ''}
                onChange={(e) =>
                  setAnswers({ ...answers, [idx]: e.target.value })
                }
                placeholder="Jawaban singkat Anda..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
              />
            </div>
          ))}

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onProceedAnyway}
              className="text-xs text-slate-500 hover:text-slate-700 underline font-medium text-center sm:text-left cursor-pointer"
            >
              Lanjutkan Dengan Asumsi Standar
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Terapkan & Generate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
