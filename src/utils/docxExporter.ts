import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageNumber,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  UnderlineType,
  ImageRun,
} from 'docx';
import {
  type AcademicFormData,
  parseAcademicMarkdown,
  splitPreliminaryPagesAndBody,
  type PreliminarySheetDetails,
  cleanAcademicMarkdownSymbols,
  type AcademicTableData,
  extractChapterInfo,
  isMajorCenteredAcademicTitle,
  crossCheckCitationsWithBibliography,
  reconcileDocumentCitationsAndBibliography,
} from './academicRules.ts';
import { getUniversityEmblemUint8Array } from '../data/universitySeal.ts';

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const cellCleanBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
};

/**
 * Builds Cover Outer Page for Word (.docx).
 */
function buildCoverPageDocx(
  details: PreliminarySheetDetails,
  fontFamily: string,
  lineSpacing: number
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // 1. Judul Skripsi / Tesis (Centered, 14pt, Bold)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 180, line: lineSpacing },
      children: [
        new TextRun({
          text: details.title.toUpperCase(),
          bold: true,
          font: fontFamily,
          size: 28, // 14pt
        }),
      ],
    })
  );

  // 2. Keterangan Jenis Karya (Centered, 12pt, Bold)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60, line: lineSpacing },
      children: [
        new TextRun({
          text: details.degreeLabel,
          bold: true,
          font: fontFamily,
          size: 24, // 12pt
        }),
      ],
    })
  );

  // 3. Peruntukan Gelar (Centered, 11pt, Italic)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 360, line: lineSpacing },
      children: [
        new TextRun({
          text: `Diajukan untuk memenuhi salah satu syarat memperoleh gelar ${details.degreeTitle} pada Program Studi ${details.studyProgram}`,
          italics: true,
          font: fontFamily,
          size: 22, // 11pt
        }),
      ],
    })
  );

  // 4. Logo / Lambang Resmi Perguruan Tinggi (Format Gambar PNG Standar ~5 cm x 5 cm)
  // Menampilkan lambang kampus resmi yang serasi dengan tampilan antarmuka.
  // Pengguna dapat mengganti gambar ini dengan logo kampus masing-masing di Microsoft Word
  // cukup dengan klik kanan pada gambar > "Change Picture" / "Ganti Gambar".
  try {
    const emblemBytes = getUniversityEmblemUint8Array();
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 60, line: lineSpacing },
        children: [
          new ImageRun({
            type: 'png',
            data: emblemBytes,
            transformation: { width: 135, height: 135 },
          }),
        ],
      })
    );
  } catch (_err) {
    // Fallback gracefully in edge cases
    elements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 60, line: lineSpacing },
        children: [
          new TextRun({
            text: '[ LAMBANG / LOGO RESMI PERGURUAN TINGGI ]',
            bold: true,
            font: fontFamily,
            size: 20,
            color: '1E3A5F',
          }),
        ],
      })
    );
  }

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200, line: lineSpacing },
      children: [
        new TextRun({
          text: '(Lambang resmi kampus — klik kanan gambar untuk "Ganti Gambar / Change Picture")',
          italics: true,
          font: fontFamily,
          size: 16,
          color: '64748B',
        }),
      ],
    })
  );

  // 5. Identitas Penulis
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 60, line: lineSpacing },
      children: [
        new TextRun({
          text: 'Oleh:',
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40, line: lineSpacing },
      children: [
        new TextRun({
          text: details.studentName.toUpperCase(),
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font: fontFamily,
          size: 24,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 360, line: lineSpacing },
      children: [
        new TextRun({
          text: `NIM. ${details.studentId}`,
          bold: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  // 6. Footer Lembaga & Tahun (Centered, Bold, 12pt)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 40, line: lineSpacing },
      children: [
        new TextRun({
          text: `PROGRAM STUDI ${details.studyProgram.toUpperCase()}`,
          bold: true,
          font: fontFamily,
          size: 24,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40, line: lineSpacing },
      children: [
        new TextRun({
          text: details.faculty.toUpperCase(),
          bold: true,
          font: fontFamily,
          size: 24,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40, line: lineSpacing },
      children: [
        new TextRun({
          text: details.institution.toUpperCase(),
          bold: true,
          font: fontFamily,
          size: 24,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240, line: lineSpacing },
      children: [
        new TextRun({
          text: `${details.cityLocation.toUpperCase()}, ${details.year}`,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  // Dedicated PageBreak after Cover Page
  elements.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  return elements;
}

/**
 * Builds Lembar Persetujuan Pembimbing for Word (.docx).
 */
function buildApprovalAdvisorDocx(
  details: PreliminarySheetDetails,
  fontFamily: string,
  lineSpacing: number
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Header Title
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 60, line: lineSpacing },
      children: [
        new TextRun({
          text: 'LEMBAR PERSETUJUAN PEMBIMBING',
          bold: true,
          font: fontFamily,
          size: 28, // 14pt
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240, line: lineSpacing },
      children: [
        new TextRun({
          text: `Naskah Ujian Sidang ${details.degreeLabel}`,
          italics: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  // Metadata Penulis & Karya (Tanpa Tabel - Menggunakan Paragraph Berformat Rapi)
  const metaLines = [
    { label: `Judul ${details.degreeLabel}`, value: details.title, isBold: true },
    { label: 'Nama Mahasiswa', value: details.studentName, isBold: false },
    { label: 'NIM', value: details.studentId, isBold: false },
    { label: 'Program Studi', value: details.studyProgram, isBold: false },
    { label: 'Fakultas', value: details.faculty, isBold: false },
  ];

  for (const m of metaLines) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 360 },
        spacing: { before: 20, after: 20, line: lineSpacing },
        children: [
          new TextRun({
            text: `${m.label.padEnd(18, ' ')} : `,
            bold: true,
            font: fontFamily,
            size: 22,
          }),
          new TextRun({
            text: m.value,
            bold: m.isBold,
            font: fontFamily,
            size: 22,
          }),
        ],
      })
    );
  }

  // Approval statement
  elements.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 180, after: 140, line: lineSpacing },
      children: [
        new TextRun({
          text: `Naskah ${details.degreeLabel} ini telah diperiksa secara seksama, dikoreksi sesuai kaidah akademik, dan dinyatakan `,
          font: fontFamily,
          size: 22,
        }),
        new TextRun({
          text: 'DISETUJUI',
          bold: true,
          font: fontFamily,
          size: 22,
        }),
        new TextRun({
          text: ` untuk diajukan serta diujikan pada Sidang Ujian ${details.degreeLabel} Program Studi ${details.studyProgram} ${details.institution}.`,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  // Tanggal & Kota
  elements.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 80, after: 140, line: lineSpacing },
      children: [
        new TextRun({
          text: `${details.cityLocation}, .................................... ${details.year}`,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  // Tanda Tangan Pembimbing I & II (Tanpa Tabel - Menggunakan Paragraph Bersih)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 40, after: 360, line: lineSpacing },
      children: [
        new TextRun({
          text: 'Dosen Pembimbing I,',
          bold: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );
  elements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 20, line: lineSpacing },
      children: [
        new TextRun({
          text: details.advisor1,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );
  elements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 140, line: lineSpacing },
      children: [
        new TextRun({
          text: 'NIP/NIDN. ........................................',
          font: fontFamily,
          size: 20,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 40, after: 360, line: lineSpacing },
      children: [
        new TextRun({
          text: 'Dosen Pembimbing II,',
          bold: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );
  elements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 20, line: lineSpacing },
      children: [
        new TextRun({
          text: details.advisor2,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );
  elements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 140, line: lineSpacing },
      children: [
        new TextRun({
          text: 'NIP/NIDN. ........................................',
          font: fontFamily,
          size: 20,
        }),
      ],
    })
  );

  // Mengetahui Ketua Program Studi
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 40, line: lineSpacing },
      children: [
        new TextRun({
          text: 'Mengetahui,',
          bold: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600, line: lineSpacing },
      children: [
        new TextRun({
          text: `Ketua Program Studi ${details.studyProgram}`,
          bold: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 20, line: lineSpacing },
      children: [
        new TextRun({
          text: details.headOfDepartment,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 180, line: lineSpacing },
      children: [
        new TextRun({
          text: 'NIP/NIDN. ........................................',
          font: fontFamily,
          size: 20,
        }),
      ],
    })
  );

  // PageBreak
  elements.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  return elements;
}

/**
 * Builds Lembar Pengesahan Penguji for Word (.docx).
 */
function buildApprovalExaminersDocx(
  details: PreliminarySheetDetails,
  fontFamily: string,
  lineSpacing: number
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  // Title
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 60, line: lineSpacing },
      children: [
        new TextRun({
          text: 'LEMBAR PENGESAHAN PENGUJI',
          bold: true,
          font: fontFamily,
          size: 28,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240, line: lineSpacing },
      children: [
        new TextRun({
          text: `Dewan Penguji Sidang Ujian ${details.degreeLabel}`,
          italics: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  // Metadata Naskah (Tanpa Tabel)
  const metaLines = [
    { label: `Judul ${details.degreeLabel}`, value: details.title, isBold: true },
    { label: 'Nama Mahasiswa', value: details.studentName, isBold: false },
    { label: 'NIM', value: details.studentId, isBold: false },
    { label: 'Program Studi', value: details.studyProgram, isBold: false },
  ];

  for (const m of metaLines) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 360 },
        spacing: { before: 20, after: 20, line: lineSpacing },
        children: [
          new TextRun({
            text: `${m.label.padEnd(18, ' ')} : `,
            bold: true,
            font: fontFamily,
            size: 22,
          }),
          new TextRun({
            text: m.value,
            bold: m.isBold,
            font: fontFamily,
            size: 22,
          }),
        ],
      })
    );
  }

  // Passing statement
  elements.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 180, after: 180, line: lineSpacing },
      children: [
        new TextRun({
          text: `Naskah ${details.degreeLabel} ini telah dipertahankan di hadapan Dewan Penguji dan dinyatakan `,
          font: fontFamily,
          size: 22,
        }),
        new TextRun({
          text: 'LULUS',
          bold: true,
          font: fontFamily,
          size: 22,
        }),
        new TextRun({
          text: ` pada Sidang Ujian ${details.degreeLabel} pada hari ........................., tanggal ........................................ ${details.year}.`,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  // Tim Dewan Penguji Table with clean single borders
  elements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 100, after: 80, line: lineSpacing },
      children: [
        new TextRun({
          text: 'TIM DEWAN PENGUJI:',
          bold: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  const dewanRows = [
    { no: 'No', role: 'Jabatan', name: 'Nama Lengkap & Gelar', sign: 'Tanda Tangan', isHeader: true },
    { no: '1.', role: 'Ketua Penguji', name: '......................................................', sign: '( ................................ )', isHeader: false },
    { no: '2.', role: 'Anggota Penguji I', name: '......................................................', sign: '( ................................ )', isHeader: false },
    { no: '3.', role: 'Anggota Penguji II', name: '......................................................', sign: '( ................................ )', isHeader: false },
  ];

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: cellCleanBorder,
      rows: dewanRows.map(
        (row) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 10, type: WidthType.PERCENTAGE },
                borders: cellCleanBorder,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 60, after: 60, line: lineSpacing },
                    children: [new TextRun({ text: row.no, bold: row.isHeader, font: fontFamily, size: 20 })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: cellCleanBorder,
                children: [
                  new Paragraph({
                    spacing: { before: 60, after: 60, line: lineSpacing },
                    children: [new TextRun({ text: row.role, bold: row.isHeader, font: fontFamily, size: 20 })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 35, type: WidthType.PERCENTAGE },
                borders: cellCleanBorder,
                children: [
                  new Paragraph({
                    spacing: { before: 60, after: 60, line: lineSpacing },
                    children: [new TextRun({ text: row.name, bold: row.isHeader, font: fontFamily, size: 20 })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                borders: cellCleanBorder,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 60, after: 60, line: lineSpacing },
                    children: [new TextRun({ text: row.sign, bold: row.isHeader, font: fontFamily, size: 20 })],
                  }),
                ],
              }),
            ],
          })
      ),
    })
  );

  // Mengesahkan Dekan Fakultas
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 40, line: lineSpacing },
      children: [
        new TextRun({
          text: 'Mengesahkan,',
          bold: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600, line: lineSpacing },
      children: [
        new TextRun({
          text: `Dekan ${details.faculty}`,
          bold: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 20, line: lineSpacing },
      children: [
        new TextRun({
          text: details.deanName,
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 180, line: lineSpacing },
      children: [
        new TextRun({
          text: 'NIP/NIDN. ........................................',
          font: fontFamily,
          size: 20,
        }),
      ],
    })
  );

  // PageBreak
  elements.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  return elements;
}

/**
 * Builds Surat Pernyataan Keaslian for Word (.docx).
 * Formatted with precise compact spacing so it is GUARANTEED to fit on EXACTLY 1 page,
 * completely table-free (no tables or border lines).
 */
function buildStatementDocx(
  details: PreliminarySheetDetails,
  fontFamily: string,
  _lineSpacing: number
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  // Use compact single line spacing (240 dxa = 1.0 spacing) so the entire affidavit strictly fits in 1 single page!
  const statementLineSpacing = 240;
  const bodyFontSize = 21; // 10.5pt - standard readable Indonesian academic affidavit size

  // Title
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 30, line: statementLineSpacing },
      children: [
        new TextRun({
          text: 'SURAT PERNYATAAN KEASLIAN KARYA ILMIAH',
          bold: true,
          font: fontFamily,
          size: 26, // 13pt
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120, line: statementLineSpacing },
      children: [
        new TextRun({
          text: 'Bebas Plagiarisme & Keaslian Naskah Akademik',
          italics: true,
          font: fontFamily,
          size: 20, // 10pt
        }),
      ],
    })
  );

  // Intro: Yang bertanda tangan di bawah ini:
  elements.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 30, after: 30, line: statementLineSpacing },
      children: [
        new TextRun({
          text: 'Yang bertanda tangan di bawah ini:',
          bold: true,
          font: fontFamily,
          size: bodyFontSize,
        }),
      ],
    })
  );

  // Metadata: strictly NO table. Uses clean left indented paragraphs.
  const metaLines = [
    { label: 'Nama Lengkap', value: details.studentName, isBold: true },
    { label: 'NIM', value: details.studentId, isBold: true },
    { label: 'Program Studi', value: details.studyProgram, isBold: false },
    { label: 'Fakultas', value: details.faculty, isBold: false },
    { label: 'Perguruan Tinggi', value: details.institution, isBold: false },
  ];

  for (const item of metaLines) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 360 }, // 0.63 cm indent
        spacing: { before: 15, after: 15, line: statementLineSpacing },
        children: [
          new TextRun({
            text: `${item.label.padEnd(18, ' ')} : `,
            bold: true,
            font: fontFamily,
            size: bodyFontSize,
          }),
          new TextRun({
            text: item.value,
            bold: item.isBold,
            font: fontFamily,
            size: bodyFontSize,
          }),
        ],
      })
    );
  }

  // Declaration intro
  elements.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 60, after: 30, line: statementLineSpacing },
      children: [
        new TextRun({
          text: `Dengan ini menyatakan dengan penuh kesadaran dan tanggung jawab bahwa ${details.degreeLabel} yang berjudul:`,
          font: fontFamily,
          size: bodyFontSize,
        }),
      ],
    })
  );

  // Title quote
  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 30, after: 40, line: statementLineSpacing },
      children: [
        new TextRun({
          text: `"${details.title}"`,
          bold: true,
          font: fontFamily,
          size: 22,
        }),
      ],
    })
  );

  // 3 concise declaration points
  elements.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 540 },
      spacing: { before: 15, after: 30, line: statementLineSpacing },
      children: [
        new TextRun({
          text: '1. Adalah benar-benar hasil karya ilmiah mandiri saya sendiri, bukan merupakan tiruan, saduran, atau penjiplakan (plagiarisme) dari karya orang lain, serta belum pernah diajukan untuk memperoleh gelar akademik di perguruan tinggi mana pun.',
          font: fontFamily,
          size: bodyFontSize,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 540 },
      spacing: { before: 15, after: 30, line: statementLineSpacing },
      children: [
        new TextRun({
          text: '2. Semua sumber data, teori, gagasan, dan rujukan kutipan telah dicantumkan dalam teks naskah dan disebutkan dalam Daftar Pustaka sesuai kaidah serta etika penulisan karya ilmiah yang berlaku.',
          font: fontFamily,
          size: bodyFontSize,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 540 },
      spacing: { before: 15, after: 30, line: statementLineSpacing },
      children: [
        new TextRun({
          text: '3. Apabila di kemudian hari terbukti atau dapat dibuktikan terdapat unsur plagiarisme atau fabrikasi data dalam karya ini, saya bersedia menerima sanksi akademik berupa pembatalan kelulusan dan pencabutan gelar akademik yang diperoleh, serta sanksi hukum sesuai ketentuan peraturan perundang-undangan.',
          font: fontFamily,
          size: bodyFontSize,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: 540 },
      spacing: { before: 15, after: 60, line: statementLineSpacing },
      children: [
        new TextRun({
          text: 'Demikian surat pernyataan ini saya buat dengan sebenarnya dalam keadaan sehat jasmani dan rohani, tanpa paksaan maupun tekanan dari pihak mana pun.',
          font: fontFamily,
          size: bodyFontSize,
        }),
      ],
    })
  );

  // Tanda Tangan Mahasiswa & Meterai Tempel Rp 10.000 (NO TABLE - clean right-aligned paragraphs)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 40, after: 15, line: statementLineSpacing },
      children: [
        new TextRun({
          text: `${details.cityLocation}, .................................... ${details.year}`,
          font: fontFamily,
          size: bodyFontSize,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 30, line: statementLineSpacing },
      children: [
        new TextRun({
          text: 'Yang membuat pernyataan,',
          bold: true,
          font: fontFamily,
          size: bodyFontSize,
        }),
      ],
    })
  );

  // Meterai indicator (compact text run leaving appropriate space for physical stamp and ink signature)
  elements.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 20, after: 360, line: statementLineSpacing },
      children: [
        new TextRun({
          text: '[ METERAI TEMPEL Rp 10.000 ]\n(Tanda tangan basah menyentuh meterai)',
          font: fontFamily,
          size: 16, // 8pt
          italics: true,
          color: '7A4B00',
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 15, line: statementLineSpacing },
      children: [
        new TextRun({
          text: details.studentName.toUpperCase(),
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font: fontFamily,
          size: bodyFontSize,
        }),
      ],
    })
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 0, after: 40, line: statementLineSpacing },
      children: [
        new TextRun({
          text: `NIM. ${details.studentId}`,
          bold: true,
          font: fontFamily,
          size: 20,
        }),
      ],
    })
  );

  // PageBreak
  elements.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  return elements;
}

/**
 * Builds an authentic academic Word table conforming to thesis/APA standards:
 * - Bold table title above the table
 * - Clean horizontal borders (solid top border, solid header bottom, solid table bottom, no vertical borders)
 * - Single line spacing, slightly reduced font size (10pt = 20 half-points) so multi-column data fits cleanly
 * - Source note and student guidance box below table
 */
function buildAcademicTableDocx(
  tableData: AcademicTableData,
  fontFamily: string,
  lineSpacing: number
): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const tableFontSize = 20; // 10pt
  const tableLineSpacing = 240; // 1.0 single spacing for tables

  // 1. Table Title (Left-aligned, Bold, 11pt)
  if (tableData.title) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 240, after: 60, line: lineSpacing },
        children: [
          new TextRun({
            text: tableData.title,
            bold: true,
            font: fontFamily,
            size: 22, // 11pt
            color: '0F172A',
          }),
        ],
      })
    );
  }

  // 2. Borders conforming to academic thesis standards (No vertical borders, solid horizontal borders)
  const headerBorder = {
    top: { style: BorderStyle.SINGLE, size: 8, color: '0F172A' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const bodyBorder = {
    top: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const lastRowBorder = {
    top: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    bottom: { style: BorderStyle.SINGLE, size: 8, color: '0F172A' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  const totalCols = Math.max(1, tableData.headers.length);
  const colWidthPercent = Math.floor(100 / totalCols);

  const tableRows: TableRow[] = [];

  // Header row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: tableData.headers.map(
        (h) =>
          new TableCell({
            borders: headerBorder,
            width: { size: colWidthPercent, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 20, after: 20, line: tableLineSpacing },
                children: [
                  new TextRun({
                    text: h,
                    bold: true,
                    font: fontFamily,
                    size: tableFontSize,
                    color: '0F172A',
                  }),
                ],
              }),
            ],
          })
      ),
    })
  );

  // Data rows
  tableData.rows.forEach((row, rIdx) => {
    const isLast = rIdx === tableData.rows.length - 1;
    const borderToUse = isLast ? lastRowBorder : bodyBorder;

    tableRows.push(
      new TableRow({
        cantSplit: true,
        children: tableData.headers.map((_, cIdx) => {
          const rawCell = row[cIdx] || '';
          // Support <br> split
          const subLines = rawCell.split(/<br\s*\/?>/i);

          return new TableCell({
            borders: borderToUse,
            width: { size: colWidthPercent, type: WidthType.PERCENTAGE },
            margins: { top: 70, bottom: 70, left: 100, right: 100 },
            children: subLines.map(
              (lineText, lIdx) =>
                new Paragraph({
                  alignment: cIdx === 0 && rawCell.length < 5 ? AlignmentType.CENTER : AlignmentType.LEFT,
                  spacing: { before: 10, after: 10, line: tableLineSpacing },
                  children: [
                    new TextRun({
                      text: lineText.trim(),
                      font: fontFamily,
                      size: tableFontSize,
                      color: '1E293B',
                    }),
                  ],
                })
            ),
          });
        }),
      })
    );
  });

  elements.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    })
  );

  // 3. Table Source (Italic, 9pt)
  if (tableData.source) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 40, after: 40, line: tableLineSpacing },
        children: [
          new TextRun({
            text: tableData.source,
            italics: true,
            font: fontFamily,
            size: 18, // 9pt
            color: '64748B',
          }),
        ],
      })
    );
  }

  // 4. Student Guidance Box (Catatan Panduan Mahasiswa: Data yang Harus Dicari & Disiapkan)
  if (tableData.studentGuide && tableData.studentGuide.length > 0) {
    elements.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 280 },
        spacing: { before: 40, after: 20, line: tableLineSpacing },
        children: [
          new TextRun({
            text: `[ PANDUAN PENGISIAN DATA BAGI MAHASISWA ]`,
            bold: true,
            font: fontFamily,
            size: 18,
            color: '0369A1',
          }),
        ],
      })
    );

    tableData.studentGuide.forEach((guideItem) => {
      elements.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: { left: 360 },
          spacing: { before: 15, after: 15, line: tableLineSpacing },
          children: [
            new TextRun({
              text: guideItem,
              italics: true,
              font: fontFamily,
              size: 18,
              color: '0284C7',
            }),
          ],
        })
      );
    });

    elements.push(
      new Paragraph({
        spacing: { before: 0, after: 140, line: tableLineSpacing },
        children: [],
      })
    );
  }

  return elements;
}

/**
 * Splits paragraph text into Docx TextRuns, marking in-text citations with
 * dark green font color, bold weight, and soft green background highlight
 * so students and supervisors can immediately recognize citations in the downloaded Word (.docx) file.
 */
function buildDocxTextRunsWithCitationHighlights(
  text: string,
  fontFamily: string,
  fontSize: number,
  citationTokens: string[]
): TextRun[] {
  if (!text || citationTokens.length === 0) {
    return [
      new TextRun({
        text,
        font: fontFamily,
        size: fontSize,
      }),
    ];
  }

  const escaped = citationTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(regex);
  const runs: TextRun[] = [];

  for (const part of parts) {
    if (!part) continue;
    const isCitation = citationTokens.includes(part);
    if (isCitation) {
      runs.push(
        new TextRun({
          text: part,
          font: fontFamily,
          size: fontSize,
          color: '0F5132', // Rich academic green text
          bold: true,
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          font: fontFamily,
          size: fontSize,
        })
      );
    }
  }

  return runs.length > 0
    ? runs
    : [
        new TextRun({
          text,
          font: fontFamily,
          size: fontSize,
        }),
      ];
}

/**
 * Generates a valid Microsoft Word (.docx) document conforming to academic thesis standards:
 * - Margins: Left 4cm, Top 3cm, Right 3cm, Bottom 3cm (Standard Indonesian Skripsi/Tesis)
 * - Font: Times New Roman or Arial 12pt
 * - Spacing: 1.5 line spacing (360 dxa)
 * - First line indent: 720 dxa (~1.27 cm)
 * - Proper Headings with outline levels
 * - Page numbers in footer
 * - Native formatted preliminary pages (Cover, Persetujuan, Pengesahan, Pernyataan Keaslian)
 * - Green highlighted in-text citations so students immediately recognize citations
 */
export async function generateDocxBlob(
  content: string,
  formData: Partial<AcademicFormData>
): Promise<Blob> {
  const topicOrField = formData.studyProgramName || formData.topic || formData.fieldOfStudy || 'Umum';
  const consolidatedContent = reconcileDocumentCitationsAndBibliography(content, topicOrField);
  const { sheets, bodyContent } = splitPreliminaryPagesAndBody(consolidatedContent, formData);
  const cleanBody = cleanAcademicMarkdownSymbols(bodyContent);
  const sections = parseAcademicMarkdown(cleanBody);
  const docxElements: (Paragraph | Table)[] = [];

  // Extract all in-text citation strings from the manuscript to highlight in Word (.docx)
  const citationReport = crossCheckCitationsWithBibliography(
    cleanBody,
    formData.studyProgramName || formData.topic || formData.fieldOfStudy
  );
  const citationTokens = citationReport.matches
    .map((m) => m.rawCitation.trim())
    .filter((c) => c.length >= 4)
    .sort((a, b) => b.length - a.length);

  const fontFamily = formData.manualGuidelines?.fontFamily || 'Times New Roman';
  const fontSize = 24; // 12pt = 24 half-points
  const heading1Size = 28; // 14pt
  const heading2Size = 26; // 13pt
  const lineSpacing = 360; // 1.5 lines

  // 1. Process preliminary sheets if present
  if (sheets.length > 0) {
    for (const sheet of sheets) {
      if (sheet.type === 'cover') {
        docxElements.push(...buildCoverPageDocx(sheet.details, fontFamily, lineSpacing));
      } else if (sheet.type === 'approval_advisor') {
        docxElements.push(...buildApprovalAdvisorDocx(sheet.details, fontFamily, lineSpacing));
      } else if (sheet.type === 'approval_examiners') {
        docxElements.push(...buildApprovalExaminersDocx(sheet.details, fontFamily, lineSpacing));
      } else if (sheet.type === 'statement') {
        docxElements.push(...buildStatementDocx(sheet.details, fontFamily, lineSpacing));
      }
    }
  } else {
    // If no preliminary pages, render default title header on body start
    const titleText = formData.tentativeTitle || formData.topic || 'KARYA ILMIAH AKADEMIK';
    docxElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 240, line: lineSpacing },
        children: [
          new TextRun({
            text: titleText.toUpperCase(),
            bold: true,
            font: fontFamily,
            size: heading1Size,
          }),
        ],
      })
    );

    const prodiText = formData.studyProgramName || formData.studyProgramCategory || '';
    const degreeText = formData.degreeLevel || 'S1';
    docxElements.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 480, line: lineSpacing },
        children: [
          new TextRun({
            text: `[Draf Akademik ${degreeText} - Program Studi ${prodiText}]`,
            italics: true,
            font: fontFamily,
            size: 20, // 10pt
          }),
        ],
      })
    );
  }

  // 2. Parse and build academic body sections (BAB I, BAB II, etc.)
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx];
    const isFirstBodySection = sIdx === 0;

    // A. Check if this section is a BAB heading
    const chapterInfo = extractChapterInfo(section.content);
    if (chapterInfo.isChapter) {
      const babNum = chapterInfo.babNumber;
      let babTitle = section.subContent || chapterInfo.babTitle || '';

      // If babTitle wasn't resolved yet on the same line, lookahead to next section
      if (!babTitle && sIdx + 1 < sections.length) {
        const nextSec = sections[sIdx + 1];
        const nextClean = nextSec.content.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
        if (
          (nextSec.type === 'h1' || nextSec.type === 'h2' || nextSec.type === 'paragraph') &&
          !extractChapterInfo(nextClean).isChapter &&
          !/^(?:#{0,3}\s*)?(?:\d+\.|\d+\.\d+|[A-Z]\.)/i.test(nextClean) &&
          nextClean.split(/\s+/).length <= 12
        ) {
          babTitle = nextClean.toUpperCase();
          sIdx++; // consume next section!
        }
      }

      // Paragraph 1: BAB Number (e.g. "BAB I") - Strictly Centered, 14pt, Bold, NO indent
      docxElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          indent: { left: 0, right: 0, firstLine: 0 },
          keepNext: true,
          spacing: {
            before: isFirstBodySection ? 120 : 360,
            after: babTitle ? 60 : 180,
            line: lineSpacing,
          },
          children: [
            new TextRun({
              text: babNum.toUpperCase(),
              bold: true,
              font: fontFamily,
              size: heading1Size,
            }),
          ],
        })
      );

      // Paragraph 2: BAB Title (e.g. "PENDAHULUAN") - Centered directly beneath BAB Number, 14pt, Bold, NO indent
      if (babTitle) {
        docxElements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            indent: { left: 0, right: 0, firstLine: 0 },
            keepNext: true,
            spacing: { before: 0, after: 240, line: lineSpacing },
            children: [
              new TextRun({
                text: babTitle.toUpperCase(),
                bold: true,
                font: fontFamily,
                size: heading1Size,
              }),
            ],
          })
        );
      }
      continue;
    }

    // B. Check for major centered academic section titles (e.g. "DAFTAR PUSTAKA", "ABSTRAK", "LAMPIRAN")
    if (isMajorCenteredAcademicTitle(section.content) || (section.type === 'h1' && !chapterInfo.isChapter)) {
      const isBibTitle =
        section.content.toUpperCase().includes('DAFTAR PUSTAKA') ||
        section.content.toUpperCase().includes('BIBLIOGRAPHY') ||
        section.content.toUpperCase().includes('REFERENSI');
      docxElements.push(
        new Paragraph({
          pageBreakBefore: isBibTitle,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          indent: { left: 0, right: 0, firstLine: 0 },
          keepNext: true,
          spacing: { before: 360, after: 180, line: lineSpacing },
          children: [
            new TextRun({
              text: section.content.toUpperCase(),
              bold: true,
              font: fontFamily,
              size: heading1Size,
            }),
          ],
        })
      );
      continue;
    }

    // C. Sub-chapter Headings (e.g. "1.1 Latar Belakang Masalah")
    if (section.type === 'h2') {
      docxElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.LEFT,
          indent: { left: 0, right: 0, firstLine: 0 },
          keepNext: true,
          spacing: { before: 240, after: 120, line: lineSpacing },
          children: [
            new TextRun({
              text: section.content,
              bold: true,
              font: fontFamily,
              size: heading2Size,
            }),
          ],
        })
      );
      continue;
    }

    // D. Sub-sub-chapter Headings (e.g. "1.1.1 Identifikasi Masalah")
    if (section.type === 'h3') {
      docxElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.LEFT,
          indent: { left: 0, right: 0, firstLine: 0 },
          keepNext: true,
          spacing: { before: 180, after: 100, line: lineSpacing },
          children: [
            new TextRun({
              text: section.content,
              bold: true,
              italics: true,
              font: fontFamily,
              size: fontSize,
            }),
          ],
        })
      );
      continue;
    }

    // E. Bullet items
    if (section.type === 'bullet') {
      const cleanBullet = section.content.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
      docxElements.push(
        new Paragraph({
          bullet: { level: 0 },
          indent: { left: 720 },
          spacing: { before: 60, after: 60, line: lineSpacing },
          children: buildDocxTextRunsWithCitationHighlights(
            cleanBullet,
            fontFamily,
            fontSize,
            citationTokens
          ),
        })
      );
      continue;
    }

    // F. Academic Tables
    if (section.type === 'table' && section.tableData) {
      docxElements.push(...buildAcademicTableDocx(section.tableData, fontFamily, lineSpacing));
      continue;
    }

    // G. Standard academic paragraph with first-line indent or APA hanging indent for bibliography
    const isBib = Boolean(section.isBibliographyEntry);
    docxElements.push(
      new Paragraph({
        alignment: isBib ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
        indent: isBib
          ? { left: 720, hanging: 720 } // APA 7th hanging indent: 1.27cm (720 dxa)
          : { firstLine: 720 }, // 1.27 cm first line indentation standard
        spacing: { before: 0, after: isBib ? 180 : 140, line: lineSpacing },
        children: isBib
          ? [
              new TextRun({
                text: section.content,
                font: fontFamily,
                size: fontSize,
              }),
            ]
          : buildDocxTextRunsWithCitationHighlights(
              section.content,
              fontFamily,
              fontSize,
              citationTokens
            ),
      })
    );
  }

  // Indonesian thesis margins (Kiri 4cm, Atas 3cm, Kanan 3cm, Bawah 3cm):
  // 1 cm = 567 twips/dxa.
  // Left = 4cm (2268 dxa), Top = 3cm (1701 dxa), Right = 3cm (1701 dxa), Bottom = 3cm (1701 dxa)
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1701,
              left: 2268,
              bottom: 1701,
              right: 1701,
            },
          },
          titlePage: sheets.length > 0 && sheets.some((s) => s.type === 'cover'),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    font: fontFamily,
                    size: 18,
                    text: 'Halaman ',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: fontFamily,
                    size: 18,
                  }),
                  new TextRun({
                    font: fontFamily,
                    size: 18,
                    text: ' dari ',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: fontFamily,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        },
        children: docxElements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}

export { downloadBlob } from './fileDownload.ts';
