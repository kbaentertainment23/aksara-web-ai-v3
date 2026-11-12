# Peningkatan Kualitas & Bobot Akademik Naskah Ilmiah (AI Skripsi & Tesis)

Rencana peningkatan komprehensif pada sistem pembentukan naskah akademik (Latar Belakang, Bab I, dan Judul Penelitian) agar memiliki kedalaman argumentasi ilmiah setara karya sivitas akademika perguruan tinggi, menerapkan logika piramida terbalik, analisis gap riset tajam, dan struktur 4 pilar baku.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Utama Berdasarkan Masukan Pengguna:**
> 1. **Alur Penalaran Deduktif Piramida Terbalik & Gap Riset**: Naskah tidak lagi menggunakan kalimat pengantar umum yang klise/berputar-putar, melainkan bergerak secara ketat dari konteks makro normatif (*das Sollen*), realitas empiris lapangan (*das Sein*), kritik kesenjangan riset terdahulu (*research gap*), hingga urgensi solusi penelitian.
> 2. **Standar 4 Pilar Latar Belakang (Bab I)**:
>    - **Pilar 1: Kondisi Ideal**: Tinjauan regulasi, standar keilmuan, dan teori rujukan utama.
>    - **Pilar 2: Fakta & Fenomena Empiris**: Bukti konkret di lapangan, observasi awal, dan indikator masalah riil.
>    - **Pilar 3: Gap Analisis & Posisi Riset**: Membedah keterbatasan studi terdahulu yang belum tuntas menjawab masalah.
>    - **Pilar 4: Urgensi & Kebaruan Pendekatan**: Justifikasi mengapa penelitian ini mutlak dibutuhkan dengan metode yang diusulkan.
> 3. **Formulasi Judul Riset Berbobot**: Judul wajib memuat variabel terukur (bebas, terikat, mediasi), lokus/subjek spesifik, dan indikator kontribusi keilmuan nyata.

---

## 1. Overview & Core Concept

Pengguna mendapati bahwa narasi draf yang dihasilkan sebelumnya masih terkesan generik, kurang bernas, dan belum mencerminkan gaya bahasa akademik formal yang kritis dan mendalam. 

Peningkatan ini memodifikasi:
1. **Engine Prompt System (Gemini 3.8 Flash)**: Menanamkan *academic reasoning framework* yang melarang kalimat klise pembuka (*fluff*), mewajibkan dialektika ilmiah, sintesis teori berlapis (Grand Theory, Middle-Range Theory, Applied Theory), dan koherensi antarparagraf.
2. **Mesin Penulisan Deterministic & Template Builder**: Memperbarui cadangan naskah bawaan agar mengikuti struktur 4 pilar terpadu dengan peristilahan EYD V / KBBI akademik formal dan penanda rujukan kredibel.
3. **Formulasi Judul Multi-Perspektif**: Menghasilkan judul dengan variabel operasional terukur, lokus kontekstual, desain analisis spesifik (bukan sekadar judul pendek abstrak).

---

## 2. Framework Penulisan Akademik 4 Pilar (Piramida Terbalik)

Naskah Latar Belakang dan Bab I akan disusun mengikuti arsitektur argumentatif berikut:

```
┌────────────────────────────────────────────────────────────────────────┐
│ PILAR 1: KONDISI IDEAL & LANDASAN NORMATIF (Das Sollen)                │
│ • Landasan teori rujukan utama & paradigma keilmuan kontemporer        │
│ • Standar baku, tujuan strategis, atau ekspektasi regulasi/kebijakan   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Dialektika Kesenjangan
┌───────────────────────────────────▼────────────────────────────────────┐
│ PILAR 2: FENOMENA MASALAH & GEJALA EMPIRIS (Das Sein)                  │
│ • Data faktual, gejala disfungsi, inefisiensi, atau anomali di lokus   │
│ • Dampak langsung bila masalah tersebut dibiarkan tanpa penanganan     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Kritik Literatur
┌───────────────────────────────────▼────────────────────────────────────┐
│ PILAR 3: GAP RISET & KETERBATASAN STUDI TERDAHULU (Research Gap)       │
│ • Empirical Gap: Inkonsistensi temuan antarpeneliti sebelumnya         │
│ • Theoretical/Methodological Gap: Sudut pandang yang belum dieksplorasi│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Justifikasi Ilmiah
┌───────────────────────────────────▼────────────────────────────────────┐
│ PILAR 4: URGENSI KAJIAN & SOLUSI METODOLOGIS TERARAH                   │
│ • Rasional ilmiah pemilihan lokus, subjek, dan variabel penelitian     │
│ • Kebaruan (novelty) dan kontribusi teoretis/praktis yang ditawarkan   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Komponen Perubahan Teknis

### A. Server Prompt Engineering (`server.ts`)
- **Peningkatan Instruksi Sistem (*System Instruction*)**:
  - Menyuntikkan aturan gaya bahasa akademik tingkat perguruan tinggi: menghindari kalimat pasif berlebihan, frasa generik seperti *"Dalam era globalisasi modern ini..."*, dan menggantinya dengan analisis sintesis berbasis premis ilmiah.
  - Mempertegas pembedaan kedalaman analisis per jenjang:
    - **S1**: Penerapan dan pengujian teori baku dengan bukti empiris kuantitatif/kualitatif yang terukur.
    - **S2**: Sintesis kritis literatur internasional, perdebatan paradigma, identifikasi *gap research* yang tajam.
    - **S3**: Eksplorasi ontologis, epistemologis, dan kontribusi konstruksi teori/model orisinal (*novelty* tinggi).
- **Format Keluaran Latar Belakang & Bab I**:
  - Membimbing model menyusun setiap subbab dengan hierarki argumentasi yang kokoh, transisi antarparagraf berbasis konjungsi intrakalimat dan antarkalimat ilmiah (*namun demikian*, *sejalan dengan premis tersebut*, *kendati demikian*, *konsekuensinya*).

### B. Formulasi Judul Penelitian Berbobot (`server.ts`)
- Setiap judul wajib memuat:
  1. Pola Hubungan Variabel (Asosiatif, Kausal, Komparatif, R&D, Eksploratif).
  2. Variabel Terukur (Variabel Eksogen $X$, Endogen $Y$, Intervening/Moderating $Z$).
  3. Lokus & Populasi Spesifik (bukan generalisasi semu).
  4. Analisis Kelayakan Metodologis & Sumber Data.

### C. Pembaharuan UI & Panduan Form (`src/components/AcademicForm.tsx`)
- Menambahkan *micro-guidance* pada kolom Latar Belakang dan Masalah Penelitian yang mengarahkan mahasiswa mengisi poin kondisi ideal (*das Sollen*) dan masalah nyata (*das Sein*).
- Menambahkan opsi tingkat kedalaman naskah: *"Standar Akademik Formal"* vs *"Analitis Kritis Mendalam (Jurnal/Tesis)"*.

---

## 4. Rencana Verifikasi & Pengujian

1. **Unit Testing**:
   - Jalankan `npx --yes tsx --test src/utils/academicRules.test.ts` untuk memastikan validasi dan parsing naskah tidak terganggu.
2. **Kompilasi & Linting**:
   - Pastikan `npm run lint` dan `npm run build` berhasil bersih tanpa galat.
3. **Pengujian Browser (Headless Chromium)**:
   - Generate contoh naskah Latar Belakang Masalah (Bab I) dan bandingkan struktur narasi barunya: memastikan keberadaan alur 4 pilar, tidak ada kalimat generik kosong, dan perataan naskah di lembar Word A4 tertata rapi.
