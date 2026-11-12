# Peningkatan Akurasi Akademik & Kelengkapan Formal Skripsi & Tesis

Rencana arsitektur dan fungsionalitas untuk meningkatkan akurasi substantif naskah skripsi dan tesis mahasiswa (D3, D4, S1, S2, S3) melalui panduan kelengkapan per bab standar perguruan tinggi, generator halaman sampul dan lembar pengesahan resmi, serta verifikator keselarasan sitasi naskah.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan sesi klarifikasi interaktif, berikut keputusan strategis yang telah dikonfirmasi dan diselaraskan:

- **Confirmed Decision 1 (Panduan & Checklist Per Bab)**: Menyediakan panduan terstruktur interaktif dan checklist kelengkapan ilmiah pada setiap bab (Bab I sampai Bab V). Sistem akan memeriksa apakah naskah mahasiswa telah memenuhi seluruh komponen wajib buku pedoman penulisan skripsi/tesis Indonesia (misalnya: rumusan masalah terukur, batasan masalah, kerangka berpikir, triangulasi/uji statistik, dan kesimpulan yang menjawab rumusan).
- **Confirmed Decision 2 (Kelengkapan Formal Halaman Sampul & Pengesahan)**: Menambahkan generator instan halaman formal naskah (*Preliminary Pages*) langsung di ruang editor Word A4: Halaman Sampul Luar & Dalam, Lembar Persetujuan Pembimbing, Lembar Pengesahan Dewan Penguji, dan Surat Pernyataan Keaslian Karya Ilmiah.
- **Recommended Decision 3 (Akurasi Sitasi & Daftar Pustaka)**: Menghadirkan validator keselarasan kutipan naskah (*in-text citations* seperti `(Sutrisno, 2023)`) dengan entri Daftar Pustaka format APA 7th / IEEE / Chicago untuk mencegah referensi 'hantu' yang dikutip di teks tetapi absen di daftar pustaka.

---

## 1. Overview & Core Concept

### What It Does
Sistem bertransformasi menjadi pendamping penulisan naskah akademik yang presisi. Mahasiswa tidak hanya menghasilkan draf teks yang mengalir dan bebas klise, tetapi juga:
1. Mengetahui secara pasti butir-butir apa saja yang masih kurang pada Bab yang sedang disusunnya lewat **Checklist Standar Akademik Bab I–V**.
2. Memiliki **Halaman Kelengkapan Formal** (Cover resmi universitas, lembar pengesahan tanda tangan pembimbing, pernyataan keaslian) yang rapi dan terukur sesuai standar tata letak A4.
3. Memastikan setiap kutipan ilmiah dalam naskah memiliki rujukan yang valid pada bagian Daftar Pustaka.

### Target Audience & Persona
- Mahasiswa D3/D4, S1, S2, dan S3 yang sedang menyusun proposal, skripsi, tesis, atau disertasi dan membutuhkan naskah yang lolos uji kelayakan dosen pembimbing serta birokrasi fakultas.

### Key Value
- **Akurasi Substantif**: Menghilangkan kebingungan mahasiswa mengenai apa saja yang wajib ditulis pada setiap bab.
- **Kecepatan Administrasi**: Menghemat waktu berjam-jam dalam penataan format halaman sampul dan lembar pengesahan.
- **Integritas Ilmiah**: Menghilangkan kekeliruan sitasi yang lazim menjadi temuan dewan penguji saat sidang.

---

## 2. User Experience & Visual Design

### A. Alur Kerja Pengguna (User Flow)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             ALUR PENULISAN TERPADU                               │
└──────────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────┐     ┌──────────────────────────────────────────────────┐
│   Profil Riset Mahasiswa│────▶│ Form Penulisan Bab & Checklist Kelengkapan Bab   │
│ (NIM, Pembimbing, Lokus)│     │ • Panduan butir wajib Bab 1 s.d. Bab 5           │
└─────────────────────────┘     │ • Pilihan fokus generasi naskah                  │
                                └──────────────────────────────────────────────────┘
                                                          │
                                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     RUANG EDITOR WORD A4 (LIVE WORKSPACE)                        │
│ ┌───────────────────────────────────┐  ┌───────────────────────────────────────┐ │
│ │ Kertas Naskah A4 Realistis        │  │ Bilah Asisten Akademik (Sidebar)      │ │
│ │ • Halaman Sampul & Pengesahan     │  │ • Checklist Audit Kelengkapan Bab     │ │
│ │ • Isi Bab I - V Terformat Rapi    │  │ • Inspector Keselarasan Sitasi Teks   │ │
│ │ • Daftar Pustaka Terstandarisasi  │  │ • Pemoles Kalimat & Anti-Klise        │ │
│ └───────────────────────────────────┘  └───────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Ekspor Dokumen Word (.docx) Utuh dengan Lembar Pengesahan & Format Baku         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### B. Visual Identity & Theme
- **Nuansa & Gaya**: *Academic Editorial & University Publishing* — bernuansa formal, bersih, dan berwibawa khas penerbitan ilmiah.
- **Palet Warna**:
  - *Dominant Canvas (60%)*: `#F8FAFC` (Slate lembut) dan putih kertas murni (`#FFFFFF`).
  - *Structural Surfaces (30%)*: Border hairline `#E2E8F0`, header Navy Akademik `#1E3A5F`, aksen sky `#0284C7`.
  - *Accent & Status (10%)*: Emerald `#059669` untuk checklist terpenuhi, Amber `#D97706` untuk butir yang belum lengkap.
- **Tipografi**:
  - Display & Headings: `Plus Jakarta Sans` / `Outfit` yang modern dan berbobot.
  - Teks Naskah Word A4: Serif Times New Roman / Calibri dengan line-height 1.5 dan indentasi paragraf 1.27 cm.

---

## 3. Key Product Decisions & Trade-Offs

### Keputusan 1: Checklist Kelengkapan Interaktif per Bab
- **Pendekatan**: Pada formulir penyusunan Bab I–V dan panel samping Editor Word A4, sediakan panel checklist interaktif yang menganalisis isi naskah secara dinamis dan mendeteksi apakah komponen wajib (misal: Latar Belakang 4 Pilar, Rumusan Masalah bernomor, Tujuan Penelitian, Batasan Masalah) sudah termuat.
- **Alasan**: Dosen penguji dan pembimbing selalu memeriksa kelengkapan struktur bab sebelum membaca substansi mendalam. Panduan ini memberikan kepastian bagi mahasiswa.

### Keputusan 2: Generator Dokumen Preliminaries (Halaman Sampul & Pengesahan)
- **Pendekatan**: Memanfaatkan metadata dari Profil Riset (Nama Mahasiswa, NIM, Program Studi, Fakultas, Universitas, Dosen Pembimbing I & II) untuk merender halaman sampul formal dan lembar persetujuan/pengesahan yang dapat disematkan ke naskah atau diunduh secara independen.
- **Alasan**: Format sampul dan lembar pengesahan merupakan syarat wajib berkas ujian skripsi yang paling sering ditolak birokrasi kampus bila formatnya berantakan.

### Keputusan 3: Penyelarasan Sitasi In-Text dengan Daftar Pustaka
- **Pendekatan**: Algoritma regex cerdas yang memindai seluruh kutipan nama-tahun (misal: `(Sugiyono, 2021)`, `Menurut Arikunto (2020)`) di badan teks naskah, kemudian mencocokkannya dengan daftar entri pustaka di akhir naskah.
- **Alasan**: Referensi fiktif atau kutipan tanpa entri daftar pustaka merupakan pelanggaran etika akademik fatal dalam sidang skripsi/tesis.

---

## 4. Technical Architecture & Implementation Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KOMPONEN ARSITEKTUR                             │
└────────────────────────────────────────────────────────────────────────┘

 [App.tsx]
    │
    ├── [Header.tsx]
    │
    ├── [ResearchProfileView.tsx] ── (Nama, NIM, Pembimbing I & II, Kampus)
    │
    ├── [AcademicForm.tsx]
    │     └── [ChapterGuidelineChecklist.tsx] ── (Pedoman Baku Bab 1 s.d. 5)
    │
    ├── [DocumentEditor.tsx]
    │     ├── [PreliminaryPagesModal.tsx] ───── (Cover & Lembar Pengesahan)
    │     ├── [CitationInspectorPanel.tsx] ──── (Verifikasi Sitasi ↔ Pustaka)
    │     └── [A4PageSheet.tsx] ─────────────── (Visual Kertas Word A4)
    │
    └── [AcademicEvaluationView.tsx] ────────── (Audit Benang Merah)
```

### Rencana File & Modul yang Ditingkatkan:
1. **`src/data/academicConstants.ts`**: Menambahkan schema pedoman checklist standar bab (Bab 1 sampai Bab 5) berdasarkan konsensus buku pedoman penulisan skripsi Dikti/kampus negeri & swasta terkemuka di Indonesia.
2. **`src/utils/academicRules.ts`**:
   - Menambahkan fungsi `auditChapterCompleteness(chapterId, text)` untuk memeriksa kelengkapan elemen naskah.
   - Menambahkan fungsi `extractAndCrossCheckCitations(text)` untuk memetakan sitasi dalam teks vs daftar pustaka.
   - Menambahkan generator template teks Halaman Sampul dan Lembar Pengesahan.
3. **`src/components/PreliminaryPagesModal.tsx`**: Komponen modal baru untuk pratinjau dan penyisipan halaman sampul resmi (Cover Luar, Cover Dalam, Lembar Persetujuan Pembimbing, Lembar Pengesahan Penguji, Surat Pernyataan Keaslian).
4. **`src/components/DocumentEditor.tsx`**: Menambahkan bilah alat bantu checklist kelengkapan bab dan tombol generator halaman sampul/pengesahan ke dalam editor Word A4.
5. **`src/utils/docxExporter.ts`**: Mendukung ekspor halaman preliminer (cover dan lembar pengesahan) langsung ke dokumen Word `.docx` lengkap dengan penataan margin 4-4-3-3 cm dan perataan judul formal.
