import React, { memo } from 'react';
import {
  PaginatedPage,
  CitationMatchItem,
  AcademicTableData,
} from '../../utils/academicRules.ts';
import {
  PARENTHETICAL_CITATION_PATTERN,
  NARRATIVE_CITATION_PATTERN,
  isAcademicCitationString,
} from '../DocumentEditor.tsx';

export interface A4PageSheetProps {
  page: PaginatedPage;
  fontFamily: string;
  fontSizePt: number;
  lineSpacing: number;
  textAlign: 'justify' | 'left' | 'center';
  tentativeTitle: string;
  topic: string;
  degreeLevel: string;
  studyProgram: string;
  isCitationHighlightActive: boolean;
  citationMatchesMap: Map<string, CitationMatchItem>;
  onCitationClick: (item: CitationMatchItem) => void;
}

export const A4PageSheet: React.FC<A4PageSheetProps> = memo(({
  page,
  fontFamily,
  fontSizePt,
  lineSpacing,
  textAlign,
  tentativeTitle,
  topic,
  degreeLevel,
  studyProgram,
  isCitationHighlightActive,
  citationMatchesMap,
  onCitationClick,
}) => {
  const pageNumber = page.pageNumber;
  const pageItems = page.items;
  const isChapterStart = page.isChapterStart;
  const suppressRunningHead = page.suppressRunningHead;

  // Helper to render academic paragraph text with clean green citation highlights (no block, neat inline typography)
  const renderTextWithCitationHighlights = (text: string, keyPrefix: string | number) => {
    if (!text) return text;

    const hasPlaceholders = text.includes('[REFERENSI DIPERLUKAN') || text.includes('[DATA LOKAL');
    if (!isCitationHighlightActive && !hasPlaceholders) {
      return text;
    }

    const placeholderPattern = '\\[(?:REFERENSI DIPERLUKAN|DATA LOKAL)[^\\]]*\\]';
    const citationTokens: string[] = [];

    if (isCitationHighlightActive && citationMatchesMap.size > 0) {
      const sortedRaw = Array.from(citationMatchesMap.values())
        .map((m) => m.rawCitation)
        .sort((a, b) => b.length - a.length);

      for (const raw of sortedRaw) {
        citationTokens.push(raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      }
    }

    const allPatternParts = [
      placeholderPattern,
      ...citationTokens,
      ...(isCitationHighlightActive ? [PARENTHETICAL_CITATION_PATTERN, NARRATIVE_CITATION_PATTERN] : []),
    ];

    const combinedRegex = new RegExp(`(${allPatternParts.join('|')})`, 'g');
    const parts = text.split(combinedRegex);

    return parts.map((part, pIdx) => {
      if (!part) return null;

      if (part.startsWith('[REFERENSI DIPERLUKAN') || part.startsWith('[DATA LOKAL')) {
        return (
          <span
            key={`${keyPrefix}-ph-${pIdx}`}
            className="text-amber-800 bg-amber-50 px-1 py-0.5 rounded text-xs border border-amber-300 font-sans font-semibold inline-block align-baseline"
            title="Bagian ini memerlukan rujukan primer asli atau data lapangan"
          >
            {part}
          </span>
        );
      }

      // Academic In-Text Citation (detected by regex e.g. '(Nama, Tahun)' or citation map)
      const isCitation =
        isCitationHighlightActive &&
        (citationMatchesMap.has(part) ||
          citationMatchesMap.has(part.toLowerCase()) ||
          isAcademicCitationString(part));

      if (isCitation) {
        const matchItem = citationMatchesMap.get(part) || citationMatchesMap.get(part.toLowerCase());

        return (
          <span
            key={`${keyPrefix}-cit-${pIdx}`}
            onClick={(e) => {
              e.stopPropagation();
              if (matchItem) {
                onCitationClick(matchItem);
              }
            }}
            className="text-emerald-700 font-medium cursor-pointer hover:underline decoration-emerald-500/50 transition-colors"
            title={
              matchItem
                ? `Sitasi Ilmiah: ${matchItem.rawCitation}${matchItem.isMatched ? ' (Terdaftar di Daftar Pustaka)' : ' (Klik untuk sinkronisasi)'}`
                : `Sitasi Ilmiah: ${part}`
            }
          >
            {part}
          </span>
        );
      }

      return part;
    });
  };

  // Helper to render academic table item conforming to thesis standard
  const renderAcademicTable = (tableData: AcademicTableData, keyVal: string | number) => {
    const { title, headers, rows, source, studentGuide } = tableData;
    return (
      <div key={keyVal} className="my-5 select-text font-serif not-italic">
        {title && (
          <div className="font-bold text-slate-900 text-[11pt] tracking-tight pb-1.5 flex items-center justify-between">
            <span>{title}</span>
            <span className="text-[9pt] font-sans font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Format Tabel Akademik
            </span>
          </div>
        )}

        <div className="overflow-x-auto rounded-xs border-t-2 border-b-2 border-slate-900 shadow-2xs my-1 bg-white">
          <table className="w-full border-collapse text-[10pt] text-left">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-50/90 text-slate-900">
                {headers.map((h, hIdx) => (
                  <th
                    key={hIdx}
                    className="px-3.5 py-2.5 font-bold text-slate-900 text-center tracking-tight border-r border-slate-200/60 last:border-r-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={`border-b border-slate-200 transition-colors ${
                    rIdx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'
                  } hover:bg-sky-50/40`}
                >
                  {headers.map((_, cIdx) => {
                    const cell = row[cIdx] || '';
                    const subParts = cell.split(/<br\s*\/?>/i);
                    const isCenter = cIdx === 0 && cell.length <= 4;
                    return (
                      <td
                        key={cIdx}
                        className={`px-3.5 py-2 align-top text-slate-800 leading-snug border-r border-slate-100 last:border-r-0 ${
                          isCenter ? 'text-center' : 'text-left'
                        }`}
                      >
                        {subParts.length > 1 ? (
                          <div className="space-y-0.5">
                            {subParts.map((part, pIdx) => (
                              <div key={pIdx}>{part.trim()}</div>
                            ))}
                          </div>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {source && (
          <p className="text-[9.5pt] italic text-slate-600 mt-1 font-serif">
            {source}
          </p>
        )}

        {studentGuide && studentGuide.length > 0 && (
          <div className="mt-2.5 p-3 rounded-lg bg-gradient-to-r from-sky-50 to-blue-50/60 border border-sky-200 text-sky-950 font-sans shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-sky-900 text-[11px] mb-1">
              <span className="text-sm select-none">💡</span>
              <span>{studentGuide[0].replace(/^[-*•\d.]+\s*/, '')}</span>
            </div>
            {studentGuide.length > 1 && (
              <ul className="space-y-1 pl-4 list-disc text-sky-800 text-[10.5px] leading-relaxed">
                {studentGuide.slice(1).map((g, gIdx) => (
                  <li key={gIdx}>{g.replace(/^[-*•\d.]+\s*/, '')}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="bg-white text-slate-900 shadow-2xl rounded-xs relative border border-slate-300 transition-all"
      style={{
        width: '794px',
        minHeight: '1123px',
        paddingTop: '113px',
        paddingBottom: '113px',
        paddingLeft: '151px',
        paddingRight: '113px',
        fontFamily: fontFamily === 'Times New Roman' ? '"Times New Roman", Times, Georgia, serif' : fontFamily,
        fontSize: `${fontSizePt}pt`,
        lineHeight: lineSpacing,
      }}
    >
      {/* WORD HEADER (Running Head in 3cm top margin) */}
      {!suppressRunningHead ? (
        <div className="absolute top-5 left-[151px] right-[113px] flex items-center justify-between text-[10pt] text-slate-400 border-b border-slate-200/80 pb-1.5 select-none font-sans">
          <span className="truncate max-w-[380px] italic">
            {tentativeTitle || topic || 'Karya Ilmiah'}
          </span>
          <span className="text-[9pt] font-semibold uppercase tracking-wider text-slate-400">
            {degreeLevel || 'S1'} • {studyProgram || 'Akademik'}
          </span>
        </div>
      ) : (
        <div className="absolute top-5 left-[151px] right-[113px] flex items-center justify-end text-[9pt] text-slate-400/60 select-none font-sans">
          <span className="text-[8.5pt] uppercase tracking-wider italic text-slate-400/70">
            {page.chapterHeading || 'Awal Bab'}
          </span>
        </div>
      )}

      {/* PAGE BODY CONTENT */}
      <div
        className="space-y-2"
        style={{
          textAlign: textAlign === 'justify' ? 'justify' : textAlign,
          textJustify: textAlign === 'justify' ? 'inter-word' : undefined,
        }}
      >
        {pageItems.map((item, itemIdx) => {
          if (item.type === 'chapter_title') {
            return (
              <div key={itemIdx} className="text-center pt-2 pb-5 space-y-1">
                <h2
                  className="font-bold uppercase text-slate-950 tracking-wider font-serif"
                  style={{ fontSize: `${fontSizePt + 2}pt`, lineHeight: 1.35 }}
                >
                  {item.text}
                </h2>
                {item.subText && (
                  <h3
                    className="font-bold uppercase text-slate-950 tracking-wider font-serif"
                    style={{ fontSize: `${fontSizePt + 2}pt`, lineHeight: 1.35 }}
                  >
                    {item.subText}
                  </h3>
                )}
              </div>
            );
          }

          if (item.type === 'h1') {
            return (
              <div key={itemIdx} className="text-center pt-3 pb-3">
                <h2
                  className="font-bold uppercase text-slate-950 tracking-wide font-serif"
                  style={{ fontSize: `${fontSizePt + 2}pt`, lineHeight: 1.35 }}
                >
                  {item.text}
                </h2>
              </div>
            );
          }

          if (item.type === 'h2') {
            return (
              <div key={itemIdx} className="pt-3 pb-1">
                <h3
                  className="font-bold text-slate-950 font-serif"
                  style={{ fontSize: `${fontSizePt}pt`, lineHeight: 1.4 }}
                >
                  {item.text}
                </h3>
              </div>
            );
          }

          if (item.type === 'h3') {
            return (
              <div key={itemIdx} className="pt-2 pb-1">
                <h4
                  className="font-bold italic text-slate-900 font-serif"
                  style={{ fontSize: `${fontSizePt}pt`, lineHeight: 1.4 }}
                >
                  {item.text}
                </h4>
              </div>
            );
          }

          if (item.type === 'quote') {
            return (
              <blockquote
                key={itemIdx}
                className="my-3 mx-6 pl-4 border-l-2 border-slate-400 italic text-slate-800"
                style={{ fontSize: `${fontSizePt - 1}pt`, lineHeight: 1.25 }}
              >
                {item.text}
              </blockquote>
            );
          }

          if (item.type === 'divider') {
            return <hr key={itemIdx} className="my-4 border-slate-200" />;
          }

          if (item.type === 'bullet') {
            return (
              <div key={itemIdx} className="pl-6 text-slate-900 flex items-start gap-2">
                <span className="font-bold select-none">•</span>
                <span className="flex-1">{renderTextWithCitationHighlights(item.text, `page-${pageNumber}-bullet-${itemIdx}`)}</span>
              </div>
            );
          }

          if (item.type === 'table' && item.tableData) {
            return renderAcademicTable(item.tableData, itemIdx);
          }

          if (item.isBibliographyEntry) {
            return (
              <p
                key={itemIdx}
                style={{
                  textIndent: '-1.27cm',
                  paddingLeft: '1.27cm',
                  marginBottom: '0.75rem',
                }}
                className="text-slate-900 leading-relaxed text-left"
              >
                {item.text}
              </p>
            );
          }

          return (
            <p
              key={itemIdx}
              style={{
                textIndent: item.isContinuation ? 0 : '1.27cm',
                marginBottom: '0.6rem',
              }}
              className="text-slate-900 leading-relaxed"
            >
              {renderTextWithCitationHighlights(item.text, `page-${pageNumber}-${itemIdx}`)}
            </p>
          );
        })}
      </div>

      {/* WORD FOOTER (Page Number in bottom 3cm margin) */}
      <div className="absolute bottom-6 left-[151px] right-[113px] flex items-center justify-between text-[10pt] text-slate-400 border-t border-slate-200/80 pt-2 select-none font-sans">
        <span className="text-[9pt] text-slate-400">
          Format Kertas A4 (Margin 4-3-3-3 cm)
        </span>
        <span className="font-semibold text-slate-700 text-xs sm:text-sm font-serif">
          {isChapterStart ? `— ${pageNumber} —` : pageNumber}
        </span>
      </div>
    </div>
  );
});
