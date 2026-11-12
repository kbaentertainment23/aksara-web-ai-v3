import React from 'react';
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  Check,
  AlertTriangle,
} from 'lucide-react';

export interface WordStatusBarProps {
  prelimSheetsCount: number;
  pagesCount: number;
  wordCount: number;
  paragraphCount: number;
  autoSaveStatus: 'idle' | 'saving' | 'saved';
  autoSavedTime?: string;
  hasReferenceMarkers: boolean;
  referenceMarkersCount: number;
  hasContent: boolean;
}

export const WordStatusBar: React.FC<WordStatusBarProps> = ({
  prelimSheetsCount,
  pagesCount,
  wordCount,
  paragraphCount,
  autoSaveStatus,
  autoSavedTime,
  hasReferenceMarkers,
  referenceMarkersCount,
  hasContent,
}) => {
  return (
    <div className="px-4 py-2 bg-slate-100 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-600 select-none rounded-b-2xl">
      <div className="flex items-center gap-4">
        <span className="font-semibold text-[#2B579A] flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {prelimSheetsCount > 0 ? (
            <span>
              {prelimSheetsCount} Lembar Formal + {pagesCount} Halaman Bab (Total{' '}
              {prelimSheetsCount + pagesCount} Halaman A4)
            </span>
          ) : (
            <span>Total {pagesCount} Halaman A4</span>
          )}
        </span>
        <span className="font-medium">
          {wordCount.toLocaleString()} Kata
        </span>
        <span className="hidden sm:inline">
          {paragraphCount} Paragraf
        </span>
        <span className="hidden md:inline text-slate-500">
          Bahasa Indonesia (EYD V)
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Auto-Save Tenang & Halus */}
        {autoSaveStatus === 'saving' && (
          <span
            data-testid="autosave-status-saving"
            className="inline-flex items-center gap-1.5 text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px] font-medium transition-all"
          >
            <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
            <span>Menyimpan otomatis...</span>
          </span>
        )}
        {autoSaveStatus === 'saved' && (
          <span
            data-testid="autosave-status-saved"
            className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-medium transition-all"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Semua perubahan tersimpan otomatis{autoSavedTime ? ` (${autoSavedTime})` : ''}</span>
          </span>
        )}
        {autoSaveStatus === 'idle' && hasContent && (
          <span
            data-testid="autosave-status-idle"
            className="hidden sm:inline-flex items-center gap-1 text-slate-500 text-[11px]"
          >
            <Check className="w-3 h-3 text-slate-400" />
            <span>Tersimpan otomatis</span>
          </span>
        )}

        {hasReferenceMarkers && (
          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium text-[11px]">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {referenceMarkersCount} Referensi Perlu Verifikasi
          </span>
        )}
        <span className="text-[11px] text-slate-500">
          Standar Margin 4-3-3-3 cm Aktif
        </span>
      </div>
    </div>
  );
};
