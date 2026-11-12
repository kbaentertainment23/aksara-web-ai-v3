import React from 'react';
import {
  AlignJustify,
  AlignLeft,
  AlignCenter,
  FileCheck2,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

export interface WordFormattingToolbarProps {
  fontFamily: 'Times New Roman' | 'Arial' | 'Calibri';
  setFontFamily: (font: 'Times New Roman' | 'Arial' | 'Calibri') => void;
  fontSizePt: number;
  setFontSizePt: (size: number) => void;
  lineSpacing: number;
  setLineSpacing: (spacing: number) => void;
  textAlign: 'justify' | 'left' | 'center';
  setTextAlign: (align: 'justify' | 'left' | 'center') => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  isCitationHighlightActive: boolean;
  setIsCitationHighlightActive: (active: boolean) => void;
  missingCitationsCount: number;
  showRuler: boolean;
  onToggleRuler: () => void;
}

export const WordFormattingToolbar: React.FC<WordFormattingToolbarProps> = ({
  fontFamily,
  setFontFamily,
  fontSizePt,
  setFontSizePt,
  lineSpacing,
  setLineSpacing,
  textAlign,
  setTextAlign,
  zoomLevel,
  setZoomLevel,
  isCitationHighlightActive,
  setIsCitationHighlightActive,
  missingCitationsCount,
  showRuler,
  onToggleRuler,
}) => {
  return (
    <div className="px-3 sm:px-4 py-2 bg-slate-50 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Font Family */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
          <span className="text-slate-400 font-serif font-bold text-xs">A</span>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as any)}
            className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="Times New Roman">Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Calibri">Calibri</option>
          </select>
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
          <select
            value={fontSizePt}
            onChange={(e) => setFontSizePt(parseInt(e.target.value))}
            className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value={12}>12 pt</option>
            <option value={11}>11 pt</option>
            <option value={14}>14 pt</option>
          </select>
        </div>

        {/* Line Spacing */}
        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">Spasi:</span>
          <select
            value={lineSpacing}
            onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value={1.5}>1.5 Spasi</option>
            <option value={2.0}>2.0 Spasi</option>
            <option value={1.15}>1.15 Spasi</option>
          </select>
        </div>

        {/* Alignment */}
        <div className="flex items-center bg-white rounded-md border border-slate-200 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setTextAlign('justify')}
            className={`p-1 rounded cursor-pointer ${
              textAlign === 'justify' ? 'bg-[#2B579A] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Rata Kiri-Kanan (Justify - Standar Karya Ilmiah)"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('left')}
            className={`p-1 rounded cursor-pointer ${
              textAlign === 'left' ? 'bg-[#2B579A] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Rata Kiri"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTextAlign('center')}
            className={`p-1 rounded cursor-pointer ${
              textAlign === 'center' ? 'bg-[#2B579A] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Rata Tengah"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Margins Indicator Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-600 shadow-2xs">
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Margin Skripsi: <strong>4-3-3-3 cm</strong></span>
        </div>
      </div>

      {/* Zoom & Toggle controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Toggle Highlight Sitasi */}
        <button
          type="button"
          onClick={() => setIsCitationHighlightActive(!isCitationHighlightActive)}
          className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-all flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 ${
            isCitationHighlightActive
              ? missingCitationsCount > 0
                ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
          }`}
          title="Aktifkan/nonaktifkan penandaan visual sitasi dalam lembar naskah"
        >
          {isCitationHighlightActive ? (
            <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="hidden sm:inline">Highlight Sitasi</span>
          <span className="sm:hidden">Sitasi</span>
          {missingCitationsCount > 0 && isCitationHighlightActive && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleRuler}
          className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
            showRuler ? 'bg-sky-100 border-sky-300 text-sky-800 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title="Tampilkan / sembunyikan penggaris margin Word standar 4-3-3-3 cm"
        >
          <span className="hidden sm:inline">Penggaris Word</span>
          <span className="sm:hidden">Ruler</span>
        </button>

        {/* Responsive Zoom Controls with Auto-Fit */}
        <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                const avail = Math.min(window.innerWidth - 32, 794);
                const fitPercent = Math.max(40, Math.min(100, Math.round((avail / 794) * 100)));
                setZoomLevel(fitPercent);
              }
            }}
            className="px-1.5 py-0.5 text-[10px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded cursor-pointer"
            title="Sesuaikan skala otomatis dengan lebar layar (Auto-Fit Layar)"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(40, z - 10))}
            className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
            title="Perkecil"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[11px] font-semibold text-slate-700 w-8 text-center select-none">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
            className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
            title="Perbesar"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
