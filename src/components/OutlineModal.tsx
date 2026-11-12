import React from 'react';
import { BookOpen, CheckCircle, X, Sparkles, Edit3 } from 'lucide-react';

interface OutlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  outlineText: string;
  onApproveAndGenerate: () => void;
  isLoading: boolean;
}

export const OutlineModal: React.FC<OutlineModalProps> = ({
  isOpen,
  onClose,
  outlineText,
  onApproveAndGenerate,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-[#F0F9FF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8] text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#1E3A5F]">
                Kerangka Garis Besar Naskah
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                Tinjau arah struktur pembahasan sebelum AI menghasilkan naskah lengkap.
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

        {/* Outline Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto font-serif text-xs sm:text-sm leading-relaxed text-slate-800 space-y-2.5 flex-1">
          {outlineText.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-1.5" />;
            if (trimmed.startsWith('# ')) {
              return (
                <h2
                  key={idx}
                  className="font-sans text-sm sm:text-base font-bold text-[#1E3A5F] border-b pb-1"
                >
                  {trimmed.replace(/^#\s+/, '')}
                </h2>
              );
            }
            if (trimmed.startsWith('## ')) {
              return (
                <h3
                  key={idx}
                  className="font-sans text-xs sm:text-sm font-bold text-sky-800 pt-1.5"
                >
                  {trimmed.replace(/^##\s+/, '')}
                </h3>
              );
            }
            return (
              <p key={idx} className="text-slate-700 pl-2.5 sm:pl-3 border-l-2 border-sky-200">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer text-center"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={onApproveAndGenerate}
            disabled={isLoading}
            className="px-4 sm:px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#1E3A5F] to-[#0284C7] text-white hover:opacity-95 shadow-md shadow-sky-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Membuat Naskah Lengkap...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-sky-200 shrink-0" />
                <span>Setujui Kerangka & Lanjutkan Buat Naskah</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
