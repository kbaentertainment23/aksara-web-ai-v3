import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Copy,
  Download,
  FileDown,
  RefreshCw,
  Sparkles,
  Check,
  Edit3,
  BookmarkPlus,
  AlertTriangle,
  FileText,
  Clock,
  BookOpen,
  BookOpenCheck,
  AlignJustify,
  AlignLeft,
  AlignCenter,
  Maximize2,
  ZoomIn,
  ZoomOut,
  HelpCircle,
  FileCheck2,
  ShieldCheck,
  Wand2,
  X,
  ChevronRight,
  ListChecks,
  CheckCircle2,
  Stamp,
  Search,
  Plus,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import {
  AcademicFormData,
  calculateAcademicStats,
  evaluateAcademicQuality,
  auditResearchConsistency,
  performInternalEditorialPolish,
  auditChapterCompleteness,
  crossCheckCitationsWithBibliography,
  CitationMatchItem,
  addEntryToBibliography,
  addAllMissingEntriesToBibliography,
  reconcileDocumentCitationsAndBibliography,
  generateSuggestedBibliographyEntry,
  splitPreliminaryPagesAndBody,
  insertOrReplacePreliminaryPage,
  removePreliminarySheet,
  PreliminaryPartType,
  ParsedPreliminarySheet,
  cleanAcademicMarkdownSymbols,
  AcademicTableData,
  parseMarkdownTableLines,
  AUTOSAVE_STORAGE_KEY,
  createAutoSavePayload,
  paginateAcademicItems,
  PaginatedPage,
  formatRomanPageNumber,
  extractChapterInfo,
  isMajorCenteredAcademicTitle,
  extractAndNormalizeBibliographyEntries,
} from '../utils/academicRules.ts';
import { downloadBlob } from '../utils/fileDownload.ts';
import { PreliminaryPagesModal, PreliminarySheetTab } from './PreliminaryPagesModal.tsx';
import { CitationScannerModal } from './editor/CitationScannerModal.tsx';
import { WordFormattingToolbar } from './editor/WordFormattingToolbar.tsx';
import { WordStatusBar } from './editor/WordStatusBar.tsx';
import { A4PageSheet } from './editor/A4PageSheet.tsx';
import { A4PreliminarySheet, renderPreliminarySheetContent } from './editor/A4PreliminarySheet.tsx';

interface DocumentEditorProps {
  content: string;
  onContentChange: (newContent: string) => void;
  formData: AcademicFormData;
  onUpdateFormData?: (updated: Partial<AcademicFormData>) => void;
  onRegenerate: () => void;
  onRefine?: (instruction: string) => void;
  onSaveToHistory: () => void;
  isLoading: boolean;
  isSaved: boolean;
}

export type ViewMode = 'pages' | 'continuous' | 'edit';

export interface ParsedAcademicItem {
  type: 'chapter_title' | 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet' | 'divider' | 'quote' | 'table';
  text: string;
  subText?: string;
  wordCount: number;
  tableData?: AcademicTableData;
  isBibliographyEntry?: boolean;
}

/**
 * Pola regex deteksi sitasi akademik standar (misalnya: '(Nama, Tahun)', '(Nama & Rekan, Tahun)', dsb.)
 * 1. Sitasi dalam tanda kurung (parenthetical): e.g. '(Robbins & Judge, 2019)', '(Sugiyono, 2021)', '(BPS, 2024)'
 * 2. Sitasi naratif: e.g. 'Robbins & Judge (2019)', 'Sugiyono (2021)'
 */
export const PARENTHETICAL_CITATION_PATTERN =
  '\\((?:(?!(?:Tabel|Gambar|Lampiran|Halaman|Hal|Bagan|Grafik|Tahun|Bab|Pasal|Ayat)\\b)[^()\\n]+?,\\s*[12][90]\\d{2}[a-z]?(?:;\\s*(?!(?:Tabel|Gambar|Lampiran|Halaman|Hal|Bagan|Grafik|Tahun|Bab|Pasal|Ayat)\\b)[^()\\n]+?,\\s*[12][90]\\d{2}[a-z]?)*(?:[,:]\\s*(?:h|hlm|p|pp)?\\.?\\s*\\d+(?:-\\d+)?)?)\\)';

export const NARRATIVE_CITATION_PATTERN =
  '\\b(?!(?:Tabel|Gambar|Lampiran|Halaman|Hal|Bagan|Grafik|Tahun|Bab|Pasal|Ayat|Menurut|Berdasarkan|Sebagaimana|Dalam|Sesuai|Mengacu|Kata|Dikutip|Penelitian|Studi|Temuan|Teori|Konsep|Model|Pendapat|Argumen|Pernyataan|Definisi)\\b)[A-Z][A-Za-z0-9\'’.-]+(?:\\s+(?:&|dan|and|dkk\\.?|et\\s+al\\.?|[A-Z][A-Za-z0-9\'’.-]+)){0,3}\\s+\\([12][90]\\d{2}[a-z]?(?:[,:]\\s*(?:h|hlm|p|pp)?\\.?\\s*\\d+(?:-\\d+)?)?\\)';

export const ACADEMIC_CITATION_REGEX = new RegExp(
  `(${PARENTHETICAL_CITATION_PATTERN}|${NARRATIVE_CITATION_PATTERN})`,
  'g'
);

const parenExactRegex = new RegExp(`^${PARENTHETICAL_CITATION_PATTERN}$`);
const narrExactRegex = new RegExp(`^${NARRATIVE_CITATION_PATTERN}$`);

export const isAcademicCitationString = (str: string): boolean => {
  if (!str || str.length < 5) return false;
  return parenExactRegex.test(str.trim()) || narrExactRegex.test(str.trim());
};

const renderPreliminarySheetInner = (
  sheet: ParsedPreliminarySheet,
  _formData: AcademicFormData,
  fontSizePt: number,
  lineSpacing: number
) => renderPreliminarySheetContent(sheet, fontSizePt, lineSpacing);


export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  content,
  onContentChange,
  formData,
  onUpdateFormData,
  onRegenerate,
  onRefine,
  onSaveToHistory,
  isLoading,
  isSaved,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('pages');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const [exportStepNotice, setExportStepNotice] = useState<string>('');

  // Auto-editorial, preliminary pages, and audit modal states
  const [isPreliminaryModalOpen, setIsPreliminaryModalOpen] = useState<boolean>(false);
  const [modalInitialTab, setModalInitialTab] = useState<PreliminarySheetTab>('all');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [auditTab, setAuditTab] = useState<
    'kelengkapan_bab' | 'sitasi_pustaka' | 'kualitas' | 'benang_merah' | 'data_empiris' | 'variasi_kalimat'
  >('kelengkapan_bab');
  const [isAutoPolishing, setIsAutoPolishing] = useState<boolean>(false);
  const [autoPolishNotice, setAutoPolishNotice] = useState<string>('');

  // Split preliminary sheets (Cover, Persetujuan, Pengesahan, Pernyataan) from body content
  const { sheets: prelimSheets, bodyContent } = useMemo(() => {
    return splitPreliminaryPagesAndBody(content, formData);
  }, [content, formData]);

  // Word formatting toolbar states
  const [fontFamily, setFontFamily] = useState<'Times New Roman' | 'Arial' | 'Calibri'>('Times New Roman');
  const [fontSizePt, setFontSizePt] = useState<number>(12);
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [textAlign, setTextAlign] = useState<'justify' | 'left' | 'center'>('justify');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Word margin ruler (4-3-3-3 cm) responsive visibility state:
  // Automatically closed (hidden) on mobile screens (< 640px)
  // Automatically open (visible by default) on tablet/desktop (>= 640px)
  // Supports manual toggle open/close by user on any device
  const [manualRulerOverride, setManualRulerOverride] = useState<boolean | null>(null);
  const [isDesktopScreen, setIsDesktopScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(min-width: 640px)');
    const handleScreenChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktopScreen(e.matches);
    };

    setIsDesktopScreen(mql.matches);

    if (mql.addEventListener) {
      mql.addEventListener('change', handleScreenChange);
      return () => mql.removeEventListener('change', handleScreenChange);
    } else {
      mql.addListener(handleScreenChange);
      return () => mql.removeListener(handleScreenChange);
    }
  }, []);

  const showRuler = manualRulerOverride !== null ? manualRulerOverride : isDesktopScreen;

  // Auto-Save System: 3.5s debounce after typing stops
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [autoSavedTime, setAutoSavedTime] = useState<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(content);
  const lastSavedFormDataRef = useRef<AcademicFormData>(formData);
  const isInitialMountRef = useRef<boolean>(true);

  // Track changes and debounce auto-save 3.5s
  useEffect(() => {
    // Avoid saving on initial mount if content hasn't changed
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      lastSavedContentRef.current = content;
      lastSavedFormDataRef.current = formData;
      return;
    }

    if (!content || content.trim().length === 0) {
      return;
    }

    const hasContentChanged = content !== lastSavedContentRef.current;
    const hasFormChanged = formData !== lastSavedFormDataRef.current;

    if (!hasContentChanged && !hasFormChanged) {
      return;
    }

    // Indicate that changes are pending auto-save
    setAutoSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const payload = createAutoSavePayload(content, formData);
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));
        lastSavedContentRef.current = content;
        lastSavedFormDataRef.current = formData;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setAutoSavedTime(timeStr);
        setAutoSaveStatus('saved');
      } catch (err) {
        console.error('Failed to auto-save to localStorage:', err);
        setAutoSaveStatus('idle');
      }
    }, 3500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, formData]);

  // Flush pending auto-save immediately before page unload
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      if (
        content &&
        content.trim().length > 0 &&
        (content !== lastSavedContentRef.current || formData !== lastSavedFormDataRef.current)
      ) {
        try {
          const payload = createAutoSavePayload(content, formData);
          localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));
        } catch {
          // Ignore sync storage error on unload
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [content, formData]);

  const stats = calculateAcademicStats(content);
  const qualityReport = useMemo(() => evaluateAcademicQuality(content), [content]);
  const consistencyReport = useMemo(() => auditResearchConsistency(formData, content), [formData, content]);
  const chapterAuditReport = useMemo(() => auditChapterCompleteness(formData.jobType, content), [formData.jobType, content]);
  const citationAuditReport = useMemo(
    () => crossCheckCitationsWithBibliography(content, formData.topic || formData.fieldOfStudy),
    [content, formData.topic, formData.fieldOfStudy]
  );

  // Citation scanner & highlighting states
  const [isCitationHighlightActive, setIsCitationHighlightActive] = useState<boolean>(true);
  const [isCitationScannerOpen, setIsCitationScannerOpen] = useState<boolean>(false);
  const [selectedCitationItem, setSelectedCitationItem] = useState<CitationMatchItem | null>(null);
  const [citationFilterTab, setCitationFilterTab] = useState<'all' | 'missing' | 'matched'>('all');
  const [citationSearchQuery, setCitationSearchQuery] = useState<string>('');

  // Fast-lookup map for citations
  const citationMatchesMap = useMemo(() => {
    const map = new Map<string, CitationMatchItem>();
    for (const m of citationAuditReport.matches) {
      map.set(m.rawCitation, m);
      map.set(m.rawCitation.toLowerCase(), m);
    }
    return map;
  }, [citationAuditReport.matches]);

  const handleAddSingleCitation = (item: CitationMatchItem) => {
    const entry =
      item.suggestedBibEntry ||
      generateSuggestedBibliographyEntry(
        item.authorOrRef,
        item.year,
        formData.topic || formData.fieldOfStudy
      );
    const updated = addEntryToBibliography(content, entry);
    onContentChange(updated);
    setAutoPolishNotice(`Sitasi "${item.rawCitation}" berhasil ditambahkan ke Daftar Pustaka!`);
    setTimeout(() => setAutoPolishNotice(''), 4000);
  };

  const handleAddCustomBibEntry = (bibEntry: string, citationText?: string) => {
    const updated = addEntryToBibliography(content, bibEntry);
    onContentChange(updated);
    setAutoPolishNotice(
      citationText
        ? `Berhasil menambahkan pustaka "${citationText}" ke Daftar Pustaka!`
        : 'Berhasil menambahkan jurnal ilmiah ke Daftar Pustaka!'
    );
    setTimeout(() => setAutoPolishNotice(''), 4000);
  };

  const handleAddAllMissingCitations = () => {
    const missingMatches = citationAuditReport.matches.filter((m) => !m.isMatched);
    if (missingMatches.length === 0) return;
    const updated = addAllMissingEntriesToBibliography(
      content,
      missingMatches,
      formData.topic || formData.fieldOfStudy
    );
    onContentChange(updated);
    setAutoPolishNotice(
      `Berhasil menambahkan seluruh ${missingMatches.length} entri sitasi ke Daftar Pustaka!`
    );
    setTimeout(() => setAutoPolishNotice(''), 4000);
  };

  const multipleBibSectionsCount = useMemo(() => {
    if (!content) return 0;
    const matches = content.match(/(?:^|[\n\r]|\\n)(?:#{1,3}\s*)?DAFTAR\s+PUSTAKA/gi);
    return matches ? matches.length : 0;
  }, [content]);

  const handleConsolidateBibliographies = useCallback(() => {
    const topicOrField = formData.studyProgramName || formData.topic || formData.fieldOfStudy || 'Umum';
    const consolidated = reconcileDocumentCitationsAndBibliography(content, topicOrField, true);
    onContentChange(consolidated);
    setAutoPolishNotice('Daftar Pustaka berhasil disatukan di akhir dokumen (Bab I – V) dan diurutkan A–Z!');
    setTimeout(() => setAutoPolishNotice(''), 4500);
  }, [content, formData, onContentChange]);

  const handleAutoEnrichCitations = useCallback(() => {
    const updated = reconcileDocumentCitationsAndBibliography(
      content,
      formData.studyProgramName || formData.topic || formData.fieldOfStudy || 'Umum',
      formData.jobType === 'full_generation' || multipleBibSectionsCount > 1
    );
    onContentChange(updated);
    setAutoPolishNotice(
      'Sitasi ilmiah standar Dikti & Daftar Pustaka APA 7th berhasil disisipkan dan diselaraskan!'
    );
    setTimeout(() => setAutoPolishNotice(''), 4500);
  }, [content, formData, onContentChange, multipleBibSectionsCount]);

  const handleCitationClick = useCallback((item: CitationMatchItem) => {
    setSelectedCitationItem(item);
    setCitationFilterTab(item.isMatched ? 'matched' : 'missing');
    setIsCitationScannerOpen(true);
  }, []);

  // Helper to render academic paragraph text with clean green citation highlights (no block, neat inline typography)
  const renderTextWithCitationHighlights = (text: string, keyPrefix: string | number) => {
    if (!text) return text;

    const hasPlaceholders = text.includes('[REFERENSI DIPERLUKAN') || text.includes('[DATA LOKAL');
    if (!isCitationHighlightActive && !hasPlaceholders) {
      return text;
    }

    const placeholderPattern = '\\[(?:REFERENSI DIPERLUKAN|DATA LOKAL)[^\\]]*\\]';
    const citationTokens: string[] = [];

    if (isCitationHighlightActive && citationAuditReport.matches.length > 0) {
      // Sort descending by rawCitation length to prevent prefix collisions
      const sortedRaw = [...citationAuditReport.matches]
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

      // 1. Placeholder marker for required primary references or empirical data
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

      // 2. Academic In-Text Citation (detected by regex e.g. '(Nama, Tahun)' or citation audit)
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
                setSelectedCitationItem(matchItem);
                setCitationFilterTab(matchItem.isMatched ? 'matched' : 'all');
              }
              setIsCitationScannerOpen(true);
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

  const handleAutoEditorialRefine = async (customInstruction?: string) => {
    try {
      setIsAutoPolishing(true);
      setAutoPolishNotice('Sedang menyunting: membersihkan frasa klise, memperbaiki struktur klausa, & memperhalus alur...');
      const response = await fetch('/api/academic/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          instruction: customInstruction || 'Sempurnakan naskah agar terasa alami, hilangkan semua klise generik, dan variasikan ritme kalimat.',
          formData,
        }),
      });
      const rawText = await response.text();
      let data: any = null;
      if (rawText && !rawText.trim().startsWith('<')) {
        try {
          data = JSON.parse(rawText);
        } catch {}
      }
      if (data?.text) {
        onContentChange(data.text);
        if (data.status === 'partial_fallback' || data.source === 'preserved-original-polished') {
          setAutoPolishNotice(data.message || 'Layanan AI sementara sedang sibuk. Draf asli Anda tetap aman dan telah disempurnakan oleh editor lokal.');
          setTimeout(() => setAutoPolishNotice(''), 5000);
        } else {
          setAutoPolishNotice(data.message || 'Penyuntingan selesai! Naskah telah diperhalus menjadi bahasa akademik alami.');
          setTimeout(() => setAutoPolishNotice(''), 3500);
        }
      } else {
        setAutoPolishNotice(data?.error || 'Layanan AI sementara tidak tersedia. Draf naskah Anda tetap aman dan tidak mengalami perubahan.');
        setTimeout(() => setAutoPolishNotice(''), 4000);
      }
    } catch (err) {
      console.error('Refine error:', err);
      setAutoPolishNotice('Koneksi terputus. Draf naskah Anda tetap aman dan tidak mengalami perubahan.');
      setTimeout(() => setAutoPolishNotice(''), 4000);
    } finally {
      setIsAutoPolishing(false);
    }
  };

  const handleCopy = async () => {
    try {
      const cleanText = cleanAcademicMarkdownSymbols(content, { forClipboard: true });
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleDownloadDocx = async () => {
    if (isExportingDocx || !content) return;
    try {
      setIsExportingDocx(true);
      setExportStepNotice('Memuat modul DOCX...');

      // Dynamic import (lazy loading): docx and docxExporter are only downloaded upon user click
      const { generateDocxBlob } = await import('../utils/docxExporter.ts');

      setExportStepNotice('Menyusun dokumen A4...');
      const filename = `${formData.degreeLevel || 'Skripsi'}_${(formData.tentativeTitle || formData.topic || 'Karya_Ilmiah')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 35)}.docx`;
      const blob = await generateDocxBlob(content, {
        ...formData,
        manualGuidelines: {
          fontFamily,
          fontSize: fontSizePt,
          lineSpacing,
        },
      });
      downloadBlob(blob, filename);
    } catch (e) {
      console.error('Docx export failed', e);
    } finally {
      setIsExportingDocx(false);
      setExportStepNotice('');
    }
  };

  const handleDownloadTxt = () => {
    const filename = `${formData.degreeLevel || 'Skripsi'}_${(formData.tentativeTitle || formData.topic || 'Karya_Ilmiah')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 35)}.md`;
    const cleanText = cleanAcademicMarkdownSymbols(content);
    const blob = new Blob([cleanText], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, filename);
  };

  // Split lines into structured academic items with smart chapter heading pairing
  const parsedParagraphs = useMemo(() => {
    if (!bodyContent || !bodyContent.trim()) return [];
    const cleanBody = cleanAcademicMarkdownSymbols(bodyContent);
    const rawLines = cleanBody.split('\n');
    const items: ParsedAcademicItem[] = [];
    let inBib = false;

    let i = 0;
    while (i < rawLines.length) {
      const raw = rawLines[i];
      const trimmed = raw.trim();
      if (!trimmed) {
        i++;
        continue;
      }

      if (trimmed === '---') {
        items.push({ type: 'divider', text: '', wordCount: 0 });
        i++;
        continue;
      }

      // Check for BAB heading: e.g. "# BAB I", "BAB I", "# BAB 1 - PENDAHULUAN", "# BAB I: PENDAHULUAN"
      const chapterInfo = extractChapterInfo(trimmed);
      if (chapterInfo.isChapter) {
        inBib = false;
        const babNum = chapterInfo.babNumber;
        let babTitle = chapterInfo.babTitle || '';

        // If title wasn't on the same line, check if subsequent line is the chapter title (e.g. "PENDAHULUAN", "# PENDAHULUAN", "## PENDAHULUAN")
        if (!babTitle && i + 1 < rawLines.length) {
          const nextTrimmed = rawLines[i + 1].trim();
          const nextClean = nextTrimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
          if (
            nextTrimmed &&
            nextTrimmed !== '---' &&
            !extractChapterInfo(nextTrimmed).isChapter &&
            !/^(?:#{0,3}\s*)?(?:\d+\.|\d+\.\d+|[A-Z]\.)/i.test(nextTrimmed) &&
            !nextTrimmed.startsWith('|') &&
            !/^[-*•]\s+/.test(nextTrimmed) &&
            nextClean.split(/\s+/).length <= 12
          ) {
            babTitle = nextClean.toUpperCase();
            i++; // consume next line so it doesn't get treated as separate h1 or h2
          }
        }

        const fullWordCount = `${babNum} ${babTitle}`.split(/\s+/).filter(Boolean).length;
        items.push({
          type: 'chapter_title',
          text: babNum,
          subText: babTitle ? babTitle.toUpperCase() : undefined,
          wordCount: fullWordCount,
        });
        i++;
        continue;
      }

      // Check for standalone major centered academic title (e.g. "DAFTAR PUSTAKA", "## DAFTAR PUSTAKA", "ABSTRAK")
      if (isMajorCenteredAcademicTitle(trimmed)) {
        const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim().toUpperCase();
        const isBibHeading =
          cleanTitle.includes('DAFTAR PUSTAKA') ||
          cleanTitle.includes('BIBLIOGRAPHY') ||
          cleanTitle.includes('REFERENSI');

        items.push({
          type: 'h1',
          text: cleanTitle,
          wordCount: cleanTitle.split(/\s+/).length,
        });
        i++;

        if (isBibHeading) {
          const bibLines: string[] = [];
          while (i < rawLines.length) {
            const nextRaw = rawLines[i];
            const nextTrim = nextRaw.trim();
            if (nextTrim === '---') {
              if (i + 1 < rawLines.length) {
                const afterDivider = rawLines[i + 1].trim();
                if (extractChapterInfo(afterDivider).isChapter || isMajorCenteredAcademicTitle(afterDivider)) {
                  break;
                }
              }
            }
            if (nextTrim && (extractChapterInfo(nextTrim).isChapter || (isMajorCenteredAcademicTitle(nextTrim) && !nextTrim.toUpperCase().includes('DAFTAR PUSTAKA')))) {
              break;
            }
            bibLines.push(nextRaw);
            i++;
          }

          const normalizedEntries = extractAndNormalizeBibliographyEntries(bibLines.join('\n'));
          for (const entry of normalizedEntries) {
            items.push({
              type: 'paragraph',
              text: entry,
              wordCount: entry.split(/\s+/).length,
              isBibliographyEntry: true,
            });
          }
          inBib = false;
        } else {
          inBib = false;
        }
        continue;
      }

      // Check for table or table preceded by official title
      const isTableTitle = /^(?:\*\*)?Tabel\s+[0-9IVXLCDM]+(?:\.[0-9]+)?[:\s\-–]/i.test(trimmed);
      const nextIsTable = i + 1 < rawLines.length && rawLines[i + 1].trim().startsWith('|');

      if ((isTableTitle && nextIsTable) || trimmed.startsWith('|')) {
        const tableLines: string[] = [];
        if (isTableTitle && nextIsTable) {
          tableLines.push(trimmed);
          i++;
        }
        while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
          tableLines.push(rawLines[i].trim());
          i++;
        }
        while (i < rawLines.length) {
          const nextTrim = rawLines[i].trim();
          if (!nextTrim) {
            if (
              i + 1 < rawLines.length &&
              (/^(?:\*|_)?Sumber\s*:/i.test(rawLines[i + 1].trim()) ||
                /^(?:\*|_)?(?:Catatan\s+)?Panduan\s+(?:Mahasiswa|Pengisian)/i.test(rawLines[i + 1].trim()))
            ) {
              i++;
              continue;
            }
            break;
          }
          if (
            /^(?:\*|_)?Sumber\s*:/i.test(nextTrim) ||
            /^(?:\*|_)?(?:Catatan\s+)?Panduan\s+(?:Mahasiswa|Pengisian)/i.test(nextTrim) ||
            (/^(?:[-*•]|\d+\.)\s+/.test(nextTrim) && tableLines.some((l) => /Panduan/i.test(l)))
          ) {
            tableLines.push(nextTrim);
            i++;
          } else {
            break;
          }
        }

        const tableData = parseMarkdownTableLines(tableLines);
        if (tableData) {
          items.push({
            type: 'table',
            text: tableData.title || 'Tabel',
            wordCount: 75,
            tableData,
          });
        } else {
          const cleanTableProse = tableLines
            .filter((l) => !/^\|[\s:\-|]+\|$/.test(l))
            .map((l) =>
              l
                .split('|')
                .map((c) => c.trim())
                .filter(Boolean)
                .join(' — ')
            )
            .filter(Boolean)
            .join('\n');
          if (cleanTableProse) {
            items.push({
              type: 'paragraph',
              text: cleanTableProse,
              wordCount: cleanTableProse.split(/\s+/).length,
              isBibliographyEntry: inBib,
            });
          }
        }
        continue;
      }

      // Check for headings of any level (#, ##, ###, ####, #####)
      const headingMatch = trimmed.match(/^(#{1,6})\s*(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2].replace(/\*\*/g, '').replace(/\*/g, '').trim();
        const upperHeading = headingText.toUpperCase();
        if (upperHeading.includes('DAFTAR PUSTAKA') || upperHeading.includes('BIBLIOGRAPHY') || upperHeading.includes('REFERENSI')) {
          inBib = true;
        } else if (upperHeading.startsWith('BAB ') || isMajorCenteredAcademicTitle(upperHeading)) {
          inBib = false;
        }

        if (level === 1) {
          items.push({
            type: 'h1',
            text: headingText,
            wordCount: headingText.split(/\s+/).length,
          });
        } else if (level === 2) {
          items.push({
            type: 'h2',
            text: headingText,
            wordCount: headingText.split(/\s+/).length,
          });
        } else {
          items.push({
            type: 'h3',
            text: headingText,
            wordCount: headingText.split(/\s+/).length,
          });
        }
        i++;
        continue;
      }

      if (trimmed.startsWith('> ')) {
        const text = trimmed.replace(/^>\s+/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
        items.push({
          type: 'quote',
          text,
          wordCount: text.split(/\s+/).length,
        });
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
        const text = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
        items.push({
          type: inBib ? 'paragraph' : 'bullet',
          text,
          wordCount: text.split(/\s+/).length,
          isBibliographyEntry: inBib,
        });
      } else {
        // Clean any rogue leading markdown symbols like '# ', '## ', or lone '|'
        let cleanPara = trimmed
          .replace(/^#+\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '');

        // Skip unparsed standalone table divider rows: | :--- | :--- |
        if (/^\|[\s:\-|]+\|$/.test(cleanPara)) {
          i++;
          continue;
        }

        // If paragraph line is a raw pipe table row, strip pipes
        if (cleanPara.startsWith('|') && cleanPara.endsWith('|')) {
          cleanPara = cleanPara
            .split('|')
            .map((c) => c.trim())
            .filter(Boolean)
            .join(' — ');
        }

        items.push({
          type: 'paragraph',
          text: cleanPara,
          wordCount: cleanPara.split(/\s+/).length,
          isBibliographyEntry: inBib,
        });
      }
      i++;
    }
    return items;
  }, [bodyContent]);

  // Paginate content across authentic A4 paper sheets (~34-36 lines per page at 1.5 spacing)
  // with strict orphan heading prevention & margin 4-3-3-3 cm compliance
  const pages: PaginatedPage[] = useMemo(() => {
    if (parsedParagraphs.length === 0) {
      return prelimSheets.length > 0
        ? []
        : [
            {
              pageIndex: 0,
              pageNumber: 1,
              isChapterStart: false,
              suppressRunningHead: false,
              items: [],
              linesUsed: 0,
              maxLineCapacity: 35,
            },
          ];
    }

    return paginateAcademicItems(parsedParagraphs, {
      fontSizePt,
      lineSpacing,
    });
  }, [parsedParagraphs, fontSizePt, lineSpacing, prelimSheets.length]);

  const renderAcademicTableItem = (item: ParsedAcademicItem, keyVal: React.Key) => {
    if (!item.tableData) return null;
    const { title, headers, rows, source, studentGuide } = item.tableData;

    return (
      <div key={keyVal} className="my-5 select-text font-serif not-italic">
        {/* Table Title (Official Academic Formatting, Left-aligned, Bold) */}
        {title && (
          <div className="font-bold text-slate-900 text-[11pt] tracking-tight pb-1.5 flex items-center justify-between">
            <span>{title}</span>
            <span className="text-[9pt] font-sans font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Format Tabel Akademik
            </span>
          </div>
        )}

        {/* Table Element conforming to Indonesian Thesis Standard: Strong Top/Bottom lines, No Vertical Lines */}
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

        {/* Table Source */}
        {source && (
          <p className="text-[9.5pt] italic text-slate-600 mt-1 font-serif">
            {source}
          </p>
        )}

        {/* Educational "Panduan Mahasiswa: Data yang Harus Dicari & Disiapkan" Banner */}
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
    <div className="bg-slate-200/90 rounded-2xl border border-slate-300 shadow-md flex flex-col">
      {/* 1. BILAH ALAT UTAMA: COMMAND RIBBON & WORD FORMATTING TOOLBAR (STICKY TOP-13 SM:TOP-14 Z-20) */}
      <div className="sticky top-13 sm:top-14 z-20 bg-white border-b border-slate-200 shadow-md rounded-t-2xl">
        {/* Main Header Row */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#2B579A] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              W
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-[#1E3A5F] truncate">
                  Microsoft Word – Tampilan Karya Ilmiah
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  Format Standar Dikti
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-sm">
                {[
                  formData.degreeLevel,
                  formData.studyProgramName || formData.studyProgramCategory,
                  formData.tentativeTitle || formData.topic,
                ]
                  .filter(Boolean)
                  .join(' • ') || 'Draf Naskah Akademik Standar Dikti'}
              </p>
            </div>
          </div>

          {/* Quick Action Toolbar - Organized into Cohesive Functional Clusters */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scroll-smooth no-scrollbar sm:flex-wrap">
            {/* Kluster 1: Mode Tampilan Lembar Dokumen */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('pages')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'pages'
                    ? 'bg-white text-[#2B579A] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan per lembar kertas A4 terpisah (Print Layout)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Per Lembar A4</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('continuous')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'continuous'
                    ? 'bg-white text-[#2B579A] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan bersambung fleksibel (Continuous flow)"
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Alur Bersambung</span>
                <span className="sm:hidden">Bersambung</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-white text-[#2B579A] font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mode edit naskah langsung"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Teks</span>
              </button>
            </div>

            <div className="hidden md:block h-6 w-px bg-slate-200" />

            {/* Kluster 2: Fitur & Asistensi Akademik */}
            <div className="flex items-center gap-1.5 bg-slate-50/90 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setAuditTab('kelengkapan_bab');
                  setIsAuditModalOpen(true);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-emerald-200/90 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Audit kelengkapan bab standar kampus, keselarasan sitasi, dan mutu akademik"
              >
                <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
                <span>Checklist Bab</span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-800">
                  {chapterAuditReport.completenessScore}%
                </span>
              </button>

              {/* Pindai Sitasi & Keselarasan Daftar Pustaka */}
              <button
                type="button"
                onClick={() => {
                  setCitationFilterTab(citationAuditReport.missingFromBibliography.length > 0 ? 'missing' : 'all');
                  setIsCitationScannerOpen(true);
                }}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  citationAuditReport.missingFromBibliography.length > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                    : citationAuditReport.totalCitations === 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-white border-teal-200/90 text-teal-800 hover:bg-teal-50'
                }`}
                title="Pindai keselarasan sitasi teks dengan Daftar Pustaka (APA 7th)"
              >
                <BookOpenCheck
                  className={`w-3.5 h-3.5 ${
                    citationAuditReport.missingFromBibliography.length > 0
                      ? 'text-rose-600'
                      : citationAuditReport.totalCitations === 0
                      ? 'text-amber-600'
                      : 'text-teal-600'
                  }`}
                />
                <span className="hidden sm:inline">Pindai Sitasi</span>
                <span className="sm:hidden">Sitasi</span>
                {citationAuditReport.missingFromBibliography.length > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-md bg-rose-200 text-[10px] font-bold text-rose-900 animate-pulse">
                    {citationAuditReport.missingFromBibliography.length} Hilang
                  </span>
                ) : citationAuditReport.totalCitations === 0 ? (
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-200 text-[10px] font-bold text-amber-900">
                    Belum Ada
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-md bg-teal-100 text-[10px] font-bold text-teal-800">
                    {citationAuditReport.matchRate}%
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalInitialTab('all');
                  setIsPreliminaryModalOpen(true);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-sky-200/90 text-sky-800 hover:bg-sky-50 hover:border-sky-300 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Generator Halaman Sampul Resmi, Lembar Persetujuan Pembimbing, dan Pernyataan Keaslian"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Sampul & Pengesahan</span>
                <span className="sm:hidden">Sampul</span>
                {prelimSheets.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-sky-100 text-[10px] font-bold text-sky-800 border border-sky-200">
                    {prelimSheets.length} Lembar
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleAutoEditorialRefine()}
                disabled={isAutoPolishing || isLoading}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-indigo-200/90 text-indigo-800 hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                title="Penyuntingan otomatis untuk menghilangkan frasa kaku, repetisi, dan klise generik"
              >
                <Wand2 className={`w-3.5 h-3.5 text-indigo-600 ${isAutoPolishing ? 'animate-spin' : ''}`} />
                <span>{isAutoPolishing ? 'Menyunting...' : 'Poles Naskah'}</span>
              </button>
            </div>

            <div className="hidden lg:block h-6 w-px bg-slate-200" />

            {/* Kluster 3: Manajemen & Ekspor Dokumen */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onSaveToHistory}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title="Simpan proyek ke riwayat lokal"
              >
                <BookmarkPlus className={`w-3.5 h-3.5 ${isSaved ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span>{isSaved ? 'Tersimpan' : 'Simpan'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Salin seluruh isi naskah ke clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin</span>
                  </>
                )}
              </button>

              {/* Ekspor Utama: DOCX Word */}
              <div className="inline-flex rounded-lg shadow-xs overflow-hidden border border-[#1E3F73]">
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  disabled={isExportingDocx || !content}
                  className="px-3 py-1.5 text-xs font-bold bg-[#2B579A] hover:bg-[#1E3F73] text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                  title="Unduh file .docx Word asli dengan margin 4-3-3-3 cm (Kiri 4cm, Atas 3cm, Kanan 3cm, Bawah 3cm)"
                  aria-busy={isExportingDocx}
                >
                  {isExportingDocx ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-sky-200 animate-spin shrink-0" />
                      <span>{exportStepNotice || 'Menyiapkan DOCX...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-sky-200 shrink-0" />
                      <span>Unduh DOCX</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="px-2 py-1.5 text-xs font-medium bg-[#244982] hover:bg-[#1E3F73] text-white border-l border-white/20 transition-colors cursor-pointer"
                  title="Unduh file teks Markdown (.md)"
                >
                  <FileDown className="w-3.5 h-3.5 text-sky-200" />
                </button>
              </div>

              {/* Buat Ulang / Refresh */}
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isLoading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Buat ulang naskah"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. WORD FORMATTING CONTROLS (Font, Size, Spacing, Align, Ruler, Zoom) */}
        <WordFormattingToolbar
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          fontSizePt={fontSizePt}
          setFontSizePt={setFontSizePt}
          lineSpacing={lineSpacing}
          setLineSpacing={setLineSpacing}
          textAlign={textAlign}
          setTextAlign={setTextAlign}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          isCitationHighlightActive={isCitationHighlightActive}
          setIsCitationHighlightActive={setIsCitationHighlightActive}
          missingCitationsCount={citationAuditReport.missingFromBibliography.length}
          showRuler={showRuler}
          onToggleRuler={() => setManualRulerOverride(!showRuler)}
        />
      </div>

      {/* 2. SIMULATED MICROSOFT WORD RULER (PENGGARIS 0 - 21 cm) */}
      {showRuler && viewMode !== 'edit' && (
        <div className="flex items-center justify-center bg-slate-100 border-b border-slate-300 py-1 px-4 select-none overflow-x-auto no-scrollbar">
          <div className="w-[794px] flex items-center justify-between text-[9px] text-slate-400 font-mono tracking-widest relative">
            {/* Margin highlight on ruler: Left 4cm (gray), Content 14cm (white), Right 3cm (gray) */}
            <div className="w-[151px] h-4 bg-slate-300/80 rounded-l flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
              4 cm (Kiri)
            </div>
            <div className="flex-1 h-4 bg-white border-y border-slate-300 flex items-center justify-around px-2 text-slate-600">
              <span>|</span><span>1</span><span>|</span><span>2</span><span>|</span><span>3</span>
              <span>|</span><span>4</span><span>|</span><span>5</span><span>|</span><span>6</span>
              <span>|</span><span>7</span><span>|</span><span>8</span><span>|</span><span>9</span>
              <span>|</span><span>10</span><span>|</span><span>11</span><span>|</span><span>12</span>
              <span>|</span><span>13</span><span>|</span><span>14</span>
            </div>
            <div className="w-[113px] h-4 bg-slate-300/80 rounded-r flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
              3 cm (Kanan)
            </div>
          </div>
        </div>
      )}

      {/* Auto-Polish Notification Toast */}
      {autoPolishNotice && (
        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-200 text-indigo-900 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-medium">{autoPolishNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAutoPolishNotice('')}
            className="text-indigo-400 hover:text-indigo-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Cliché Detection Alert Banner */}
      {qualityReport.cliches.length > 0 && !isAutoPolishing && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Terdeteksi <strong>{qualityReport.cliches.length} frasa klise generik</strong> (misal: <em>"{qualityReport.cliches[0].foundText}"</em>).
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAutoEditorialRefine()}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors shadow-2xs"
            >
              Poles Otomatis (Anti-Klise)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuditTab('kualitas');
                setIsAuditModalOpen(true);
              }}
              className="text-[11px] text-amber-800 underline hover:text-amber-950 font-medium"
            >
              Lihat Detail
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN WORKSPACE CANVAS (PRINT LAYOUT A4 SHEETS) */}
      <div className="p-2 sm:p-6 lg:p-8 overflow-x-auto w-full flex flex-col items-center justify-start min-h-[500px] sm:min-h-[700px] bg-slate-300/60 touch-auto">
        {/* Zero Citations & Missing Bibliography Notice Banner */}
        {citationAuditReport.totalCitations === 0 && bodyContent.trim().length > 150 && viewMode !== 'edit' && (
          <div className="w-full max-w-[794px] mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 via-white to-sky-50 border border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in select-text">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700 mt-0.5 shrink-0 border border-amber-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-950">
                    Naskah Belum Memuat Sitasi Ilmiah & Daftar Pustaka
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white shadow-2xs">
                    Standar Dikti
                  </span>
                </div>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Sesuai pedoman akademik Dikti, naskah bab wajib memuat rujukan teori (Das Sollen), data fakta lokus (Das Sein), dan literatur terdahulu yang terhubung ke <strong>## DAFTAR PUSTAKA</strong> (APA 7th).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0 justify-end flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleAutoEnrichCitations}
                className="px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Sisipkan sitasi ilmiah standar Dikti & buat Daftar Pustaka otomatis"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Sisipkan Sitasi & Daftar Pustaka</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCitationFilterTab('all');
                  setIsCitationScannerOpen(true);
                }}
                className="px-3 py-2 text-xs font-semibold bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Pelajari Rincian
              </button>
            </div>
          </div>
        )}

        {/* Missing In-Text Citations Alert Banner */}
        {citationAuditReport.missingFromBibliography.length > 0 && viewMode !== 'edit' && (
          <div className="w-full max-w-[794px] mb-6 p-4 rounded-xl bg-gradient-to-r from-rose-50 via-white to-amber-50 border border-rose-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in select-text">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600 mt-0.5 shrink-0 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-rose-900">
                    Peringatan Keselarasan Sitasi Teks & Daftar Pustaka
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                    {citationAuditReport.missingFromBibliography.length} Sitasi Belum Terdaftar
                  </span>
                </div>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                  Ditemukan kutipan dalam naskah yang belum terdaftar di <strong>## DAFTAR PUSTAKA</strong>. Seluruh kutipan tersebut ditandai merah (<em>⚠️ Belum Terdaftar</em>) pada lembar naskah di bawah.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0 justify-end flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleAddAllMissingCitations}
                className="px-3.5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Format otomatis sesuai kaidah APA 7th dan tambahkan ke Daftar Pustaka"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Lengkapi Otomatis ({citationAuditReport.missingFromBibliography.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCitationFilterTab('missing');
                  setIsCitationScannerOpen(true);
                }}
                className="px-3 py-2 text-xs font-semibold bg-white border border-rose-300 text-rose-800 hover:bg-rose-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Tinjau Rincian
              </button>
            </div>
          </div>
        )}

        {/* Multi-Chapter Split Bibliography Banner */}
        {multipleBibSectionsCount > 1 && viewMode !== 'edit' && (
          <div className="w-full max-w-[794px] mb-6 p-4 rounded-xl bg-gradient-to-r from-sky-50 via-white to-indigo-50 border border-sky-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in select-text">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-sky-100 rounded-lg text-sky-700 mt-0.5 shrink-0 border border-sky-200">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-sky-950">
                    Standar Naskah Utuh Dikti: Daftar Pustaka Terpisah di Setiap Bab
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white shadow-2xs">
                    {multipleBibSectionsCount} Daftar Pustaka Ditemukan
                  </span>
                </div>
                <p className="text-xs text-sky-800 mt-1 leading-relaxed">
                  Ditemukan bagian Daftar Pustaka di setiap bab. Sesuai pedoman baku skripsi/tesis, naskah utuh (Bab I – V) hanya boleh memiliki <strong>satu Daftar Pustaka terpadu di bagian paling akhir dokumen</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-center shrink-0 justify-end flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleConsolidateBibliographies}
                className="px-3.5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Hapus daftar pustaka di setiap bab dan satukan menjadi satu daftar pustaka terpadu di paling bawah naskah"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Satukan ke Akhir Naskah (1 Klik)</span>
              </button>
            </div>
          </div>
        )}

        {viewMode === 'edit' ? (
          /* RAW TEXTAREA EDIT MODE */
          <div className="w-full max-w-[794px] bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-10">
            <div className="mb-3 pb-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Editor Langsung (Ketik & Perbaiki Teks)</span>
              <span>Perubahan otomatis terformat di Lembar Kertas A4</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={28}
              style={{
                fontFamily: fontFamily === 'Times New Roman' ? '"Times New Roman", Times, Georgia, serif' : fontFamily,
                fontSize: `${fontSizePt}pt`,
                lineHeight: lineSpacing,
              }}
              className="w-full text-slate-900 border-none resize-y focus:outline-none focus:ring-0 leading-relaxed font-serif"
              placeholder="Tulis atau edit naskah akademik Anda di sini..."
            />
          </div>
        ) : viewMode === 'continuous' ? (
          /* CONTINUOUS A4 FLOW (ALUR BERSAMBUNG FLEKSIBEL) */
          <div
            className="flex flex-col items-center transition-transform origin-top w-full overflow-x-auto touch-auto"
            style={{ transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined }}
          >
            <div
              className="bg-white text-slate-900 shadow-2xl rounded-xs relative border border-slate-300 transition-all w-full max-w-[794px] p-5 sm:p-10 md:pt-[113px] md:pb-[113px] md:pl-[151px] md:pr-[113px]"
              style={{
                fontFamily: fontFamily === 'Times New Roman' ? '"Times New Roman", Times, Georgia, serif' : fontFamily,
                fontSize: `${fontSizePt}pt`,
                lineHeight: lineSpacing,
              }}
            >
              {/* Header running head */}
              <div className="flex items-center justify-between text-[10pt] text-slate-400 border-b border-slate-100 pb-2 mb-6 select-none font-sans">
                <span className="truncate max-w-[200px] sm:max-w-[380px] italic">
                  {formData.tentativeTitle || formData.topic || 'Karya Ilmiah'}
                </span>
                <span className="text-[9pt] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
                  {formData.degreeLevel || 'S1'} • {formData.studyProgramName || formData.studyProgramCategory || 'Akademik'}
                </span>
              </div>

              {/* Seamless continuous text flow */}
              <div
                style={{
                  textAlign: textAlign === 'justify' ? 'justify' : textAlign,
                  textJustify: textAlign === 'justify' ? 'inter-word' : undefined,
                }}
              >
                {/* Preliminary Sheets in Continuous View */}
                {prelimSheets.length > 0 && (
                  <div className="space-y-12 mb-12 border-b-2 border-dashed border-slate-300 pb-12">
                    {prelimSheets.map((sheet, sIdx) => (
                      <div key={`cont-prelim-${sheet.type}-${sIdx}`} className="relative pt-4">
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-sky-100 bg-sky-50/70 p-2.5 rounded-lg font-sans">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900">
                            <Stamp className="w-3.5 h-3.5 text-sky-600" />
                            {sheet.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setModalInitialTab(sheet.type);
                                setIsPreliminaryModalOpen(true);
                              }}
                              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Sesuaikan identitas lembar ini"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Sesuaikan</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = removePreliminarySheet(content, sheet.type);
                                onContentChange(updated);
                              }}
                              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Hapus lembar ini dari naskah"
                            >
                              <X className="w-2.5 h-2.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                        <div className="min-h-[700px] flex flex-col justify-between">
                          {renderPreliminarySheetInner(sheet, formData, fontSizePt, lineSpacing)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pages.map((page, pIdx) => {
                  const pageItems = page.items;
                  return (
                    <React.Fragment key={pIdx}>
                      {pIdx > 0 && (
                        <div className="my-8 py-2 flex items-center justify-between text-xs text-slate-400 border-y border-dashed border-slate-300 font-sans select-none bg-slate-50/70 -mx-6 px-6 rounded-xs">
                          <span className="flex items-center gap-1.5 font-semibold text-[#2B579A]">
                            <FileText className="w-3.5 h-3.5 text-[#2B579A]" />
                            Batas Halaman {pIdx} → Halaman {pIdx + 1}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Format Standar A4 (Margin 4-3-3-3 cm)
                          </span>
                        </div>
                      )}
                      <div className="space-y-2">
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
                              <span className="flex-1">{renderTextWithCitationHighlights(item.text, `cont-bullet-${itemIdx}`)}</span>
                            </div>
                          );
                        }
                        if (item.type === 'table') {
                          return renderAcademicTableItem(item, itemIdx);
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
                              className="text-slate-900 leading-relaxed text-justify"
                            >
                              {item.text}
                            </p>
                          );
                        }

                        // STANDARD ACADEMIC PARAGRAPH WITH CITATION & DATA MARKER HIGHLIGHTS
                        return (
                          <p
                            key={itemIdx}
                            style={{
                              textIndent: item.isContinuation ? 0 : '1.27cm',
                              marginBottom: '0.6rem',
                            }}
                            className="text-slate-900 leading-relaxed"
                          >
                            {renderTextWithCitationHighlights(item.text, `cont-${itemIdx}`)}
                          </p>
                        );
                      })}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Bottom footer */}
              <div className="mt-12 pt-3 border-t border-slate-200 flex items-center justify-between text-[9pt] text-slate-400 font-sans select-none">
                <span>Alur Bersambung • Format A4 Standar Dikti (Margin 4-3-3-3 cm)</span>
                <span>Total {pages.length} Halaman Bab</span>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTIC MICROSOFT WORD A4 PAPER SHEETS (PER LEMBAR) */
          <div className="w-full overflow-x-auto touch-auto flex flex-col items-center pb-8">
            <div
              className="flex flex-col items-center gap-8 transition-transform origin-top select-text"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
            {/* 1. Preliminary Sheets as Standalone A4 Pages */}
            {prelimSheets.map((sheet, sIdx) => (
              <A4PreliminarySheet
                key={`page-prelim-${sheet.type}-${sIdx}`}
                sheet={sheet}
                sheetIndex={sIdx}
                fontFamily={fontFamily}
                fontSizePt={fontSizePt}
                lineSpacing={lineSpacing}
                formData={formData}
                onOpenModal={(type: PreliminaryPartType) => {
                  const targetTab: PreliminarySheetTab =
                    type === 'cover_outer' || type === 'all' ? 'cover' : (type as PreliminarySheetTab);
                  setModalInitialTab(targetTab);
                  setIsPreliminaryModalOpen(true);
                }}
                onRemoveSheet={(type: PreliminaryPartType) => {
                  const updated = removePreliminarySheet(content, type);
                  onContentChange(updated);
                }}
              />
            ))}

            {/* 2. Chapter Body Pages */}
            {pages.map((page, pIdx) => (
              <A4PageSheet
                key={pIdx}
                page={page}
                fontFamily={fontFamily}
                fontSizePt={fontSizePt}
                lineSpacing={lineSpacing}
                textAlign={textAlign}
                tentativeTitle={formData.tentativeTitle || ''}
                topic={formData.topic || ''}
                degreeLevel={formData.degreeLevel || 'S1'}
                studyProgram={formData.studyProgramName || formData.studyProgramCategory || 'Akademik'}
                isCitationHighlightActive={isCitationHighlightActive}
                citationMatchesMap={citationMatchesMap}
                onCitationClick={handleCitationClick}
              />
            ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. BOTTOM STATUS BAR (LIKE WORD STATUS BAR) */}
      <WordStatusBar
        prelimSheetsCount={prelimSheets.length}
        pagesCount={pages.length}
        wordCount={stats.wordCount}
        paragraphCount={stats.paragraphCount}
        autoSaveStatus={autoSaveStatus}
        autoSavedTime={autoSavedTime}
        hasContent={Boolean(content && content.trim().length > 0)}
        hasReferenceMarkers={stats.hasReferenceMarkers}
        referenceMarkersCount={stats.referenceMarkersCount}
      />

      {/* 6. AUDIT KUALITAS AKADEMIK & BENANG MERAH MODAL */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92dvh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Audit Kualitas Akademik & Benang Merah Penelitian
                  </h3>
                  <p className="text-xs text-slate-300">
                    Standar 6 Pilar: Gaya Bahasa Natural • 4 Pilar Piramida Terbalik • Zero Hallucination
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Metrics Strip (5 Pillars of Accuracy) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-4 bg-slate-50 border-b border-slate-200 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Checklist Bab
                </span>
                <span className={`text-lg font-black ${chapterAuditReport.completenessScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {chapterAuditReport.completenessScore}%
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {chapterAuditReport.totalDetected}/{chapterAuditReport.totalRequired} Elemen
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Keselarasan Sitasi
                </span>
                <span className={`text-lg font-black ${citationAuditReport.matchRate >= 80 ? 'text-indigo-600' : 'text-amber-600'}`}>
                  {citationAuditReport.matchRate}%
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {citationAuditReport.totalCitations} Sitasi
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Kealamian Bahasa
                </span>
                <span className={`text-lg font-black ${qualityReport.naturalToneScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {qualityReport.naturalToneScore}%
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {qualityReport.cliches.length === 0 ? 'Bebas Klise' : `${qualityReport.cliches.length} Klise`}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Benang Merah
                </span>
                <span className={`text-lg font-black ${consistencyReport.alignmentScore >= 80 ? 'text-sky-600' : 'text-amber-600'}`}>
                  {consistencyReport.alignmentScore}%
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {consistencyReport.isThreadConsistent ? 'Konsisten' : 'Perlu Selaras'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Data Lapangan
                </span>
                <span className="text-lg font-black text-amber-600">
                  {qualityReport.dataPlaceholders.count}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  Marker Riil
                </span>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 px-6 bg-white gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAuditTab('kelengkapan_bab')}
                className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                  auditTab === 'kelengkapan_bab'
                    ? 'border-[#2B579A] text-[#2B579A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Checklist Standar Bab ({chapterAuditReport.completenessScore}%)
              </button>
              <button
                type="button"
                onClick={() => setAuditTab('sitasi_pustaka')}
                className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                  auditTab === 'sitasi_pustaka'
                    ? 'border-[#2B579A] text-[#2B579A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Keselarasan Sitasi & Pustaka ({citationAuditReport.matchRate}%)
              </button>
              <button
                type="button"
                onClick={() => setAuditTab('kualitas')}
                className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                  auditTab === 'kualitas'
                    ? 'border-[#2B579A] text-[#2B579A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Anti-Klise ({qualityReport.cliches.length})
              </button>
              <button
                type="button"
                onClick={() => setAuditTab('benang_merah')}
                className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                  auditTab === 'benang_merah'
                    ? 'border-[#2B579A] text-[#2B579A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                4. Benang Merah
              </button>
              <button
                type="button"
                onClick={() => setAuditTab('data_empiris')}
                className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                  auditTab === 'data_empiris'
                    ? 'border-[#2B579A] text-[#2B579A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                5. Akurasi & Data Riil ({qualityReport.dataPlaceholders.count})
              </button>
            </div>

            {/* Modal Tab Content */}
            <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
              {auditTab === 'kelengkapan_bab' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-sky-900 mb-0.5">
                        Standar Pedoman Skripsi: {chapterAuditReport.romanNumeral} – {chapterAuditReport.chapterTitle}
                      </h4>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        Pemeriksaan komponen wajib buku pedoman penulisan naskah perguruan tinggi untuk memastikan tidak ada sub-bagian penting yang terlewat.
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      chapterAuditReport.isAllWajibFulfilled
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {chapterAuditReport.isAllWajibFulfilled ? 'Komponen Wajib Lengkap' : 'Ada Elemen Belum Lengkap'}
                    </span>
                  </div>

                  {chapterAuditReport.recommendations.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-800">Rekomendasi Perbaikan:</span>
                      <ul className="list-disc pl-5 text-[11px] text-slate-600 space-y-0.5">
                        {chapterAuditReport.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">Daftar Komponen Standar Bab Ini:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {chapterAuditReport.items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border text-xs transition-all ${
                            item.isDetected
                              ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5">
                                {item.isDetected ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{item.name}</span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                    item.importance === 'wajib'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {item.importance === 'wajib' ? 'Wajib' : 'Dianjurkan'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                                <p className="text-[10px] text-sky-800 bg-sky-50/80 p-1.5 rounded-lg border border-sky-100 mt-1.5">
                                  <strong>Tips Dosen:</strong> {item.guidanceTip}
                                </p>
                              </div>
                            </div>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              item.isDetected
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.isDetected ? 'Terdeteksi' : 'Belum Ada'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {auditTab === 'sitasi_pustaka' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-indigo-900 mb-0.5">
                        Pemeriksa Keselarasan Sitasi Teks & Daftar Pustaka
                      </h4>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        Mencegah pelanggaran akademik: setiap kutipan dalam teks wajib memiliki entri rujukan yang sesuai pada Daftar Pustaka.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-black text-indigo-700 block">
                        {citationAuditReport.matchRate}%
                      </span>
                      <span className="text-[10px] text-slate-500">Tingkat Keselarasan</span>
                    </div>
                  </div>

                  {!citationAuditReport.hasBibliographySection && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900">
                      <strong>Perhatian:</strong> Bagian <em>"Daftar Pustaka"</em> atau <em>"References"</em> belum terdeteksi di bagian akhir naskah. Pastikan menambahkan bagian Daftar Pustaka agar sistem dapat mencocokkan rujukan.
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-500 block">Sitasi dalam Teks</span>
                      <span className="text-lg font-bold text-slate-800">{citationAuditReport.totalCitations} Kutipan</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-500 block">Peneliti / Penulis</span>
                      <span className="text-lg font-bold text-slate-800">{citationAuditReport.uniqueAuthorsCount} Ahli</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[11px] text-slate-500 block">Entri Daftar Pustaka</span>
                      <span className="text-lg font-bold text-slate-800">{citationAuditReport.bibliographyEntriesCount} Sumber</span>
                    </div>
                  </div>

                  {citationAuditReport.missingFromBibliography.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-rose-800 font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Sitasi Teks yang Belum Ada di Daftar Pustaka ({citationAuditReport.missingFromBibliography.length}):</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddAllMissingCitations}
                          className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>Lengkapi Semua ({citationAuditReport.missingFromBibliography.length}) ke Pustaka</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-rose-700 leading-relaxed">
                        Kutipan berikut tercantum dalam paragraf naskah tetapi belum ditemukan pada Daftar Pustaka:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {citationAuditReport.missingFromBibliography.map((c, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 font-serif text-[11px] font-semibold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800">Daftar Kutipan Teridentifikasi:</h4>
                    {citationAuditReport.matches.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                        Belum ada kutipan nama-tahun (seperti (Santoso, 2021)) yang terdeteksi dalam teks naskah.
                      </p>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {citationAuditReport.matches.map((m, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs transition-all ${
                              m.isMatched ? 'bg-white border-slate-200' : 'bg-rose-50/40 border-rose-200'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 font-serif text-[13px]">{m.rawCitation}</span>
                                <span className="text-[10px] text-slate-400">({m.authorOrRef}, {m.year})</span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    m.isMatched ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {m.isMatched ? 'Ada di Pustaka' : 'Belum Terdaftar'}
                                </span>
                              </div>
                              {m.contextSnippet && (
                                <p className="text-[11px] text-slate-500 italic mt-1 font-sans">
                                  {m.contextSnippet}
                                </p>
                              )}
                              {!m.isMatched && m.suggestedBibEntry && (
                                <p className="text-[10px] text-rose-800 bg-white/80 p-2 rounded-lg mt-1.5 border border-rose-200 font-sans">
                                  <strong>Rekomendasi Format APA 7th:</strong> {m.suggestedBibEntry}
                                </p>
                              )}
                            </div>
                            {!m.isMatched && (
                              <button
                                type="button"
                                onClick={() => handleAddSingleCitation(m)}
                                className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer self-start sm:self-center"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambahkan</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {auditTab === 'kualitas' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">
                      Standar Bahasa Akademik Bebas Slop / Anti-Robot:
                    </p>
                    <p className="leading-relaxed">
                      Karya ilmiah berkualitas tinggi menggunakan struktur kalimat majemuk bertingkat yang bervariasi, menautkan ide antar-alinea dengan transisi saintifik lentur, serta menghindari frasa generik/pembuka klise yang sering dihasilkan kecerdasan buatan biasa.
                    </p>
                  </div>

                  {qualityReport.cliches.length === 0 ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                      <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Luar Biasa! Tidak Ditemukan Frasa Klise.</span>
                        <p className="text-emerald-700 mt-0.5">
                          Naskah Anda bernalar deduktif alami, kaya diksi ilmiah, dan bebas dari pembuka generik.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-800">
                        Frasa Klise Terdeteksi & Saran Pengganti Ilmiah:
                      </h4>
                      {qualityReport.cliches.map((c, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 text-xs flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-900">
                              "{c.foundText}"
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold uppercase">
                              {c.category.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] mt-0.5">
                            <strong>Saran Perbaikan:</strong> {c.suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {qualityReport.repetitiveSentenceStarts.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                      <span className="font-bold text-slate-800 block mb-1">
                        Pola Awal Kalimat yang Terlalu Sering Berulang:
                      </span>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                        {qualityReport.repetitiveSentenceStarts.map((r, i) => (
                          <li key={i}>
                            Kalimat diawali kata <em>"{r.prefix}..."</em> muncul sebanyak <strong>{r.count} kali</strong>. Variasikan struktur kalimat.
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {auditTab === 'benang_merah' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                    <span className="font-bold block mb-1">
                      Audit Benang Merah (Thread of Inquiry):
                    </span>
                    <p className="leading-relaxed">
                      {consistencyReport.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {consistencyReport.checks.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white text-xs flex items-start gap-3 shadow-2xs">
                        <div className="mt-0.5">
                          {c.status === 'sesuai' ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{c.element}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.status === 'sesuai'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {c.status === 'sesuai' ? 'Selaras' : 'Perhatian'}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-1">{c.detail}</p>
                          {c.suggestion && (
                            <p className="text-indigo-700 text-[11px] font-medium mt-1">
                              <strong>Rekomendasi:</strong> {c.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {auditTab === 'data_empiris' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <span className="font-bold block mb-1">
                      Integritas Akademik & Anti-Halusinasi Data:
                    </span>
                    <p className="leading-relaxed">
                      Sistem kami secara ketat <strong>TIDAK MENGARANG</strong> angka statistik survei palsu, nomor registrasi fiktif, atau kutipan buatan. Seluruh bagian yang membutuhkan data riil dari instansi/lokus Anda ditandai secara transparan agar integritas ilmiah Anda terlindungi saat sidang.
                    </p>
                  </div>

                  {qualityReport.dataPlaceholders.count === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center">
                      Tidak ada penanda data yang tertinggal dalam draf ini.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">
                        Daftar Titik yang Membutuhkan Input Data Riil Anda:
                      </span>
                      {qualityReport.dataPlaceholders.markers.map((m, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex items-center justify-between gap-3 shadow-2xs">
                          <span className="text-slate-800 font-medium truncate">
                            {idx + 1}. {m}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                            Perlu Dilengkapi
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {auditTab === 'variasi_kalimat' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
                    <span className="font-bold block mb-1">
                      Analisis Ritme Kalimat (Sentence Rhythm & Cadence):
                    </span>
                    <p className="leading-relaxed">
                      Tulisan akademik yang disusun oleh pakar manusia memadukan kalimat tunggal pendek yang tegas (*punchy topic sentence*) dengan kalimat majemuk bertingkat yang kaya penjelasan. Struktur ini mencegah teks terdengar monoton layaknya teks robotik.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Skor Variasi Kalimat
                      </span>
                      <span className="text-2xl font-extrabold text-sky-600">
                        {qualityReport.sentenceVariationScore}%
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {qualityReport.sentenceVariationScore >= 70 ? 'Dinamis & Mengalir' : 'Cenderung Monoton'}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Pola Awal Kalimat Berulang
                      </span>
                      <span className="text-2xl font-extrabold text-slate-800">
                        {qualityReport.repetitiveSentenceStarts.length}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {qualityReport.repetitiveSentenceStarts.length === 0 ? 'Pola Bervariasi' : 'Perlu Divariasikan'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                    <span className="font-bold text-slate-800 block">
                      Rekomendasi Dinamika Penulisan:
                    </span>
                    <p className="leading-relaxed">
                      {qualityReport.internalEditorialSummary || 'Gunakan konjungtor antarkalimat ilmiah (kendati demikian, konsekuensi logis dari disparitas ini, secara konseptual) untuk menghubungkan gagasan secara organik.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Penyuntingan otomatis menjaga akurasi ilmiah dan menyelaraskan dengan EYD V.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleAutoEditorialRefine();
                    setIsAuditModalOpen(false);
                  }}
                  disabled={isAutoPolishing}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Poles Bahasa Otomatis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED CITATION SCANNER MODAL (PEMINDAI SITASI & DAFTAR PUSTAKA) */}
      <CitationScannerModal
        isOpen={isCitationScannerOpen}
        onClose={() => {
          setIsCitationScannerOpen(false);
          setSelectedCitationItem(null);
        }}
        citationAuditReport={citationAuditReport}
        citationFilterTab={citationFilterTab}
        setCitationFilterTab={setCitationFilterTab}
        selectedCitationItem={selectedCitationItem}
        setSelectedCitationItem={setSelectedCitationItem}
        handleAddSingleCitation={handleAddSingleCitation}
        handleAddAllMissingCitations={handleAddAllMissingCitations}
        onAutoEnrichCitations={handleAutoEnrichCitations}
        researchTopic={formData.topic || formData.fieldOfStudy || ''}
        onAddCustomBibEntry={handleAddCustomBibEntry}
      />

      {/* Preliminary Pages Modal (Cover & Lembar Pengesahan) */}
      <PreliminaryPagesModal
        isOpen={isPreliminaryModalOpen}
        initialTab={modalInitialTab}
        onClose={() => setIsPreliminaryModalOpen(false)}
        formData={formData}
        onUpdateFormData={onUpdateFormData || (() => {})}
        onInsertToContent={(preliminaryText, part) => {
          const updated = insertOrReplacePreliminaryPage(content, part, preliminaryText, formData);
          onContentChange(updated);
        }}
      />
    </div>
  );
};

