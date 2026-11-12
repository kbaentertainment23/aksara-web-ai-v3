import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateItemLineWeight,
  isHeadingItem,
  isChapterHeadingItem,
  calculateA4PageCapacityLines,
  paginateAcademicItems,
  formatRomanPageNumber,
  ParsedAcademicItem,
} from './paginationRules.ts';

test('calculateA4PageCapacityLines calculates sensible A4 page capacity for 12pt 1.5 spacing', () => {
  const capacity = calculateA4PageCapacityLines({ fontSizePt: 12, lineSpacing: 1.5 });
  // Standard A4 margin 3cm top and bottom has 896px printable height.
  // 12pt at 1.5 line height is 24px => ~35-37 lines.
  assert.ok(capacity >= 33 && capacity <= 38, `Capacity was ${capacity}`);
});

test('calculateA4PageCapacityLines adjusts dynamically with line spacing', () => {
  const cap15 = calculateA4PageCapacityLines({ fontSizePt: 12, lineSpacing: 1.5 });
  const cap20 = calculateA4PageCapacityLines({ fontSizePt: 12, lineSpacing: 2.0 });
  const cap115 = calculateA4PageCapacityLines({ fontSizePt: 12, lineSpacing: 1.15 });

  assert.ok(cap20 < cap15, 'Double spacing should yield fewer lines than 1.5');
  assert.ok(cap115 > cap15, '1.15 spacing should yield more lines than 1.5');
});

test('estimateItemLineWeight estimates weights for headings, paragraphs, and tables correctly', () => {
  const h2Item: ParsedAcademicItem = {
    type: 'h2',
    text: '1.1 Latar Belakang Masalah',
    wordCount: 4,
  };
  const h2Weight = estimateItemLineWeight(h2Item);
  assert.ok(h2Weight >= 2.0 && h2Weight <= 3.0, `H2 weight was ${h2Weight}`);

  const paraItem: ParsedAcademicItem = {
    type: 'paragraph',
    text: 'Penelitian ini bertujuan untuk menganalisis fenomena transformasi digital perguruan tinggi.',
    wordCount: 10,
  };
  const paraWeight = estimateItemLineWeight(paraItem);
  assert.ok(paraWeight >= 1.2 && paraWeight <= 2.5, `Paragraph weight was ${paraWeight}`);

  const babItem: ParsedAcademicItem = {
    type: 'chapter_title',
    text: 'BAB I',
    subText: 'PENDAHULUAN',
    wordCount: 3,
  };
  const babWeight = estimateItemLineWeight(babItem);
  assert.ok(babWeight >= 4.0, `BAB weight was ${babWeight}`);
});

test('orphan heading prevention: pushes H2 to next page when fewer than 2 following paragraph lines fit', () => {
  // Construct a page that is almost full (e.g. 33 lines used out of 35)
  // Then place an H2 followed by a 40-word paragraph (~4 lines).
  // The H2 requires ~2.4 lines. 2 lines of following paragraph requires ~2.45 lines.
  // Total needed = ~4.85 lines. But space remaining is only 2 lines.
  // The algorithm MUST push H2 to page 2!
  const items: ParsedAcademicItem[] = [
    {
      type: 'paragraph',
      text: 'Paragraf panjang pembuka awal naskah... '.repeat(10),
      wordCount: 330, // ~31-32 lines
    },
    {
      type: 'h2',
      text: '1.2 Identifikasi Masalah Penelitian',
      wordCount: 4,
    },
    {
      type: 'paragraph',
      text: 'Berdasarkan uraian latar belakang masalah di atas, maka dapat diidentifikasi beberapa permasalahan krusial yang memerlukan investigasi empiris secara komprehensif.',
      wordCount: 18, // ~2 lines
    },
  ];

  const pages = paginateAcademicItems(items, { fontSizePt: 12, lineSpacing: 1.5 });

  assert.equal(pages.length, 2, 'Should be split across 2 pages due to orphan heading prevention');
  // Page 1 should only contain the initial long paragraph
  assert.equal(pages[0].items.length, 1);
  assert.equal(pages[0].items[0].type, 'paragraph');

  // Page 2 MUST begin with the H2 heading, followed by its paragraph
  assert.equal(pages[1].items[0].type, 'h2');
  assert.equal(pages[1].items[0].text, '1.2 Identifikasi Masalah Penelitian');
  assert.equal(pages[1].items[1].type, 'paragraph');
});

test('orphan heading prevention: keeps H2 on same page when there is sufficient room for heading + 2 lines', () => {
  // Construct a page with only 10 lines used out of 35
  const items: ParsedAcademicItem[] = [
    {
      type: 'paragraph',
      text: 'Paragraf pendek pembuka awal bab.',
      wordCount: 50, // ~5 lines
    },
    {
      type: 'h2',
      text: '1.2 Rumusan Masalah',
      wordCount: 3,
    },
    {
      type: 'paragraph',
      text: 'Bagaimanakah pengaruh implementasi kecerdasan buatan terhadap efisiensi penulisan karya ilmiah mahasiswa sarjana?',
      wordCount: 14,
    },
  ];

  const pages = paginateAcademicItems(items, { fontSizePt: 12, lineSpacing: 1.5 });

  assert.equal(pages.length, 1, 'All items should fit comfortably on page 1');
  assert.equal(pages[0].items.length, 3);
  assert.equal(pages[0].items[1].type, 'h2');
});

test('heading chain protection: H2 followed immediately by H3 are pushed together to next page if paragraph cannot fit', () => {
  // H2 followed immediately by H3, then a paragraph.
  // When space is tight, neither H2 nor H3 should be orphaned alone on page 1.
  const items: ParsedAcademicItem[] = [
    {
      type: 'paragraph',
      text: 'Paragraf panjang pengisi lembar pertama. '.repeat(10),
      wordCount: 320, // ~31 lines
    },
    {
      type: 'h2',
      text: '1.3 Batasan Masalah',
      wordCount: 3,
    },
    {
      type: 'h3',
      text: '1.3.1 Ruang Lingkup Subjek Penelitian',
      wordCount: 5,
    },
    {
      type: 'paragraph',
      text: 'Penelitian ini dibatasi secara ketat pada mahasiswa tingkat akhir yang sedang menyelesaikan skripsi di program studi teknik.',
      wordCount: 16,
    },
  ];

  const pages = paginateAcademicItems(items, { fontSizePt: 12, lineSpacing: 1.5 });

  assert.equal(pages.length, 2);
  // Page 1 ends before the heading chain
  assert.equal(pages[0].items.length, 1);
  assert.equal(pages[0].items[0].type, 'paragraph');

  // Page 2 starts with H2, followed by H3, followed by the paragraph
  assert.equal(pages[1].items[0].type, 'h2');
  assert.equal(pages[1].items[0].text, '1.3 Batasan Masalah');
  assert.equal(pages[1].items[1].type, 'h3');
  assert.equal(pages[1].items[2].type, 'paragraph');
});

test('chapter titles (BAB I, BAB II) always start on a fresh new page', () => {
  const items: ParsedAcademicItem[] = [
    {
      type: 'chapter_title',
      text: 'BAB I',
      subText: 'PENDAHULUAN',
      wordCount: 3,
    },
    {
      type: 'paragraph',
      text: 'Isi bab satu yang cukup ringkas.',
      wordCount: 40,
    },
    {
      type: 'chapter_title',
      text: 'BAB II',
      subText: 'TINJAUAN PUSTAKA',
      wordCount: 4,
    },
    {
      type: 'paragraph',
      text: 'Isi bab dua dimulai di lembar terpisah.',
      wordCount: 30,
    },
  ];

  const pages = paginateAcademicItems(items);

  assert.equal(pages.length, 2, 'Should create exactly 2 pages for 2 chapters');
  assert.equal(pages[0].pageNumber, 1);
  assert.equal(pages[0].isChapterStart, true);
  assert.equal(pages[0].suppressRunningHead, true, 'Running head suppressed on chapter start page');
  assert.equal(pages[0].items[0].text, 'BAB I');

  assert.equal(pages[1].pageNumber, 2);
  assert.equal(pages[1].isChapterStart, true);
  assert.equal(pages[1].suppressRunningHead, true);
  assert.equal(pages[1].items[0].text, 'BAB II');
});

test('formatRomanPageNumber generates correct lowercase roman numerals for preliminary pages', () => {
  assert.equal(formatRomanPageNumber(1), 'i');
  assert.equal(formatRomanPageNumber(2), 'ii');
  assert.equal(formatRomanPageNumber(3), 'iii');
  assert.equal(formatRomanPageNumber(4), 'iv');
  assert.equal(formatRomanPageNumber(5), 'v');
  assert.equal(formatRomanPageNumber(9), 'ix');
  assert.equal(formatRomanPageNumber(10), 'x');
});
