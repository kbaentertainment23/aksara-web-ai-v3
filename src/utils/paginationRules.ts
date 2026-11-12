/**
 * Standar Pemotongan Halaman Kertas A4 (A4 Pagination Engine)
 * dengan Aturan Pencegahan Judul Yatim (Orphan Heading Prevention) &
 * Konsistensi Margin 4-3-3-3 cm Standar Karya Ilmiah Dikti.
 */

import type { AcademicTableData } from './academicRules.ts';

export interface ParsedAcademicItem {
  type: 'chapter_title' | 'h1' | 'h2' | 'h3' | 'paragraph' | 'bullet' | 'divider' | 'quote' | 'table';
  text: string;
  subText?: string;
  wordCount: number;
  tableData?: AcademicTableData;
  isContinuation?: boolean; // true jika merupakan pecahan lanjutan dari paragraf sebelumnya
  isBibliographyEntry?: boolean; // true jika entri berada di bawah bagian DAFTAR PUSTAKA
}

export interface PaginationOptions {
  fontSizePt?: number;       // default 12 pt
  lineSpacing?: number;      // default 1.5 spasi
  pageHeightPx?: number;     // default 1123 px (297 mm @ 96 DPI)
  pageWidthPx?: number;      // default 794 px (210 mm @ 96 DPI)
  marginTopCm?: number;      // default 3.0 cm (~113 px)
  marginBottomCm?: number;   // default 3.0 cm (~113 px)
  marginLeftCm?: number;     // default 4.0 cm (~151 px)
  marginRightCm?: number;    // default 3.0 cm (~113 px)
  minOrphanParagraphLines?: number; // default 2 baris paragraf pengikut
}

export interface PaginatedPage {
  pageIndex: number;          // 0-indexed
  pageNumber: number;         // 1-indexed (1, 2, 3...)
  isChapterStart: boolean;    // true jika memuat judul BAB awal
  chapterHeading?: string;    // mis. "BAB I PENDAHULUAN"
  suppressRunningHead: boolean; // Standar Dikti: true pada halaman awal BAB
  items: ParsedAcademicItem[];
  linesUsed: number;
  maxLineCapacity: number;
}

/**
 * Konversi angka ke angka romawi kecil untuk penomoran halaman preliminaries
 * (mis. sampul = i (tidak tertulis), persetujuan = ii, pengesahan = iii, pernyataan = iv)
 */
export function formatRomanPageNumber(num: number): string {
  if (num <= 0) return '';
  const romanMap: [number, string][] = [
    [1000, 'm'],
    [900, 'cm'],
    [500, 'd'],
    [400, 'cd'],
    [100, 'c'],
    [90, 'xc'],
    [50, 'l'],
    [40, 'xl'],
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ];
  let result = '';
  let n = num;
  for (const [val, roman] of romanMap) {
    while (n >= val) {
      result += roman;
      n -= val;
    }
  }
  return result;
}

/**
 * Memeriksa apakah item merupakan judul bab atau heading
 */
export function isHeadingItem(item: ParsedAcademicItem): boolean {
  return (
    item.type === 'chapter_title' ||
    item.type === 'h1' ||
    item.type === 'h2' ||
    item.type === 'h3'
  );
}

/**
 * Memeriksa apakah item merupakan judul BAB resmi (mis. "BAB I", "BAB 1")
 * atau bagian bab utama seperti "DAFTAR PUSTAKA" / "LAMPIRAN"
 */
export function isChapterHeadingItem(item: ParsedAcademicItem): boolean {
  if (item.type === 'chapter_title') return true;
  if (item.type === 'h1' || item.type === 'h2') {
    const text = item.text.trim().toUpperCase();
    if (/^BAB\s+[IVXLCDM0-9]+/i.test(text)) return true;
    if (
      text.includes('DAFTAR PUSTAKA') ||
      text.includes('BIBLIOGRAPHY') ||
      text.includes('REFERENSI') ||
      text === 'LAMPIRAN' ||
      text === 'GLOSARIUM'
    ) return true;
  }
  return false;
}

/**
 * Menghitung kapasitas baris efektif per halaman A4 berdasarkan margin 4-3-3-3 cm,
 * ukuran font (pt), dan spasi baris (lineSpacing).
 *
 * Dimensi fisik A4: 210 mm x 297 mm (794 px x 1123 px @ 96 DPI).
 * Margin Atas 3 cm (~113.4 px), Bawah 3 cm (~113.4 px), Kiri 4 cm (~151.2 px), Kanan 3 cm (~113.4 px).
 * Area cetak vertikal: 297 mm - 30 mm - 30 mm = 237 mm (~896 px).
 */
export function calculateA4PageCapacityLines(options?: PaginationOptions): number {
  const fontSizePt = options?.fontSizePt || 12;
  const lineSpacing = options?.lineSpacing || 1.5;

  // 1 pt = 1.333 px @ 96 DPI
  // Tinggi satu baris teks dalam piksel
  const singleLineHeightPx = (fontSizePt * (96 / 72)) * lineSpacing;

  // Tinggi printable A4 margin 3cm atas dan 3cm bawah
  const printableHeightPx = 896;

  // Kapasitas baris mentah
  const rawLines = printableHeightPx / singleLineHeightPx;

  // Berikan cadangan margin peredam untuk header, footer, dan padding paragraf (~1.5 baris)
  const effectiveLines = Math.max(18, Math.floor(rawLines - 1.5));

  return effectiveLines;
}

/**
 * Menaksir bobot baris (line weight) suatu elemen naskah akademik
 * di atas kertas A4 dengan lebar kolom efektif 140 mm (lebar 210mm - 40mm kiri - 30mm kanan).
 * Pada Times New Roman 12pt, lebar 140 mm menampung rata-rata 10-11 kata per baris.
 */
export function estimateItemLineWeight(
  item: ParsedAcademicItem,
  options?: PaginationOptions
): number {
  const wordsPerLine = 10.5;

  switch (item.type) {
    case 'chapter_title': {
      // Judul Bab: Jarak atas (pt-2), BAB X (14pt bold), JUDUL BAB (14pt bold), jarak bawah (pb-5)
      const titleLines = item.subText ? 2.5 : 1.5;
      return 2.0 + titleLines; // ~4.0 - 4.5 baris
    }

    case 'h1': {
      // Heading 1: Jarak atas (pt-3), teks judul (14pt), jarak bawah (pb-3)
      const textLines = Math.max(1, Math.ceil(item.wordCount / 9));
      return 1.8 + textLines; // ~2.8 - 3.8 baris
    }

    case 'h2': {
      // Subbab (H2): Jarak atas (pt-3), teks subbab (12pt bold), jarak bawah (pb-1)
      const textLines = Math.max(1, Math.ceil(item.wordCount / 10));
      return 1.4 + textLines; // ~2.4 baris untuk subbab standar 1 baris
    }

    case 'h3': {
      // Anak Subbab (H3): Jarak atas (pt-2), teks anak subbab (12pt italic bold), jarak bawah (pb-1)
      const textLines = Math.max(1, Math.ceil(item.wordCount / 10.5));
      return 1.1 + textLines; // ~2.1 baris
    }

    case 'paragraph': {
      // Paragraf akademik dengan indentasi 1.27 cm dan jarak bawah margin 0.6rem (~0.45 baris)
      const textLines = Math.max(1, Math.ceil(item.wordCount / wordsPerLine));
      const paragraphSpacing = 0.45;
      return textLines + paragraphSpacing;
    }

    case 'bullet': {
      // Poin daftar (bullet)
      const textLines = Math.max(1, Math.ceil(item.wordCount / 10));
      return textLines + 0.2;
    }

    case 'quote': {
      // Kutipan langsung (blok quote) dengan margin atas/bawah
      const textLines = Math.max(1, Math.ceil(item.wordCount / 9.5));
      return textLines + 1.2;
    }

    case 'divider': {
      return 1.2;
    }

    case 'table': {
      // Tabel akademik standar: Judul tabel + Header row + Data rows + Sumber + Catatan panduan
      const rowCount = item.tableData?.rows?.length || 3;
      const baseLines = 4.0; // Judul tabel + Header tabel + border
      const rowsLines = rowCount * 1.5;
      const sourceLines = item.tableData?.source ? 1.2 : 0;
      const guideLines = (item.tableData?.studentGuide?.length || 0) > 0 ? 3.0 : 0;
      return Math.min(26, baseLines + rowsLines + sourceLines + guideLines);
    }

    default:
      return Math.max(1, Math.ceil((item.wordCount || 10) / wordsPerLine));
  }
}

/**
 * Mencoba memecah paragraf panjang antar-kalimat (sentence-boundary splitting)
 * dengan menjaga aturan tipografi ilmiah:
 * - Bagian awal di halaman 1 memiliki setidaknya 2 baris (orphan prevention)
 * - Bagian lanjutan di halaman 2 memiliki setidaknya 2 baris (widow prevention)
 * - Pecahan lanjutan ditandai dengan isContinuation: true (tanpa indentasi baris pertama)
 */
export function trySplitParagraphCleanly(
  paraItem: ParsedAcademicItem,
  availableLines: number,
  options?: PaginationOptions
): { head: ParsedAcademicItem; tail: ParsedAcademicItem } | null {
  if (paraItem.type !== 'paragraph' || availableLines < 2.5) {
    return null;
  }

  // Pecah teks berdasarkan batas kalimat (. ! ?)
  const rawSentences = paraItem.text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g);
  if (!rawSentences || rawSentences.length < 2) {
    return null;
  }

  const wordsPerLine = 10.5;
  let accumulatedWords = 0;
  let splitIndex = -1;

  for (let s = 0; s < rawSentences.length - 1; s++) {
    const sWords = rawSentences[s].trim().split(/\s+/).filter(Boolean).length;
    const testWords = accumulatedWords + sWords;
    const testLines = Math.ceil(testWords / wordsPerLine) + 0.45;

    // Hitung sisa kalimat untuk bagian lanjutan (tail)
    const remainingSentences = rawSentences.slice(s + 1);
    const tailWords = remainingSentences.join(' ').trim().split(/\s+/).filter(Boolean).length;
    const tailLines = Math.ceil(tailWords / wordsPerLine) + 0.45;

    // Aturan 2 baris minimum untuk head dan tail (Orphan & Widow Control)
    if (testLines <= availableLines && testLines >= 2.0 && tailLines >= 2.0) {
      accumulatedWords = testWords;
      splitIndex = s;
    } else if (testLines > availableLines) {
      break;
    }
  }

  if (splitIndex === -1) {
    return null;
  }

  const headText = rawSentences.slice(0, splitIndex + 1).join('').trim();
  const tailText = rawSentences.slice(splitIndex + 1).join('').trim();

  const headWords = headText.split(/\s+/).filter(Boolean).length;
  const tailWords = tailText.split(/\s+/).filter(Boolean).length;

  return {
    head: {
      type: 'paragraph',
      text: headText,
      wordCount: headWords,
      isContinuation: paraItem.isContinuation,
      isBibliographyEntry: paraItem.isBibliographyEntry,
    },
    tail: {
      type: 'paragraph',
      text: tailText,
      wordCount: tailWords,
      isContinuation: true,
      isBibliographyEntry: paraItem.isBibliographyEntry,
    },
  };
}

/**
 * Algoritma Utama Pemotongan Halaman Kertas A4 (A4 Pagination Engine)
 * Mematuhi:
 * 1. Pencegahan Judul Yatim (Orphan Heading Prevention / Keep-With-Next):
 *    Jika suatu judul BAB, Subbab (H2), atau Anak Subbab (H3) jatuh pada baris-baris
 *    akhir lembar A4 tanpa setidaknya 2 baris paragraf pengikut, otomatis dorong judul
 *    tersebut ke awal lembar berikutnya.
 * 2. Bab Baru Selalu Membuka Lembar Baru:
 *    Setiap item BAB (chapter_title atau h1 BAB) selalu otomatis membuka lembar baru.
 * 3. Rantai Subbab (Heading Chain):
 *    Jika H2 langsung disusul oleh H3, maka kedua judul tersebut beserta minimal 2 baris
 *    paragraf pengikut dihitung sebagai satu kesatuan yang tidak boleh terputus.
 * 4. Konsistensi Penomoran & Margin 4-3-3-3 cm:
 *    Perhitungan nomor halaman, running head (header atas), dan running footer (bawah)
 *    terjaga presisi tanpa mengubah teks naskah aslinya.
 */
export function paginateAcademicItems(
  items: ParsedAcademicItem[],
  options?: PaginationOptions
): PaginatedPage[] {
  if (!items || items.length === 0) {
    return [];
  }

  const maxLinesPerPage = calculateA4PageCapacityLines(options);
  const minOrphanParagraphLines = options?.minOrphanParagraphLines ?? 2.0;

  const pages: PaginatedPage[] = [];
  let currentPageItems: ParsedAcademicItem[] = [];
  let currentLinesUsed = 0;
  let currentPageIsChapterStart = false;
  let currentChapterHeading: string | undefined = undefined;

  const finalizeCurrentPage = () => {
    if (currentPageItems.length === 0) return;

    const pageIndex = pages.length;
    const pageNumber = pageIndex + 1;

    pages.push({
      pageIndex,
      pageNumber,
      isChapterStart: currentPageIsChapterStart,
      chapterHeading: currentChapterHeading,
      suppressRunningHead: currentPageIsChapterStart,
      items: currentPageItems,
      linesUsed: Math.round(currentLinesUsed * 10) / 10,
      maxLineCapacity: maxLinesPerPage,
    });

    currentPageItems = [];
    currentLinesUsed = 0;
    currentPageIsChapterStart = false;
    currentChapterHeading = undefined;
  };

  // Buat salinan antrean item agar dapat menangani pembagian paragraf jika diperlukan
  const itemQueue: ParsedAcademicItem[] = [...items];
  let i = 0;

  while (i < itemQueue.length) {
    const item = itemQueue[i];
    const itemWeight = estimateItemLineWeight(item, options);
    const isChapter = isChapterHeadingItem(item);
    const isHeading = isHeadingItem(item);

    // ATURAN 1: Bab Baru Selalu Mengawali Lembar Baru
    // Jika item adalah Judul BAB dan lembar saat ini sudah berisi konten, dorong ke lembar baru
    if (isChapter && currentPageItems.length > 0) {
      finalizeCurrentPage();
    }

    if (currentPageItems.length === 0 && isChapter) {
      currentPageIsChapterStart = true;
      currentChapterHeading = item.subText ? `${item.text}: ${item.subText}` : item.text;
    }

    // ATURAN 2: Pencegahan Judul Yatim (Orphan Heading Prevention / Keep-With-Next)
    // Jika item merupakan heading (BAB, H1, H2, H3), periksa apakah ada cukup ruang
    // untuk menampung heading tersebut BESERTA setidaknya 2 baris paragraf pengikutnya
    if (isHeading && currentPageItems.length > 0) {
      // 1. Kumpulkan rantai heading berurutan (mis. H2 langsung disusul H3)
      let headingChainWeight = itemWeight;
      let nextIdx = i + 1;

      while (
        nextIdx < itemQueue.length &&
        isHeadingItem(itemQueue[nextIdx]) &&
        !isChapterHeadingItem(itemQueue[nextIdx])
      ) {
        headingChainWeight += estimateItemLineWeight(itemQueue[nextIdx], options);
        nextIdx++;
      }

      // 2. Evaluasi apakah konten pengikut pertama dapat benar-benar berada di lembar ini
      let canFollowingFit = false;
      const minRequiredFollow = minOrphanParagraphLines + 0.45;
      const spaceRemainingForContent = maxLinesPerPage - (currentLinesUsed + headingChainWeight);

      if (nextIdx < itemQueue.length) {
        const nextContent = itemQueue[nextIdx];
        const nextWeight = estimateItemLineWeight(nextContent, options);

        if (nextContent.type === 'paragraph') {
          const paraLines = Math.max(1, Math.ceil(nextContent.wordCount / 10.5));

          if (spaceRemainingForContent >= nextWeight) {
            // Seluruh paragraf pengikut muat bersama heading di lembar ini
            canFollowingFit = true;
          } else if (
            paraLines >= 4 &&
            spaceRemainingForContent >= minRequiredFollow &&
            trySplitParagraphCleanly(nextContent, spaceRemainingForContent, options) !== null
          ) {
            // Paragraf dapat dipecah secara sah dengan minimal 2 baris di lembar 1 dan 2 baris di lembar 2
            canFollowingFit = true;
          } else {
            // Paragraf pengikut tidak dapat memberikan 2 baris di lembar ini
            canFollowingFit = false;
          }
        } else if (nextContent.type === 'table') {
          // Tabel memerlukan setidaknya 4 baris (judul + header + 1 baris)
          canFollowingFit = spaceRemainingForContent >= 5.0;
        } else {
          // Bullet / quote
          canFollowingFit = spaceRemainingForContent >= nextWeight;
        }
      } else {
        canFollowingFit = false;
      }

      // JIKA KONTEN PENGIKUT TIDAK BISA MEMPUNYAI SETIDAKNYA 2 BARIS DI LEMBAR INI:
      // Otomatis dorong judul tersebut ke awal lembar berikutnya!
      if (!canFollowingFit) {
        finalizeCurrentPage();

        if (isChapter) {
          currentPageIsChapterStart = true;
          currentChapterHeading = item.subText ? `${item.text}: ${item.subText}` : item.text;
        }

        currentPageItems.push(item);
        currentLinesUsed = itemWeight;
        i++;
        continue;
      }
    }

    // ATURAN 3: Pemotongan Standar Berdasarkan Kapasitas Baris Halaman A4
    if (currentLinesUsed + itemWeight > maxLinesPerPage && currentPageItems.length > 0) {
      // Coba pecah paragraf panjang antar-kalimat jika memungkinkan
      const spaceRemaining = maxLinesPerPage - currentLinesUsed;
      if (item.type === 'paragraph' && spaceRemaining >= 2.5) {
        const splitResult = trySplitParagraphCleanly(item, spaceRemaining, options);
        if (splitResult) {
          // Tambahkan pecahan awal ke halaman saat ini
          currentPageItems.push(splitResult.head);
          finalizeCurrentPage();

          // Sisipkan pecahan lanjutan ke antrean pemrosesan halaman berikutnya
          itemQueue[i] = splitResult.tail;
          continue;
        }
      }

      finalizeCurrentPage();

      if (isChapter) {
        currentPageIsChapterStart = true;
        currentChapterHeading = item.subText ? `${item.text}: ${item.subText}` : item.text;
      }

      currentPageItems.push(item);
      currentLinesUsed = itemWeight;
    } else {
      currentPageItems.push(item);
      currentLinesUsed += itemWeight;
    }

    i++;
  }

  // Finalisasi halaman terakhir
  if (currentPageItems.length > 0) {
    finalizeCurrentPage();
  }

  return pages;
}
