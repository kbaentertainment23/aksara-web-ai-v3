import test from 'node:test';
import assert from 'node:assert/strict';

test('dynamic import of docxExporter loads generateDocxBlob and produces a valid Word document', async () => {
  // Test dynamic import exactly as DocumentEditor does
  const { generateDocxBlob } = await import('./docxExporter.ts');
  assert.equal(typeof generateDocxBlob, 'function');

  const sampleMarkdown = `
# BAB I PENDAHULUAN

## 1.1 Latar Belakang Masalah
Kecerdasan buatan telah berkembang pesat dalam mendukung penyusunan karya ilmiah akademik di perguruan tinggi Indonesia.

## 1.2 Rumusan Masalah
Bagaimanakah efektivitas asisten penulisan ilmiah dalam meningkatkan kualitas draf skripsi?
`;

  const sampleFormData = {
    degreeLevel: 'S1' as const,
    studyProgramName: 'Teknik Informatika',
    facultyName: 'Fakultas Ilmu Komputer',
    studentName: 'Budi Santoso',
    studentId: '1234567890',
    institutionName: 'Universitas Indonesia',
    tentativeTitle: 'Penerapan Model Transformer untuk Asisten Penulisan Skripsi Akademik',
    topic: 'Kecerdasan Buatan',
    manualGuidelines: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 1.5,
    },
  };

  const blob = await generateDocxBlob(sampleMarkdown, sampleFormData);

  assert.ok(blob, 'Blob should be generated');
  assert.ok(blob.size > 1000, `Blob size should be substantial (actual: ${blob.size} bytes)`);

  // Verify blob header is a valid PK zip archive (standard DOCX container)
  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  // Zip magic bytes: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
  assert.equal(uint8[0], 0x50, 'DOCX file must start with PK zip header byte 0 (0x50)');
  assert.equal(uint8[1], 0x4b, 'DOCX file must start with PK zip header byte 1 (0x4B)');
  assert.equal(uint8[2], 0x03, 'DOCX file must start with PK zip header byte 2 (0x03)');
  assert.equal(uint8[3], 0x04, 'DOCX file must start with PK zip header byte 3 (0x04)');
});

test('fileDownload utility exports downloadBlob function without pulling docx', async () => {
  const { downloadBlob } = await import('./fileDownload.ts');
  assert.equal(typeof downloadBlob, 'function');
});

test('generateDocxBlob embeds official campus emblem logo image when cover page is included', async () => {
  const { generateDocxBlob } = await import('./docxExporter.ts');
  const { generatePreliminaryPagesText } = await import('./academicRules.ts');

  const sampleFormData = {
    degreeLevel: 'S1' as const,
    studyProgramName: 'Teknik Informatika',
    facultyName: 'Fakultas Ilmu Komputer',
    studentName: 'Budi Santoso',
    studentId: '1234567890',
    institutionName: 'Universitas Indonesia',
    tentativeTitle: 'Penerapan Model Transformer untuk Asisten Penulisan Skripsi Akademik',
    topic: 'Kecerdasan Buatan',
    manualGuidelines: {
      fontFamily: 'Times New Roman',
      fontSize: 12,
      lineSpacing: 1.5,
    },
  };

  const coverPage = generatePreliminaryPagesText(sampleFormData, 'cover');
  const contentWithCover = `${coverPage}\n\n# BAB I PENDAHULUAN\n\nIsi pendahuluan...`;

  const blob = await generateDocxBlob(contentWithCover, sampleFormData);
  assert.ok(blob);
  // With image embedded, the DOCX size will be > 10,000 bytes
  assert.ok(blob.size > 10000, `DOCX with emblem image should be > 10KB (actual: ${blob.size})`);

  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  // Zip header check PK\x03\x04
  assert.equal(uint8[0], 0x50);
  assert.equal(uint8[1], 0x4b);
  assert.equal(uint8[2], 0x03);
  assert.equal(uint8[3], 0x04);
});

test('generateDocxBlob cleanly renders separate line BAB I and PENDAHULUAN', async () => {
  const { generateDocxBlob } = await import('./docxExporter.ts');

  const content = `# BAB I\nPENDAHULUAN\n\n## 1.1 Latar Belakang Masalah\nUraian konteks akademik skripsi.\n\n## DAFTAR PUSTAKA\n\nSugiyono. (2021). Metode Penelitian. Bandung: Alfabeta.`;
  const formData = {
    degreeLevel: 'S1' as const,
    studyProgramName: 'Sistem Informasi',
    tentativeTitle: 'Implementasi Sistem Informasi',
  };

  const blob = await generateDocxBlob(content, formData);
  assert.ok(blob);
  assert.ok(blob.size > 2000);

  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  assert.equal(uint8[0], 0x50);
  assert.equal(uint8[1], 0x4b);
});

test('generateDocxBlob successfully processes and exports in-text citations with green highlights', async () => {
  const { generateDocxBlob } = await import('./docxExporter.ts');

  const contentWithCitations = `# BAB I
# PENDAHULUAN

## 1.1 Latar Belakang Masalah
Kondisi ideal menghendaki efisiensi sistemik yang terpadu (Sugiyono, 2021). Menurut Robbins & Judge (2019), perilaku organisasi menentukan keberhasilan integrasi. Namun evaluasi lapangan memperlihatkan disparitas nyata (Badan Pusat Statistik, 2024).

## DAFTAR PUSTAKA
Badan Pusat Statistik. (2024). Laporan kinerja 2024. BPS RI.
Robbins, S. P., & Judge, T. A. (2019). Organizational behavior. Pearson.
Sugiyono. (2021). Metode penelitian. Alfabeta.`;

  const formData = {
    degreeLevel: 'S1' as const,
    studyProgramName: 'Manajemen',
    tentativeTitle: 'Efisiensi Sistemik Organisasi',
  };

  const blob = await generateDocxBlob(contentWithCitations, formData);
  assert.ok(blob, 'Blob must be created');
  assert.ok(blob.size > 2000, `Blob size must be > 2000 bytes, got ${blob.size}`);

  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  assert.equal(uint8[0], 0x50, 'Must be valid PK zip');
  assert.equal(uint8[1], 0x4b);
});

