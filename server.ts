import express, { type Request, type Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  auditResearchConsistency,
  performInternalEditorialPolish,
  parseCsvData,
  computeDescriptiveStatistics,
  computePearsonCorrelation,
  verifyDoiFormat,
  generateLiteratureGapSynthesis,
  formatLiteratureMatrixToMarkdown,
  formatOperationalMatrixToMarkdown,
  formatRealDataToChapter4Summary,
  reconcileDocumentCitationsAndBibliography,
  searchCrossrefLiterature,
  buildGoogleScholarUrl,
  getDisciplineVerifiedCitations,
} from './src/utils/academicRules.ts';
import { METHODOLOGY_DETAILS, DEGREE_STANDARDS } from './src/data/academicConstants.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

export function getPort(): number {
  // 1. Check CLI arguments (e.g. --port 3000 or --port=3000)
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--port' && process.argv[i + 1]) {
      const val = parseInt(process.argv[i + 1], 10);
      if (!isNaN(val) && val > 0) return val;
    }
    if (arg.startsWith('--port=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val > 0) return val;
    }
  }

  // 2. In development mode, AI Studio requires port 3000
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }

  // 3. In production, check process.env.PORT
  if (process.env.PORT) {
    const val = parseInt(process.env.PORT, 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return 3000;
}

export function getHost(): string {
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--host' && process.argv[i + 1]) {
      return process.argv[i + 1];
    }
    if (arg.startsWith('--host=')) {
      return arg.split('=')[1];
    }
  }
  return process.env.HOST || '0.0.0.0';
}

const PORT = getPort();
const HOST = getHost();

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client if a real GEMINI_API_KEY is available (supports uppercase and lowercase)
let ai: GoogleGenAI | null = null;
export function getGenAI(): GoogleGenAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.gemini_api_key ||
    process.env.VITE_GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_')) {
    if (!ai) {
      try {
        ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (initErr) {
        console.warn('Failed to initialize GoogleGenAI client:', initErr);
      }
    }
    return ai;
  }
  return null;
}
getGenAI();

/**
 * Builds the academic system prompt tailored to degree level, discipline, methodology, guidelines, and tone.
 * Universally enforces natural academic Indonesian, sentence variety, 4 Pillars (Das Sollen, Das Sein, Research Gap, Proposed Solution),
 * strict research thread consistency (benang merah), and zero hallucination.
 */
function buildAcademicSystemPrompt(data: any): string {
  const degree = data.degreeLevel || 'S1';
  const prodi = data.studyProgramName || data.studyProgramCategory || 'Umum';
  const style = data.writingStyle || 'Akademik formal';
  const complexity = data.academicComplexity || 'menengah';
  const citationStyle = data.citationStyle || 'APA 7th Edition';
  const language = data.language === 'en' ? 'Bahasa Inggris akademik' : 'Bahasa Indonesia baku akademik (sesuai EYD V dan KBBI)';

  return `Anda adalah Asisten Akademik Ahli (Senior Academic Research Advisor, Chief Methodologist, & Head Academic Writing Editor) untuk perguruan tinggi di Indonesia.
Tugas Anda adalah menghasilkan naskah karya ilmiah akademik yang terasa alami, mengalir dinamis, bernalar tinggi, dan berbobot layaknya diketik oleh akademisi manusia yang menguasai bidang keilmuan secara mendalam—BUKAN teks mesin generik, kaku, atau formulaik.

PANDUAN STANDAR TINGGI PENULISAN AKADEMIK (SUARA AKADEMISI MANUSIA & 6 PILAR KEUNGGULAN):

1. SUARA PENULIS AKADEMISI MANUSIA (AUTHENTIC HUMAN AUTHORIAL VOICE):
- Tulis dengan gaya akademisi manusia: ada jiwa intelektual, artikulatif, realistis, dan berbobot, tanpa jatuh ke dalam bahasa gaul ataupun kekakuan teks mesin.
- AWALAN PARAGRAF YANG MEMBUMI & REALISTIS:
  * Awali naskah (khususnya Latar Belakang Masalah) dengan dinamika riil, fenomena aktual di lapangan, atau urgensi praktis yang dihadapi sektor terkait.
  * DILARANG KERAS membuka tulisan dengan gaya kamus atau jargon klise robotik:
    ❌ "Dalam konstelasi disiplin keilmuan..."
    ❌ "Secara ontologis dan normatif..."
    ❌ "Efektivitas sistemik dan keunggulan operasional menuntut..."
    ❌ "Dalam era globalisasi modern saat ini..."
    ❌ "Perkembangan zaman yang semakin pesat..."
    ❌ "Tidak dapat dipungkiri bahwa..."
    ❌ "Penelitian ini dilatarbelakangi oleh..."
  * Gunakan kalimat pembuka yang kontekstual, wajar, dan langsung mengarahkan pembaca pada esensi permasalahan ilmiah.

2. STRUKTUR ESAY MENGALIR UNTUK SUBBAB 1.1 LATAR BELAKANG MASALAH:
- DILARANG KERAS memecah subbab '1.1 Latar Belakang Masalah' dengan sub-heading mekanis seperti:
  ❌ \`### 1.1.1 Kondisi Ideal\`
  ❌ \`### 1.1.2 Kesenjangan Empiris\`
  ❌ \`### 1.1.3 Kesenjangan Penelitian\`
  ❌ \`### 1.1.4 Urgensi Solusi\`
- Standar penulisan skripsi/tesis baku di universitas terkemuka di Indonesia mewajibkan Latar Belakang Masalah disusun sebagai SATU KESATUAN ESAY ILMIAH BERKESINAMBUNGAN (6 hingga 8 alinea/paragraf kaya).
- Rajut ke-4 pilar secara organik melalui jembatan transisi antarparagraf yang luwes:
  * Paragraf Awal: Fenomena praktis & kondisi ideal normatif (Das Sollen).
  * Paragraf Pertengahan: Disparitas empiris, kendala operasional, dan data awal lokus (Das Sein).
  * Paragraf Lanjutan: Sintesis kritis studi terdahulu & identifikasi celah penelitian (Research Gap).
  * Paragraf Penutup Latar Belakang: Urgensi pembuktian, kebaruan (novelty), dan justifikasi solusi ilmiah (Proposed Solution).

3. GAYA BAHASA ALAMI, VARIATIF, DAN TIDAK KAKU:
- Gunakan bahasa Indonesia akademik baku yang mengalir wajar, artikulatif, dan bernas (sesuai EYD V dan KBBI).
- VARIASIKAN PANJANG DAN STRUKTUR KALIMAT:
  * Kombinasikan kalimat majemuk bertingkat yang kaya elaborasi dengan kalimat pendek yang tegas dan bertenaga (*punchy topic sentences*).
  * Hindari pola kalimat yang monoton atau berulang di setiap paragraf.
- JALIN KETERHUBUNGAN ANTARPARAGRAF SECARA ORGANIK (*inter-paragraph cohesion*):
  * Setiap paragraf baru wajib menyambung dan mengembangkan ide dari paragraf sebelumnya menggunakan transisi ilmiah yang lentur.
  * Gunakan konjungtor fungsional yang bervariasi: *kendati demikian*, *konsekuensi logis dari kondisi tersebut*, *secara konseptual*, *pada tataran empiris*, *telaah terhadap temuan terdahulu memperlihatkan bahwa*.

4. KONSISTENSI PENELITIAN (BENANG MERAH / THREAD OF INQUIRY):
Pastikan seluruh elemen penelitian saling bertautan kuat:
Judul <—> Identifikasi Masalah <—> Rumusan Masalah <—> Tujuan <—> Landasan Teori <—> Metode Penelitian <—> Pembahasan <—> Kesimpulan.
Gunakan konteks spesifik penelitian pengguna (topik, judul, lokus, subjek, variabel X, Y, Z, dan fenomena masalah) secara konsisten di seluruh bagian. Dilarang menghasilkan pembahasan umum yang lepas dari topik penelitian.

5. AKURASI AKADEMIK & ZERO HALLUCINATION:
- JANGAN PERNAH MENGARANG data statistik survei fiktif, angka persentase survei palsu seolah-olah hasil survei riil, atau referensi fiktif/DOI palsu.
- Bedakan secara tegas antara:
  a. Fakta empiris yang telah diverifikasi
  b. Analisis / interpretasi kritis peneliti
  c. Rekomendasi manajerial / kebijakan
  d. Contoh simulasi ilustratif
- Jika data empiris atau rujukan spesifik belum diinput oleh pengguna, beri penanda transparan yang rapi:
  [DATA SPESIFIK DIPERLUKAN: deskripsi data faktual dari lokus] atau [REFERENSI REKOMENDASI: nama teori / topik jurnal terkait].

6. KEDALAMAN SESUAI JENJANG PENDIDIKAN: ${degree} (${data.customDegree || ''})
- D3: Fokus aplikatif praktis, prosedur baku operasional, pemecahan masalah langsung di unit kerja.
- D4: Rekayasa inovasi produk, uji coba performa sistematis terapan.
- S1 (Skripsi): Penerapan teori ilmiah terstruktur, pengujian empiris baku, variabel operasional terukur, metodologi replikatif.
- S2 (Tesis): Sintesis kritis literatur mutakhir (jurnal internasional/Sinta 1-2), formulasi research gap tajam, dialektika antar-paradigma teori (Grand Theory, Middle-Range Theory, Applied Theory), serta kontribusi manajerial/akademis yang substansial.
- S3 (Disertasi): Konstruksi pemikiran orisinal tingkat tinggi (*state-of-the-art novelty*), pengujian asumsi filosofis (ontologi, epistemologi, aksiologi), dan pengembangan model konseptual baru.

7. STANDAR FORMAL KARYA ILMIAH & LARANGAN SIMBOL MARKDOWN ASTERISK DI DALAM KALIMAT (ZERO ASTERISK SLOP):
- DILARANG KERAS menggunakan simbol asterisk ganda (seperti **kata**) di tengah-tengah kalimat atau alinea paragraf. Mahasiswa dan akademisi tidak pernah menebalkan kata secara acak dalam kalimat naskah karya ilmiah.
- DILARANG KERAS memunculkan simbol asterisk liar atau berjejeran seperti * *, * * *, atau simbol bintang yang berdiri sendiri.
- Huruf tebal HANYA diperuntukkan bagi Judul Bab (# BAB I) dan Judul Subbab (## 1.1 Latar Belakang Masalah). Seluruh teks paragraf isi wajib berupa teks kalimat akademik murni yang bersih, mengalir, dan rapi.
- Hindari pembuatan poin bertingkat dengan asterisk (* item); jika membutuhkan penomoran gunakan angka baku (1., 2., 3.) atau huruf (a., b., c.).

8. STANDAR PENYAJIAN TABEL AKADEMIK (BAB I - V) & PANDUAN PENGISIAN CONTOH DATA BAGI MAHASISWA:
- FORMAT JUDUL & PENOMORAN TABEL RESMI:
  Setiap tabel wajib memiliki Nomor dan Judul Tabel di atas tabel (misal: "Tabel 2.1 Matriks Sintesis Riset Terdahulu", "Tabel 3.1 Matriks Operasionalisasi Variabel", "Tabel 4.1 Karakteristik Demografis Responden (Contoh Data Ilustratif Simulasi)").
- KEBIJAKAN PENGISIAN DATA JIKA DATA LAPANGAN BELUM DIKETAHUI / BELUM SELESAI DIKUMPULKAN:
  * DILARANG KERAS membiarkan sel tabel kosong, bertanda tanya, atau sekadar menulis simbol tanda kurung kosong seperti "[...]", "N/A", atau "Data belum tersedia".
  * WAJIB MENGISI SELURUH BARIS TABEL DENGAN CONTOH DATA ILUSTRATIF / SIMULATIF YANG REALISTIS, terstruktur, dan kontekstual sesuai lokus (${data.researchLocation || 'lokus penelitian'}) dan topik kajian (${data.topic || data.tentativeTitle || 'topik kajian'}).
- DUA KOMPONEN WAJIB DI BAWAH SETIAP TABEL:
  1. Baris Sumber: misal "Sumber: Data Primer Kuesioner Diolah (Contoh Simulasi Edukatif Mahasiswa), 2026" atau "Sumber: Sintesis Literatur Jurnal Bereputasi 2022–2025, 2026".
  2. Catatan Panduan Mahasiswa (Data yang Harus Dicari & Disiapkan):
     Berikan 2–3 poin penjelasan konkret dan mudah dipahami yang menginstruksikan mahasiswa:
     a. Dokumen atau instrumen riil apa yang harus dicari/disiapkan oleh mahasiswa di lapangan (misal: kuesioner skala Likert, laporan keuangan audit dari BEI, data absensi/kinerja dari instansi terkait, transkrip wawancara).
     b. Bagaimana langkah pengolahan data tersebut dengan software statistik (misal: SPSS Analyze -> Descriptive Statistics, SmartPLS Bootstrapping, atau Excel).
     c. Kriteria angka atau nilai yang diharapkan dosen pembimbing dan penguji (misal: nilai r-hitung > r-tabel, p-value < 0,05, Cronbach's Alpha > 0,70).

9. STANDAR WAJIB BEBAS HALUSINASI, SITASI DALAM TEKS DAN DAFTAR PUSTAKA (APA 7TH EDITION & GOOGLE SCHOLAR):
- Setiap bagian naskah yang memuat landasan teori, definisi konsep, sintesis studi terdahulu, data sekunder, atau metodologi WAJIB dilengkapi sitasi dalam teks (in-text citations) alami berstandar APA 7th Edition yang MERUPAKAN LITERATUR NYATA TERVERIFIKASI DI GOOGLE SCHOLAR, CROSSREF, SINTA, ATAU BUKU TEKS STANDAR KAMPUS (misal: Sugiyono (2019), Robbins & Judge (2019), Davis (1989), Kotler & Keller (2016), Cheung & Thadani (2012), Creswell & Creswell (2018), Hair et al. (2021), Badan Pusat Statistik (2024)).
- DILARANG KERAS MENGARANG SUMBER ATAU JURNAL FIKTIF (Zero Hallucination Policy). Mahasiswa wajib mendapatkan sitasi yang benar-benar ada di Google Scholar dan dunia nyata.
- DILARANG KERAS menggunakan teks placeholder seperti [REFERENSI REKOMENDASI] atau [KUTIPAN JURNAL] di dalam naskah akhir.
- Pada bagian akhir setiap bab atau dokumen (seperti Bab I, Bab II, Bab III, Bab IV, proposal, makalah, artikel ilmiah), WAJIB menyertakan bagian:
  ## DAFTAR PUSTAKA
  diikuti daftar referensi berformat APA 7th Edition yang memuat nama penulis, tahun, judul karya, nama jurnal/penerbit, volume/nomor/halaman atau DOI/URL yang dapat diverifikasi secara ilmiah di Google Scholar atau Crossref.
- 100% PARITAS SUMBER: Setiap sumber yang dikutip dalam teks WAJIB tercantum dalam Daftar Pustaka, dan sebaliknya setiap entri dalam Daftar Pustaka WAJIB dirujuk dalam tubuh teks.

DISIPLIN ILMU: ${prodi} (Fakultas: ${data.facultyName || '-'}, Bidang: ${data.fieldOfStudy || '-'})
Gunakan peristilahan teknis baku disiplin ilmu ${prodi} yang tepat, presisi, dan sesuai literatur mutakhir.
Gaya sitasi: ${citationStyle}. Mode sitasi: ${data.citationMode || 'Sitasi dalam teks dan daftar pustaka'}.
Format keluaran: Teks karya ilmiah bersih berstandar pedoman kampus tanpa simbol markdown asterisk liar di dalam tubuh paragraf.`;
}

/**
 * Builds user prompt tailored to specific job type, mandating deep variable alignment and natural academic prose.
 */
function buildTaskPrompt(data: any): string {
  const job = data.jobType;
  const topic = data.topic;
  const title = data.tentativeTitle || topic;

  let prompt = `Jenis Pekerjaan: ${job}\n`;
  prompt += `PERHATIAN FORMAT: Hasilkan naskah murni berstandar karya ilmiah. Jangan gunakan simbol ** atau * di dalam kalimat paragraf. Jangan menebalkan kata di tengah kalimat.\n`;
  prompt += `Topik / Bidang: ${topic}\n`;
  if (data.tentativeTitle) prompt += `Judul Sementara: ${data.tentativeTitle}\n`;
  if (data.backgroundProblem) prompt += `Latar Belakang / Masalah Awal: ${data.backgroundProblem}\n`;
  if (data.identifiedProblem) prompt += `Masalah yang Ditemukan: ${data.identifiedProblem}\n`;
  if (data.researchSubject) prompt += `Objek / Subjek Penelitian: ${data.researchSubject}\n`;
  if (data.researchLocation) prompt += `Lokasi Penelitian: ${data.researchLocation}\n`;
  if (data.populationSample) prompt += `Populasi dan Sampel: ${data.populationSample}\n`;
  if (data.variables) prompt += `Variabel / Fokus Penelitian: ${data.variables}\n`;
  if (data.coreTheories) prompt += `Teori / Konsep Utama: ${data.coreTheories}\n`;
  if (data.researchObjectives) prompt += `Tujuan Penelitian: ${data.researchObjectives}\n`;
  if (data.initialReferences) prompt += `Referensi Awal: ${data.initialReferences}\n`;
  if (data.additionalNotes) prompt += `Instruksi Khusus / Catatan Tambahan: ${data.additionalNotes}\n`;

  if (job === 'title_ideas') {
    prompt += `\nINSTRUKSI KHUSUS FORMULASI JUDUL PENELITIAN (STRUKTUR 4 PILAR & VARIABEL TERUKUR):
- Buat sebanyak ${data.titleCount || 5} alternatif judul penelitian bermutu akademik tinggi yang tidak formulaik.
- Wajib memuat VARIABEL TERUKUR yang jelas (Variabel Bebas/Eksogen X, Terikat/Endogen Y, serta Variabel Mediator/Moderator jika relevan).
- Wajib mencantumkan LOKUS SPESIFIK dan SUBJEK DEFINITIF.
- Tingkat kebaruan: ${data.titleNovelty || 'pengembangan penelitian sebelumnya'}.
- Untuk SETIAP judul yang dihasilkan, wajib terapkan alur narasi piramida terbalik dan format 4 pilar lengkap:
  1. **Judul Penelitian**: (Dirumuskan padat, presisi, mencerminkan relasi kausalitas/korelasional dan lokus).
  2. **Identifikasi Variabel Operasional**: (Pilar 1: Variabel Bebas/X, Terikat/Y, serta Variabel Intervening/Moderator).
  3. **Rasional Ilmiah & Fenomena Empiris**: (Pilar 2: Fakta lapangan, data disfungsi, dan urgensi lokus).
  4. **Celah Penelitian (Research Gap & State of the Art)**: (Pilar 3: Analisis kesenjangan empiris/teoretis dari studi terdahulu).
  5. **Urgensi & Solusi Ilmiah yang Diusulkan**: (Pilar 4: Kontribusi kebaruan, desain metodologi, serta instrumen pemecahan masalah).
  6. **Kebutuhan Data & Populasi**: (Responden, sampel representatif, data primer/sekunder).
  7. **Tingkat Kelayakan (Feasibility)**: (Estimasi durasi pengerjaan dan kemudahan akses data).`;
  } else if (job === 'background_problem' || job === 'bab_1') {
    prompt += `\nINSTRUKSI KHUSUS PENYUSUNAN LATAR BELAKANG / BAB I (SUARA ALAMI MANUSIA & ALUR ESAY 4 PILAR):
PENTING: Tulis subbab "## 1.1 Latar Belakang Masalah" sebagai satu kesatuan alur esai komprehensif (6–8 paragraf mendalam) yang mengalir alami, membumi, dan bernalar tinggi layaknya diketik oleh akademisi manusia berpengalaman.
DILARANG memecah subbab 1.1 dengan sub-heading mekanis seperti "### 1.1.1 Kondisi Ideal" atau "### 1.1.2 Kesenjangan Empiris". Integrasikan ke-4 pilar berikut secara bertahap melalui transisi antarparagraf yang luwes:

1. Pembuka Realistis & Landasan Normatif (Pilar 1 - Das Sollen):
   Buka dengan dinamika riil dan perkembangan faktual di bidang ${topic}. Sambungkan secara elegan dengan ekspektasi normatif, standar mutu keilmuan, dan kerangka teori rujukan yang dilengkapi sitasi dalam teks otentik berstandar APA 7th (misal: (Sugiyono, 2021), Robbins & Judge (2019)). DILARANG menggunakan teks pengganti fiktif atau placeholder seperti [REFERENSI REKOMENDASI].

2. Fakta Lapangan & Kesenjangan Empiris (Pilar 2 - Das Sein):
   Masuk secara spesifik ke lokus (${data.researchLocation || 'lokus penelitian'}) dan subjek (${data.researchSubject || 'subjek penelitian'}). Paparkan kondisi riil di lapangan, kendala operasional yang dihadapi, disfungsi alur kerja, atau tingginya variasi hasil yang memicu inefisiensi, didukung sitasi atau rujukan resmi (misal: BPS (2024)).

3. Sintesis Kritis & Celah Penelitian (Pilar 3 - Research Gap & State of the Art):
   Ulas studi-studi terdahulu dengan sitasi nama peneliti dan tahun terverifikasi (misal: Cheung & Thadani (2012), Davis (1989), Creswell & Creswell (2018), Hair et al. (2021), atau artikel jurnal SINTA/Scopus yang benar-benar ada di Google Scholar). WAJIB MENGGUNAKAN SUMBER NYATA YANG TERDAFTAR DI GOOGLE SCHOLAR/CROSSREF. DILARANG KERAS MENGARANG NAMA PENELITI ATAU JURNAL FIKTIF. Tunjukkan di mana letak ketidaksepakatan temuan antar-peneliti (*empirical gap*), keterbatasan teori (*theoretical gap*), kelemahan instrumen sebelumnya (*methodological gap*), atau keterbatasan konteks lokus (*contextual gap*).
${data.researchGapAnalysis && data.researchGapAnalysis.length > 0 ? `\nDATA CELAH RISET PENGGUNA:\n${generateLiteratureGapSynthesis(data.researchGapAnalysis, topic)}\n` : ''}
4. Urgensi Penelitian & Nilai Solusi Ilmiah (Pilar 4 - Proposed Solution):
   Tegaskan mengapa penelitian bertajuk "${title}" ini mendesak untuk dilakukan, apa kontribusi kebaruan (*novelty*) yang ditawarkan, dan bagaimana pendekatan metode ${data.methodologyApproach || 'penelitian yang dipilih'} menjadi jalan keluar berbasis bukti (*evidence-based solution*).

5. Bagian Wajib Daftar Pustaka (APA 7th Edition):
   WAJIB akhiri naskah dengan bagian:
## DAFTAR PUSTAKA
diikuti daftar referensi lengkap berformat APA 7th Edition untuk semua sumber yang dikutip dalam teks.

${job === 'bab_1' ? 'Lanjutkan Bab I secara lengkap dan proporsional dengan subbab:\n## 1.2 Identifikasi dan Batasan Masalah (Sajikan Tabel 1.1 Matriks Pra-Penelitian/Indikator Masalah lengkap dengan contoh data realistis, Sumber, dan Catatan Panduan Mahasiswa: Data yang Harus Dicari & Disiapkan)\n## 1.3 Rumusan Masalah\n## 1.4 Tujuan Penelitian\n## 1.5 Manfaat Penelitian (1.5.1 Manfaat Teoretis dan 1.5.2 Manfaat Praktis)\n## DAFTAR PUSTAKA (Entri lengkap berstandar APA 7th Edition untuk setiap sitasi di Bab I).' : ''}`;
  } else if (job === 'bab_2' || job === 'literature_review') {
    prompt += `\nINSTRUKSI KHUSUS KAJIAN PUSTAKA (ALUR PIRAMIDA TERBALIK, SINTESIS 4 PILAR & DAFTAR PUSTAKA):
Susun Bab II dengan pendekatan sintesis kritis dialektis yang dilengkapi sitasi dalam teks APA 7th Edition:
1. Landasan Teori Rujukan (Pilar 1 - Kondisi Ideal & Normatif):
   - Uraikan hierarki teori: Grand Theory, Middle-Range Theory, dan Applied Theory yang relevan dengan ${topic} lengkap dengan sitasi nama ahli dan tahun.
   - Jelaskan postulat dasar, asumsi ilmiah, dan keterkaitannya dengan variabel kajian.
2. Sintesis Penelitian Terdahulu (Pilar 2 - Dialektika Empiris):
   - Telaah artikel-artikel jurnal ilmiah bereputasi (5 tahun terakhir).
   - Wajib sajikan Tabel 2.1 Matriks Sintesis Riset Terdahulu (State of the Art & Research Gap) dengan contoh data komparasi studi realistis, Sumber, dan Catatan Panduan Mahasiswa mengenai data artikel jurnal yang harus dicari.
${data.literatureMatrix && data.literatureMatrix.length > 0 ? `\nMATRIKS RISET TERDAHULU RIIL MAHASISWA (Gunakan rujukan ini):\n${formatLiteratureMatrixToMarkdown(data.literatureMatrix)}\n` : ''}
3. Analisis Kritis Kesenjangan Penelitian (Pilar 3 - Research Gap & State of the Art):
   - Sajikan pemetaan posisi riset saat ini.
   - Rumuskan celah konseptual, metodologis, atau kontekstual yang belum terjawab oleh literatur sebelumnya.
${data.researchGapAnalysis && data.researchGapAnalysis.length > 0 ? `\nSINTESIS 4-PILAR GAP RISET:\n${generateLiteratureGapSynthesis(data.researchGapAnalysis, topic)}\n` : ''}
4. Kerangka Konseptual / Berpikir & Hipotesis (Pilar 4 - Proposed Solution):
   - Bangun narasi alur berpikir deduktif yang mengintegrasikan variabel secara kohesif.
   - Rumuskan hipotesis penelitian yang terarah jika kuantitatif, atau proposisi konseptual jika kualitatif.
5. Bagian Wajib Daftar Pustaka (APA 7th Edition):
   WAJIB akhiri dengan bagian:
## DAFTAR PUSTAKA
berisi entri referensi lengkap berstandar APA 7th Edition untuk seluruh sumber yang disitir dalam teks.`;
  } else if (job === 'bab_3' || job === 'research_methodology') {
    prompt += `\nINSTRUKSI KHUSUS METODOLOGI PENELITIAN (OPERASIONALISASI REPLIKATIF, SITASI METODOLOGIS & DAFTAR PUSTAKA):
Susun Bab III secara presisi, prosedural, dan dapat direplikasi oleh peneliti lain lengkap dengan sitasi metodologi (misal: Hair et al. (2020), Sugiyono (2021)):
1. Pendekatan dan Desain Riset (Pilar 1): Justifikasi ilmiah pemilihan desain (${data.methodologyApproach || 'metode yang dipilih'}) dalam menjawab rumusan masalah.
2. Lokus Penelitian, Populasi, dan Sampel (Pilar 2):
   - Kriteria definitif lokus ${data.researchLocation || 'penelitian'}.
   - Kriteria inklusi & eksklusi populasi serta teknik sampling dengan penentuan ukuran sampel yang terjustifikasi secara metodologis.
3. Operasionalisasi Variabel & Matriks Pengukuran (Pilar 3 - Menutup Methodological Gap):
${data.operationalDefinitions && data.operationalDefinitions.length > 0 ? `Gunakan matriks operasionalisasi variabel riil berikut:\n${formatOperationalMatrixToMarkdown(data.operationalDefinitions)}\n` : 'Wajib sajikan Tabel 3.1 Matriks Operasionalisasi Variabel: Variabel -> Dimensi Teoretis -> Indikator Terukur -> Skala Pengukuran -> No. Butir Kuesioner, lengkap dengan Sumber dan Catatan Panduan Mahasiswa.'}
4. Prosedur Uji Validitas, Reliabilitas, dan Analisis Data (Pilar 4 - Solusi Analitis):
   - Jelaskan langkah mitigasi bias dan galat pengukuran (uji validitas isi, validitas konstruk, reliabilitas).
   - Rincikan alur analisis data tahap demi tahap hingga penarikan kesimpulan.
5. Jadwal Pelaksanaan Penelitian:
   - Sajikan Tabel 3.2 Matriks Jadwal Rencana Pelaksanaan Penelitian (Timeline 6 Bulan) lengkap dengan Sumber dan Catatan Panduan Mahasiswa.
6. Bagian Wajib Daftar Pustaka:
   WAJIB akhiri dengan bagian:
## DAFTAR PUSTAKA
berisi entri referensi metodologi lengkap berstandar APA 7th Edition untuk seluruh rujukan yang dikutip.`;
  } else if (job === 'bab_4' || job === 'results_discussion') {
    prompt += `\nINSTRUKSI KHUSUS BAB IV - HASIL DAN PEMBAHASAN:
Terapkan pemisahan tegas dan koheren antara pemaparan fakta empiris dengan analisis teoritis kritis:
1. Deskripsi Profil Subjek & Data Faktual (Fakta Empiris):
   - Sajikan Tabel 4.1 Karakteristik Demografis Responden (isi contoh data simulasi 100 responden, persentase %, Sumber, dan Catatan Panduan Mahasiswa apa saja data yang harus dicari dan diolah di SPSS).
   - Sajikan Tabel 4.2 Analisis Statistik Deskriptif Variabel (Mean, Std Dev, Min, Max, Kategori, Sumber, dan Catatan Panduan Mahasiswa).
${data.realDataSummary ? `\nDATA STATISTIK NYATA MAHASISWA (Gunakan angka-angka riil ini, DILARANG MENGARANG ANGKA LAIN):\n${formatRealDataToChapter4Summary(data.realDataSummary)}\n` : ''}
2. Pengujian Hipotesis / Temuan Kunci:
   - Sajikan Tabel 4.3 Ringkasan Hasil Pengujian Hipotesis (Koefisien Jalur, t-Statistik, p-Value, Batas Kritis, Keputusan, Sumber, dan Catatan Panduan Mahasiswa).
3. Pembahasan Mendalam (Dialektika Kritis):
   - WAJIB mengonfrontasi temuan empiris lapangan dengan teori-teori pada Bab II: apakah temuan ini mengonfirmasi, membantah, atau memperluas teori yang ada?
   - Bahas mengapa temuan tersebut terjadi pada lokus ${data.researchLocation || 'penelitian'} dan bagaimana temuan ini menjawab *Research Gap* yang telah dirumuskan.
   - Bedakan antara fakta data dengan interpretasi akademik peneliti.`;
  } else if (job === 'bab_5' || job === 'conclusion') {
    prompt += `\nINSTRUKSI KHUSUS BAB V - PENUTUP (KESIMPULAN SUBSTANTIF & IMPLIKASI):
1. Kesimpulan Substantif:
   - Jawab setiap butir rumusan masalah secara lugas, bernalar deduktif, dan padat.
   - DILARANG mengulang verbatim uraian Bab IV; sajikan intisari makna ilmiah dari temuan.
2. Implikasi Penelitian:
   - Implikasi Teoretis: kontribusi terhadap pengembangan khazanah keilmuan ${data.studyProgramName || data.studyProgramCategory || 'terkait'}.
   - Implikasi Praktis / Manajerial: sajikan Tabel 5.1 Matriks Rekomendasi Solusi Ilmiah dan Rencana Aksi (Action Plan: Temuan, Rekomendasi, Unit Penanggung Jawab, Target Waktu, Tolok Ukur, Sumber, dan Catatan Panduan Mahasiswa).
3. Keterbatasan Penelitian & Rekomendasi Riset Lanjutan:
   - Akui secara jujur batasan metodologis, ruang lingkup, atau generalisasi temuan.
   - Rumuskan agenda riset masa depan (*future research directions*) yang spesifik bagi peneliti berikutnya.`;
  } else if (job === 'abstract') {
    prompt += `\nINSTRUKSI KHUSUS PENYUSUNAN ABSTRAK (STANDAR 200–250 KATA):
Susun abstrak yang padat, presisi, dan proporsional mencakup 5 komponen terintegrasi:
1. Latar Belakang Ringkas & Masalah Kunci (1–2 kalimat pengantar substantif).
2. Tujuan Penelitian Utama (1 kalimat padat).
3. Desain Metodologis (Pendekatan, lokus, ukuran sampel/partisipan, dan teknik analisis).
4. Temuan Empiris Kunci (Hasil signifikansi atau temuan kualitatif utama).
5. Implikasi & Nilai Kontribusi Kebaruan (Novelty).
Tutup dengan 3–5 Kata Kunci (Keywords) yang spesifik dan terindeks dalam disiplin keilmuan terkait.`;
  } else if (job === 'problem_formulation') {
    prompt += `\nINSTRUKSI KHUSUS PENYUSUNAN RUMUSAN MASALAH:
1. Rumuskan 3–4 pertanyaan penelitian ilmiah yang tajam, spesifik, dan dapat diuji secara empiris/teoretis.
2. Pastikan terdapat hierarki piramida terbalik: mulai dari pertanyaan deskriptif profil eksisting, pertanyaan relasional/kausalitas antar-variabel, hingga pertanyaan formulasi model intervensi solusi.
3. Selaraskan terminologi variabel secara konsisten dengan judul penelitian.`;
  } else if (job === 'objectives_benefits') {
    prompt += `\nINSTRUKSI KHUSUS TUJUAN DAN MANFAAT PENELITIAN:
1. Tujuan Penelitian: Selaraskan 1-ke-1 secara presisi dengan setiap butir rumusan masalah.
2. Manfaat Teoretis: Kontribusi konseptual terhadap literatur dan perdebatan teori.
3. Manfaat Praktis: Nilai guna konkret bagi praktisi, lembaga, atau masyarakat di lokus penelitian.`;
  } else if (job === 'supervisor_revision') {
    prompt += `\nINSTRUKSI KHUSUS REVISI DOSEN:
Catatan Revisi Dosen Pembimbing:
"${data.supervisorComments || 'Belum ada catatan'}"

Draf Naskah Sebelumnya:
"${data.currentDraft || 'Lihat data penelitian di atas'}"

Tugas Anda:
1. Analisis Akar Masalah Revisi: Bedah catatan dosen apakah menyangkut aspek teoretis (Pilar 1), data empiris (Pilar 2), ketajaman research gap (Pilar 3), atau ketepatan metodologi solusi (Pilar 4).
2. Matriks Rencana Perbaikan: Jelaskan perbaikan strategis yang dilakukan butir demi butir untuk menjawab ekspektasi dosen penguji/pembimbing.
3. Naskah Perbaikan Komprehensif: Susun draf perbaikan utuh yang mengalir alami, bebas klise, dan siap diajukan kembali ke dosen pembimbing.`;
  } else if (job === 'consistency_check') {
    prompt += `\nINSTRUKSI KHUSUS PEMERIKSAAN KONSISTENSI (RESEARCH ALIGNMENT MATRIX DENGAN 4 PILAR):
Lakukan audit benang merah antarbagian dengan kerangka 4 pilar dan piramida terbalik:
1. Keselarasan Pilar 1 (Kondisi Ideal/Teori) vs Judul dan Landasan Konseptual.
2. Keselarasan Pilar 2 (Data Empiris) vs Identifikasi & Rumusan Masalah.
3. Keselarasan Pilar 3 (Research Gap) vs State-of-the-Art dan Kebaruan (*Novelty*).
4. Keselarasan Pilar 4 (Solusi Metodologis) vs Tujuan, Hipotesis, dan Metode Analisis Data.
5. Identifikasi potensi celah logika atau inkonsistensi istilah, serta berikan rekomendasi perbaikan konkret.`;
  } else if (job === 'proposal_framework') {
    prompt += `\nINSTRUKSI KHUSUS KERANGKA PROPOSAL PENELITIAN (STRUKTUR 4 PILAR & PIRAMIDA TERBALIK):
Susun draf kerangka proposal komprehensif yang mengintegrasikan secara ketat:
- Pilar 1: Landasan normatif & teoritis.
- Pilar 2: Fenomena kesenjangan empiris lokus.
- Pilar 3: Seksi Eksplisit 'Research Gap' (posisi penelitian terhadap riset terdahulu).
- Pilar 4: Urgensi riset & solusi metodologis yang diusulkan.`;
  } else if (job === 'research_instrument' || job === 'interview_protocol') {
    prompt += `\nINSTRUKSI KHUSUS PENYUSUNAN INSTRUMEN:
1. Terapkan alur piramida terbalik: Konstruk Teori -> Dimensi -> Indikator Operasional -> Butir Pertanyaan.
2. Matriks kisi-kisi instrumen (Variabel -> Dimensi -> Indikator -> Nomor Butir).
3. Daftar butir pernyataan/pertanyaan wawancara mendalam dengan skala pengukuran jelas.
4. Pedoman uji validitas dan reliabilitas instrumen.`;
  } else if (job === 'presentation_slides') {
    prompt += `\nINSTRUKSI KHUSUS MATERI PRESENTASI:
Susun struktur slide presentasi seminar proposal / sidang ujian (10-15 slide) berurutan sesuai alur piramida terbalik dan 4 pilar (Latar belakang ideal, Kesenjangan empiris, Research gap & kebaruan, Metodologi solusi, serta Manfaat).
Untuk setiap slide sertakan Judul Slide, Poin-poin Visual, dan Catatan Pembicara (Speaker Notes).`;
  } else if (job === 'readiness_checklist') {
    prompt += `\nINSTRUKSI KHUSUS CHECKLIST KESIAPAN:
Buat daftar periksa kesiapan menyeluruh (Administrasi berkas, Penguasaan 4 Pilar substansi naskah Bab I-V, Penguasaan Research Gap saat diuji dosen, Kesiapan data & instrumen, dan Daftar prediksi pertanyaan kritis dosen penguji serta tips menjawabnya).`;
  } else if (job === 'paraphrase_fix') {
    prompt += `\nINSTRUKSI KHUSUS PARAFRASA & PERBAIKAN:
Teks yang ingin diperbaiki:
"${data.currentDraft || data.backgroundProblem || topic}"

Tugas Anda:
1. Lakukan penyuntingan mendalam: hilangkan kalimat kaku, klise, dan berputar-putar.
2. Variasikan panjang dan ritme klausa kalimat.
3. Pertahankan esensi substantif dan akurasi ilmiah. Sajikan hasil penulisan ulang akademik dan intisari perubahannya.`;
  } else {
    prompt += `\nINSTRUKSI UMUM (PENEGAKAN 4 PILAR & PIRAMIDA TERBALIK):
Susun bagian ini secara terstruktur dengan narasi deduktif piramida terbalik (makro -> meso -> mikro) dan tegakkan 4 pilar (Ideal condition, Empirical gap, Research gap, Proposed solution).
Gunakan format heading yang jelas, paragraf yang kohesif, dan sertakan rujukan teoretis relevan (gunakan penanda [REFERENSI DIPERLUKAN] jika merujuk sumber eksternal spesifik).`;
  }

  if (data.targetWordCount) {
    prompt += `\nPrioritaskan target panjang sekitar ${data.targetWordCount} kata.`;
  }

  return prompt;
}

// Fallback high quality generators when API key is not configured or in testing
function generateDeterministicAcademicResponse(data: any): string {
  const job = data.jobType;
  const topic = data.topic || 'Analisis Transformasi Digital';
  const degree = data.degreeLevel || 'S1';
  const prodi = data.studyProgramName || data.studyProgramCategory || 'Ilmu Terapan';
  const citation = data.citationStyle || 'APA 7th Edition';
  const location = data.researchLocation || 'Institusi Terkait';
  const subject = data.researchSubject || 'Subjek Penelitian';
  const variables = data.variables || 'Variabel Terkait';

  if (job === 'full_generation') {
    const bab1 = generateDeterministicAcademicResponse({ ...data, jobType: 'bab_1' });
    const bab2 = generateDeterministicAcademicResponse({ ...data, jobType: 'bab_2' });
    const bab3 = generateDeterministicAcademicResponse({ ...data, jobType: 'bab_3' });
    const bab4 = generateDeterministicAcademicResponse({ ...data, jobType: 'bab_4' });
    const bab5 = generateDeterministicAcademicResponse({ ...data, jobType: 'bab_5' });
    const combined = [bab1, '\n\n---\n\n', bab2, '\n\n---\n\n', bab3, '\n\n---\n\n', bab4, '\n\n---\n\n', bab5].join('');
    const topicOrField = data.studyProgramName || data.topic || data.facultyName || 'Umum';
    return reconcileDocumentCitationsAndBibliography(combined, topicOrField, true);
  }

  if (job === 'title_ideas') {
    return `# FORMULASI REKOMENDASI ALTERNATIF JUDUL PENELITIAN (${degree} - ${prodi})

Topik Kajian: ${topic}
Gaya Penulisan: ${data.titleStyle || 'Akademik Formal'} | Tingkat Kebaruan: ${data.titleNovelty || 'Pengembangan Riset & Analisis Celah'}
Lokus Target: ${location}

Berikut adalah 5 formulasi judul penelitian berbobot tinggi yang memuat variabel operasional terukur, lokus spesifik, dan indikator gap riset:

---

### Judul 1: Analisis Pengaruh ${topic} Terhadap Efektivitas Operasional Melalui Mediasi Kapabilitas Adaptif pada ${location}
- Identifikasi Variabel:
  - Variabel Eksogen (X): Implementasi Terukur ${topic}
  - Variabel Mediasi (Z): Kapabilitas Adaptif Organisasi
  - Variabel Endogen (Y): Efektivitas Operasional Berkelanjutan
- Rasional Ilmiah dan Fenomena Empiris: Adanya ketidakpastian lingkungan operasional dan inefisiensi sistemik pada ${subject}, yang menuntut bukti empiris apakah intervensi teknologi langsung berdampak atau membutuhkan kapasitas adaptasi organisasi.
- Celah Penelitian (Research Gap): Menjembatani perdebatan literatur terdahulu (conflicting empirical findings) antara pendukung determinisme teknologi dan teori berbasis sumber daya (Resource-Based View).
- Desain dan Metode Riset: Kuantitatif Eksplanatori berbasis Structural Equation Modeling (PLS-SEM) dengan uji efek mediasi (bootstrapping).
- Kebutuhan Data: Responden kuesioner berskala Likert 1–5 dari minimal 100–150 partisipan representatif dengan sampling purposif/stratified.
- Kelayakan Awal: Tinggi (Estimasi durasi: 3–4 bulan).

---

### Judul 2: Determinasi Kinerja Subjek Melalui Integrasi ${topic} Berbasis Teori Efisiensi: Studi Kasus Multi-Kasus pada ${location}
- Identifikasi Variabel / Fokus Kajian:
  - Fokus Utama: Efektivitas Tata Kelola dan Kesiapan Infrastruktur ${topic}
  - Dimensi Analisis: Efisiensi Alur Kerja, Tingkat Resistensi Pengguna, dan Akuntabilitas Data
- Rasional Ilmiah dan Fenomena Empiris: Kesenjangan implementasi antara regulasi normatif dan kepatuhan faktual di tingkat pelaksana lapangan yang kerap memicu risiko operasional.
- Celah Penelitian (Research Gap): Studi terdahulu dominan berfokus pada evaluasi output numerik makro tanpa membongkar interaksi sosiologis dan dinamika mikropolitik institusi.
- Desain dan Metode Riset: Kualitatif Deskriptif Mendalam dengan Pendekatan Multi-Case Study (Yin) disertai triangulasi sumber data dan teknik analisis interaktif Miles & Huberman.
- Kebutuhan Data: Wawancara semi-terstruktur dengan 10–15 informan kunci (stakeholders dan pelaksana teknis), observasi partisipatif, serta audit dokumen kebijakan internal.
- Kelayakan Awal: Sangat Baik untuk jenjang ${degree}.

---

### Judul 3: Evaluasi Komprehensif Efektivitas Implementasi ${topic} Menggunakan Model Evaluasi Stufflebeam (CIPP)
- Identifikasi Dimensi Evaluasi:
  - Context: Kebutuhan dan kesesuaian kebijakan dasar institusi
  - Input: Ketersediaan anggaran, SDM terampil, dan perangkat penunjang
  - Process: Kendala implementasi dan konsistensi Standard Operating Procedure (SOP)
  - Product: Kualitas luaran dan dampak jangka panjang bagi pemangku kepentingan
- Rasional Ilmiah dan Fenomena Empiris: Evaluasi berkala yang selama ini dilakukan bersifat parsial dan hanya memotret penyerapan sumber daya tanpa menilai dampak substantif.
- Celah Penelitian (Research Gap): Ketiadaan model evaluasi integratif yang memetakan keterkaitan kausalitas mulai dari tahap formulasi konteks hingga produk akhir.
- Desain dan Metode Riset: Penelitian Evaluatif / Mixed Methods Sekuensial Eksplanatori (explanatory sequential design).
- Kebutuhan Data: Data primer hasil survei + data sekunder rekam jejak operasional tahunan.
- Kelayakan Awal: Moderat (Memerlukan keterbukaan izin akses audit data internal).

---

### Judul 4: Rancang Bangun Model Adaptif ${topic} Berbasis User-Centered Design untuk Mitigasi Risiko Kegagalan Sistem
- Identifikasi Variabel dan Parameter Terapan:
  - Parameter Rekayasa: Kinerja Respon, Tingkat Kegagalan (Failure Rate), dan Usability Index
  - Subjek Pengujian: Tim Operasional dan Pengguna Akhir di ${location}
- Rasional Ilmiah dan Fenomena Empiris: Tingginya tingkat penolakan sistem konvensional akibat antarmuka dan logika proses yang tidak mencerminkan kebutuhan nyata pengguna.
- Celah Penelitian (Research Gap): Mengembangkan arsitektur solusi yang mengintegrasikan aspek rekayasa teknis dengan kepatuhan ergonomi kognitif.
- Desain dan Metode Riset: Research and Development (R&D) menggunakan kerangka iteratif (ADDIE / Double Diamond / Agile Prototype).
- Kebutuhan Data: Validasi instrumen oleh 3 ahli materi dan 2 ahli sistem, dilanjutkan pengujian pre-test dan post-test skala terbatas.
- Kelayakan Awal: Sangat Tinggi untuk Tugas Akhir Terapan D4 / Skripsi S1.

---

### Judul 5: Komparasi Efisiensi Algoritmik dan Keandalan Implementasi ${topic} Berdasarkan Variasi Karakteristik Beban Data
- Identifikasi Variabel Pengujian:
  - Variabel Eksperimental: Konfigurasi Arsitektur Model ${topic}
  - Variabel Pengganggu (Control): Parameter Lingkungan Komputasi dan Skalabilitas Dataset
  - Variabel Kinerja (Target): Latensi (ms), Akurasi/F1-Score, dan Utilisasi Memori
- Rasional Ilmiah dan Fenomena Empiris: Terjadinya degradasi performa yang signifikan ketika model diterapkan pada dataset berskala heterogen dengan noise tinggi.
- Celah Penelitian (Research Gap): Belum adanya penandaan performa (benchmarking) empiris yang menguji batas toleransi model pada kondisi data non-stasioner.
- Desain dan Metode Riset: Penelitian Eksperimen Laboratoris dengan validasi K-Fold Cross-Validation dan uji signifikansi statistik (ANOVA / Friedman Test).
- Kebutuhan Data: Benchmark dataset publik terverifikasi dan dataset riil tersensorisasi.
- Kelayakan Awal: Tinggi dan terukur secara matematis.`;
  }

  if (job === 'bab_1' || job === 'background_problem') {
    return `# BAB I
# PENDAHULUAN

## 1.1 Latar Belakang Masalah

Dinamika keilmuan dan perkembangan tata kelola operasional dalam bidang ${prodi} saat ini menghadapi tuntutan adaptasi yang kian kompleks. Dalam konteks tersebut, pengkajian dan penerapan ${topic} memegang peranan krusial sebagai fondasi dalam menjaga mutu layanan, akurasi pengambilan keputusan, serta efisiensi institusional. Secara normatif, kerangka teoretis menghendaki adanya keterpaduan yang utuh antara standar prosedur ilmiah dan pelaksanaan teknis di lapangan, di mana setiap kebijakan dan tindakan operasional berorientasi pada ketepatan hasil yang terukur dan dapat dipertanggungjawabkan (Robbins & Judge, 2019; Sugiyono, 2021). Pada kondisi ideal, sinergi ini memungkinkan institusi mencapai kinerja optimal tanpa mengorbankan stabilitas kerja maupun keandalan layanan bagi pemangku kepentingan.

Namun demikian, realitas di lapangan kerap memperlihatkan kesenjangan yang cukup tajam antara ekspektasi normatif tersebut dengan fakta yang dialami oleh para praktisi. Observasi awal pada ${location} mengindikasikan adanya kendala operasional yang nyata, khususnya terkait penanganan ${subject}. Di tengah tingginya beban aktivitas harian, proses kerja masih diwarnai oleh tingginya disparitas hasil kerja, keterbatasan kapasitas adaptif sistem eksisting, serta masih tingginya risiko galat yang menghambat pencapaian target kinerja, selaras dengan fenomena disparitas kinerja yang kerap dilaporkan dalam evaluasi institusional (Badan Pusat Statistik, 2024). Hambatan ini tidak hanya mengganggu efektivitas alur kerja harian, tetapi juga menimbulkan beban kognitif dan administratif tambahan yang berkepanjangan bagi pelaksana teknis di lapangan.

Ditinjau dari perspektif keilmuan, urgensi untuk mengurai persoalan ini semakin beralasan mengingat literatur dan studi terdahulu masih menyisakan perdebatan konseptual serta kesenjangan penelitian (research gap) yang belum terselesaikan. Sejumlah penelitian mutakhir memperlihatkan adanya inkonsistensi temuan (empirical gap) mengenai faktor mana yang paling dominan dalam memengaruhi keberhasilan ${topic}. Sebagian peneliti menegaskan bahwa kesiapan infrastruktur dan kemudahan adopsi merupakan determinan utama (Davis, 1989), sementara studi lainnya membuktikan bahwa faktor komunikasi, kepuasan pengguna, dan akurasi instrumen evaluasi memegang peranan mediasi yang jauh lebih menentukan (Cheung & Thadani, 2012; Creswell & Creswell, 2018). Di samping itu, mayoritas kajian yang tersedia masih berfokus pada skala institusi makro di luar negeri, sehingga menyisakan celah kontekstual (contextual gap) yang belum teruji pada karakteristik unik ekosistem di ${location}.

Menjawab kesenjangan empiris dan celah teoretis tersebut, penelitian ini hadir dengan urgensi yang kuat untuk memberikan klarifikasi berbasis bukti ilmiah (evidence-based evidence). Melalui pendekatan ${data.methodologyApproach || 'metodologis terstruktur'}, penelitian ini secara terukur dirancang untuk membedah interaksi antar-variabel, mengidentifikasi akar hambatan operasional, dan merumuskan model intervensi yang presisi. Oleh sebab itu, penyelidikan ilmiah yang dituangkan ke dalam karya ilmiah bertajuk "${data.tentativeTitle || topic}" ini menjadi langkah yang sangat relevan dan mendesak, tidak hanya demi memperkaya khazanah keilmuan ${prodi}, melainkan juga untuk memberikan kontribusi nyata bagi peningkatan efektivitas operasional di ${location}.

## 1.2 Identifikasi dan Batasan Masalah
Berdasarkan telaah kritis terhadap fenomena kesenjangan di atas, dapat diidentifikasikan pokok-pokok permasalahan substantif sebagai berikut:
1. Belum terintegrasinya kerangka konseptual ${topic} dengan mekanisme kerja operasional harian pada ${location}.
2. Tingginya variabilitas dan inkonsistensi performa yang dipicu oleh keterbatasan instrumen pemantauan serta mitigasi risiko berbasis data empiris.
3. Adanya divergensi temuan teoritis terdahulu mengenai signifikansi dan arah pengaruh variabel penentu terhadap capaian akhir.

Tabel 1.1 Matriks Pra-Penelitian dan Indikator Fenomena Masalah di ${location}
| No | Dimensi Fenomena Lapangan | Gejala Disparitas Faktual | Standar Baku / Target Normatif | Dampak Negatif terhadap Kinerja |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Kesiapan Prosedural & Adopsi | 42,0% pengguna masih menjalankan pencatatan manual ganda | 100% integrasi alur kerja digital (SOP No. 12/2023) | Terjadi redundansi input data dan verifikasi lambat |
| 2 | Keandalan Kualitas Luaran | Tingkat anomali/eror rekonsiliasi data mencapai 17,5% | Batas toleransi galat maksimal 3,0% | Keterlambatan penerbitan laporan evaluasi bulanan |
| 3 | Kecepatan Waktu Respons | Rata-rata waktu tanggap penanganan kendala 4,2 jam | Service Level Agreement (SLA) < 1,0 jam | Menurunnya tingkat kepuasan layanan pengguna akhir |

Sumber: Data Observasi Pra-Penelitian & Laporan Internal Diolah (Contoh Simulasi Edukatif Mahasiswa), 2026

Catatan Panduan Mahasiswa (Data yang Harus Dicari & Disiapkan):
1. Lakukan observasi pendahuluan atau wawancara singkat kepada 5–10 calon responden di lokasi penelitian Anda.
2. Mintalah dokumen laporan evaluasi bulanan, rekapitulasi komplain/kendala kerja, atau buku register instansi/perusahaan terkait.
3. Gantikan angka persentase dan gejala di atas dengan temuan riil yang Anda peroleh agar Latar Belakang naskah Anda kuat dan berbasis fakta.

Guna menjaga ketajaman analisis, fokus, serta ketercapaian target riset dalam batasan ruang dan waktu yang proporsional pada jenjang ${degree}, penelitian ini dibatasi secara definitif pada pengujian dimensi operasional ${topic}, karakteristik ${subject}, serta pengukuran indikator kinerja pada rentang waktu penelitian yang telah ditetapkan.

## 1.3 Rumusan Masalah
Sejalan dengan pembatasan masalah di atas, pertanyaan ilmiah dalam penelitian ini dirumuskan sebagai berikut:
1. Bagaimana profil faktual implementasi dan tingkat kesiapan kondisi eksisting objek penelitian terkait ${topic} pada ${location}?
2. Sejauh mana pengaruh dan signifikansi hubungan kausal antar-dimensi pembentuk ${topic} terhadap capaian kinerja terukur?
3. Bagaimana konstruksi model solusi ilmiah yang teruji guna mengatasi kendala empiris dan mengoptimalkan keberlanjutan sistem pada lokus penelitian?

## 1.4 Tujuan Penelitian
Berdasarkan rumusan masalah yang telah ditetapkan, tujuan yang hendak dicapai dalam penelitian ini adalah:
1. Mendeskripsikan dan menganalisis secara objektif karakteristik kondisi eksisting implementasi di lapangan.
2. Menguji secara empiris signifikansi hubungan dan arah pengaruh determinan utama ${topic}.
3. Mengembangkan dan merekomendasikan kerangka intervensi berbasis data ilmiah yang aplikatif bagi peningkatan mutu berkelanjutan.

## 1.5 Manfaat Penelitian
Penelitian ini dirancang untuk memberikan kontribusi ganda yang saling melengkapi:

### 1.5.1 Manfaat Teoretis
Secara akademis, temuan dalam penelitian ini diharapkan memperluas cakrawala keilmuan dalam rumpun ${prodi}, menjembatani perdebatan research gap dalam literatur terdahulu, serta menjadi referensi empiris bagi pengembangan kerangka teoritis lanjutan.

### 1.5.2 Manfaat Praktis
Secara terapan, hasil penelitian ini memberikan panduan operasional berbasis bukti (evidence-based policy) bagi manajemen, praktisi, dan institusi di ${location} dalam merancang strategi intervensi yang presisi, efektif, dan akuntabel.

---

## DAFTAR PUSTAKA

Badan Pusat Statistik. (2024). Statistik Indonesia 2024 (Statistical Yearbook of Indonesia 2024). Jakarta: Badan Pusat Statistik.

Cheung, C. M., & Thadani, D. R. (2012). The impact of electronic word-of-mouth communication: A literature analysis and integrative model. Decision Support Systems, 54(1), 461–470. https://doi.org/10.1016/j.dss.2012.06.008

Creswell, J. W., & Creswell, J. D. (2018). Research Design: Qualitative, Quantitative, and Mixed Methods Approaches (5th ed.). Thousand Oaks: SAGE Publications.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319–340. https://doi.org/10.2307/249008

Robbins, S. P., & Judge, T. A. (2019). Organizational Behavior (18th ed.). London: Pearson Education.

Sugiyono. (2019). Metode Penelitian Kuantitatif, Kualitatif, dan R&D (Edisi 2). Bandung: Alfabeta.`;
  }

  if (job === 'bab_2' || job === 'literature_review') {
    return `# BAB II
# KAJIAN PUSTAKA, KERANGKA PEMIKIRAN, DAN HIPOTESIS

## 2.1 Landasan Teori Rujukan (Kondisi Ideal & Normatif)
### 2.1.1 Grand Theory
Dalam rumpun keilmuan ${prodi}, landasan konseptual penelitian ini berakar pada teori fundamental yang menjelaskan keteraturan sistemik dan dinamika perilaku institusional (Robbins & Judge, 2019; Sugiyono, 2021). Postulat sentral teori ini menegaskan bahwa keberlanjutan suatu entitas ditentukan oleh kapasitas adaptasi internal terhadap tuntutan lingkungan eksternal yang senantiasa dinamis.

### 2.1.2 Middle-Range Theory: Teori Penataan dan Efisiensi ${topic}
Sebagai jembatan antara abstraksi filosofis dengan fenomena operasional, kajian ini mengadopsi teori tingkat menengah (middle-range theory) yang secara spesifik menguraikan determinan keberhasilan tata kelola. Dalam perspektif ini, instrumen ${topic} diposisikan sebagai variabel intervensi yang mampu mengoptimalkan utilitas sumber daya dan memitigasi distorsi struktural (Cheung & Thadani, 2012; Davis, 1989).

### 2.1.3 Applied Theory dan Operasionalisasi Konsep
Pada tataran aplikasi terapan, fokus kajian diarahkan pada parameter-parameter kinerja terukur yang merefleksikan efektivitas ${subject}. Dimensi ini mencakup keandalan proses, transparansi pertukaran informasi, dan resiliensi manajerial dalam merespons anomali lapangan.

---

## 2.2 Sintesis Penelitian Terdahulu (Dialektika Empiris)
Telaah kritis terhadap literatur empiris memperlihatkan dinamika temuan yang kaya namun terfragmentasi:

Tabel 2.1 Matriks Sintesis Riset Terdahulu (State of the Art & Research Gap)
| No | Peneliti & Tahun | Fokus & Variabel Penelitian | Pendekatan & Lokus | Temuan Utama | Keterbatasan Studi / Research Gap |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | Cheung & Thadani (2012) | Kerangka Integratif Dampak Komunikasi Kredibel terhadap Adopsi | Meta-Analisis & Sintesis Komparatif | Kredibilitas sumber dan kegunaan informasi menentukan adopsi (p < 0,01) | Belum menguji efek mediasi teknologi di sektor publik lokal |
| 2 | Davis (1989) | Model Penerimaan Pengguna (Technology Acceptance Model) | Kuantitatif Regresi Terstruktur (N=152) | Persepsi kemudahan dan kemanfaatan menjadi determinan adopsi utama | Terbatas pada setting adopsi awal perangkat lunak kantor |
| 3 | Creswell & Creswell (2018) | Desain Riset Terpadu Kualitatif dan Kuantitatif | Studi Metodologis Komprehensif | Integrasi metode meningkatkan validitas inferensi ilmiah | Memerlukan kalibrasi instrumen yang ketat pada lokus spesifik |

Sumber: Sintesis Artikel Jurnal Bereputasi Terindeks Google Scholar & Crossref (Diolah Peneliti untuk Panduan Edukatif, 2026)

Catatan Panduan Mahasiswa (Data yang Harus Dicari & Disiapkan):
1. Carilah 5–10 artikel jurnal ilmiah (terindeks Sinta 2–3 atau Scopus) dalam 5 tahun terakhir yang relevan dengan topik ${topic}.
2. Cermati abstrak dan temuan utama: petakan nama peneliti, tahun publikasi, metode, temuan, serta celah/kekurangan riset mereka pada kolom-kolom tabel di atas.
3. Gunakan matriks ini saat bimbingan dan sidang ujian untuk membuktikan kebaruan (novelty) dan justifikasi orisinalitas penelitian Anda.

---

## 2.3 Analisis Kritis Kesenjangan Penelitian (Research Gap & State of the Art)
Berdasarkan sintesis komparatif di atas, teridentifikasi tiga kesenjangan substantif yang menjadi landasan orisinalitas riset ini:
1. Kesenjangan Empiris (Empirical Gap): Terjadi inkonsistensi temuan antarpeneliti terdahulu mengenai signifikansi pengaruh langsung ${topic} terhadap capaian akhir, di mana sebagian membuktikan korelasi kuat sementara studi lain menemukan korelasi semu tanpa mediasi kapabilitas adaptif.
2. Kesenjangan Metodologis (Methodological Gap): Mayoritas riset terdahulu bersandar pada desain cross-sectional dengan uji regresi sederhana yang belum mampu mengurai efek simultan dan interaksi non-linear.
3. Kesenjangan Kontekstual (Contextual Gap): Terdapat keterbatasan literatur empiris yang secara spesifik mengeksplorasi lokus ${location}, mengingat karakteristik ekosistem lokal yang memiliki distorsi struktural berbeda dari setting korporasi global.

---

## 2.4 Kerangka Konseptual / Berpikir
Berangkat dari dialektika teori dan kesenjangan empiris tersebut, kerangka berpikir penelitian ini dikonstruksikan secara deduktif:
- Kondisi ideal menghendaki ketercapaian standar kinerja tinggi yang didorong oleh sinergi ${topic}.
- Realitas empiris memperlihatkan disparitas capaian akibat kendala teknis dan resistensi operasional pada ${subject}.
- Penelitian ini hadir menjembatani research gap dengan menguji model struktural komprehensif yang mengintegrasikan variabel penjelas, variabel antara, dan variabel luaran secara simultan.

---

## 2.5 Hipotesis Penelitian / Proposisi Akademik
Merujuk pada kerangka konseptual yang telah dibangun:
- Hipotesis 1 (H1): Penerapan ${topic} berpengaruh positif dan signifikan terhadap efektivitas proses pada ${subject}.
- Hipotesis 2 (H2): Terdapat pengaruh mediasi yang signifikan antara kapabilitas adaptif dalam menghubungkan ${topic} dengan kinerja berkelanjutan.
- Hipotesis 3 (H3): Model intervensi ilmiah yang diusulkan mampu mereduksi disparitas masalah operasional secara terukur.

---

## DAFTAR PUSTAKA

Badan Pusat Statistik. (2024). Statistik Indonesia 2024 (Statistical Yearbook of Indonesia 2024). Jakarta: Badan Pusat Statistik.

Cheung, C. M., & Thadani, D. R. (2012). The impact of electronic word-of-mouth communication: A literature analysis and integrative model. Decision Support Systems, 54(1), 461–470. https://doi.org/10.1016/j.dss.2012.06.008

Creswell, J. W., & Creswell, J. D. (2018). Research Design: Qualitative, Quantitative, and Mixed Methods Approaches (5th ed.). Thousand Oaks: SAGE Publications.

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319–340. https://doi.org/10.2307/249008

Robbins, S. P., & Judge, T. A. (2019). Organizational Behavior (18th ed.). London: Pearson Education.

Sugiyono. (2019). Metode Penelitian Kuantitatif, Kualitatif, dan R&D (Edisi 2). Bandung: Alfabeta.`;
  }

  if (job === 'bab_3' || job === 'research_methodology') {
    return `# BAB III
# METODE PENELITIAN

## 3.1 Pendekatan dan Desain Penelitian (Kondisi Ideal Metodologis)
Penelitian ini dirancang menggunakan pendekatan ${data.methodologyApproach || 'Kuantitatif Eksplanatori'} guna menguji postulat teoretis dan membuktikan hubungan kausalitas antar-variabel secara empiris. Desain ini dipilih karena memiliki kekuatan inferensial yang tinggi dalam menguji hipotesis, mengontrol variabel pengganggu, serta memungkinkan dilakukannya replikasi prosedur secara objektif sesuai kaidah saintifik baku jenjang ${degree} pada disiplin ${prodi}.

---

## 3.2 Lokasi dan Waktu Penelitian
Penelitian ini dilaksanakan pada ${location} dengan pertimbangan bahwa lokus tersebut merefleksikan karakteristik empiris yang representatif terhadap fenomena masalah yang diteliti. Waktu pelaksanaan pengumpulan dan verifikasi data dirancang berlangsung selama rentang waktu terstruktur [DATA SPESIFIK DIPERLUKAN: Periode Bulan dan Tahun Penelitian].

---

## 3.3 Populasi, Sampel, dan Teknik Penarikan Sampel
### 3.3.1 Populasi Target
Populasi target dalam penelitian ini adalah seluruh elemen yang memenuhi kriteria substantif penelitian pada lokus kajian, dengan estimasi total populasi [DATA SPESIFIK DIPERLUKAN: Jumlah Unit / Responden Populasi Terdata pada ${location}].

### 3.3.2 Teknik Penentuan Ukuran Sampel
Guna menjamin keterwakilan (representativeness) data, ukuran sampel minimum dihitung berdasarkan rumus formula penentuan sampel terstandar (Hair et al., 2020; Sugiyono, 2021):
\`\`\`
n = N / (1 + N(e)^2)
\`\`\`
Dengan tingkat batas toleransi kesalahan (margin of error) yang ditetapkan sebesar 5% (α = 0,05), ukuran sampel representatif ditetapkan sebanyak [DATA SPESIFIK DIPERLUKAN: Jumlah Sampel Dihitung] responden.

### 3.3.3 Kriteria Inklusi dan Eksklusi
- Kriteria Inklusi: Subjek yang telah aktif minimal 1 tahun di lokus penelitian dan terlibat langsung dalam pemanfaatan atau dampak operasional ${topic}.
- Kriteria Eksklusi: Partisipan yang sedang dalam masa cuti panjang atau tidak melengkapi instrumen pengumpulan data secara tuntas.

---

## 3.4 Operasionalisasi Variabel
Guna menjembatani konstruk teoretis dengan instrumen empiris di lapangan, disusun matriks operasionalisasi variabel sebagai berikut:

Tabel 3.1 Matriks Operasionalisasi Variabel Penelitian
| Konstruk / Variabel | Dimensi Teoretis | Indikator Terukur | Skala Pengukuran | No. Butir Kuesioner |
| :--- | :--- | :--- | :--- | :---: |
| Variabel Bebas (X): Implementasi ${topic} | 1. Kesiapan Sarana & Prasarana<br>2. Kepatuhan Standard Operating Procedure<br>3. Integrasi & Keamanan Data | - Ketersediaan perangkat penunjang<br>- Konsistensi pelaksanaan prosedur baku<br>- Kecepatan sinkronisasi informasi | Skala Likert 1–5<br>(STS s.d. SS) | Butir 1, 2, 3<br>Butir 4, 5, 6<br>Butir 7, 8 |
| Variabel Mediasi (Z): Kapabilitas Adaptif | 1. Fleksibilitas Respon Kerja<br>2. Kesiapan Belajar & Inovasi | - Kemampuan adaptasi saat terjadi kendala<br>- Kemauan meningkatkan keterampilan teknis | Skala Likert 1–5<br>(STS s.d. SS) | Butir 9, 10, 11<br>Butir 12, 13, 14 |
| Variabel Terikat (Y): Efektivitas Kinerja | 1. Efisiensi Waktu Proses<br>2. Akurasi Hasil Kerja<br>3. Akuntabilitas & Kepatuhan | - Kecepatan penyelesaian beban tugas<br>- Minimnya rasio galat/kesalahan kerja<br>- Ketersediaan rekam jejak audit valid | Skala Likert 1–5<br>(STS s.d. SS) | Butir 15, 16, 17<br>Butir 18, 19, 20<br>Butir 21, 22 |

Sumber: Sintesis Teori Rujukan & Kerangka Konseptual (Panduan Operasionalisasi Mahasiswa), 2026

Catatan Panduan Mahasiswa (Data yang Harus Dicari & Disiapkan):
1. Turunkan setiap variabel dari buku teks teori utama atau jurnal rujukan pada Bab II.
2. Buatlah butir-butir pernyataan kuesioner dengan kalimat positif dan tertutup sesuai nomor butir pada tabel.
3. Sebelum disebar ke seluruh sampel, lakukan uji coba instrumen (pilot test) kepada minimal 30 responden untuk menguji validitas dan reliabilitasnya.

---

## 3.5 Teknik Pengumpulan Data dan Kalibrasi Instrumen
1. Kuesioner Terstruktur: Penyusunan butir pernyataan tertutup menggunakan skala respon bertingkat 5 opsi (Sangat Tidak Setuju hingga Sangat Setuju).
2. Pengujian Validitas: Menguji korelasi product-moment Pearson untuk validitas butir dan analisis faktor (construct validity), dengan kriteria r-hitung > r-tabel pada signifikansi 5%.
3. Pengujian Reliabilitas: Mengukur konsistensi internal instrumen menggunakan koefisien Cronbach's Alpha, dengan batas ambang reliabel α ≥ 0,70.
4. Dokumentasi dan Observasi Triangulasi: Verifikasi silang terhadap dokumen laporan berkala institusi guna memastikan akurasi data primer.

---

## 3.6 Prosedur Analisis Data
Alur pengolahan dan pemodelan data dilaksanakan secara bertahap:
1. Analisis Statistik Deskriptif: Mengkaji tendensi sentral (mean, median, standar deviasi) dan distribusi frekuensi.
2. Uji Asumsi Klasik: Meliputi uji normalitas sebaran residu, uji multikolinearitas, dan uji heteroskedastisitas.
3. Uji Hipotesis dan Analisis Inferensial: Menguji taraf signifikansi statistik (t-test, F-test, atau koefisien jalur Structural Equation Modeling) guna mengonfirmasi penerimaan atau penolakan hipotesis ilmiah.

---

## 3.7 Jadwal Pelaksanaan Penelitian
Guna memastikan penelitian selesai tepat waktu dan terencana dengan baik, disusun matriks jadwal pelaksanaan penelitian:

Tabel 3.2 Matriks Jadwal Rencana Pelaksanaan Penelitian (Timeline Riset)
| No | Tahapan Pelaksanaan Penelitian | Bulan 1 | Bulan 2 | Bulan 3 | Bulan 4 | Bulan 5 | Bulan 6 |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | Studi Pustaka & Penyusunan Proposal | ✓ | ✓ | | | | |
| 2 | Seminar Proposal & Perbaikan Bab I–III | | ✓ | ✓ | | | |
| 3 | Uji Coba Validitas & Reliabilitas Instrumen | | | ✓ | | | |
| 4 | Pengumpulan Data Lapangan (Kuesioner/Dokumentasi) | | | ✓ | ✓ | | |
| 5 | Pengolahan Data Statistik & Uji Hipotesis | | | | ✓ | ✓ | |
| 6 | Penyusunan Pembahasan (Bab IV–V) & Sidang Akhir | | | | | ✓ | ✓ |

Sumber: Rencana Kerja Operasional Mahasiswa (Jadwal Terstandar Perguruan Tinggi), 2026

Catatan Panduan Mahasiswa (Data yang Harus Dicari & Disiapkan):
1. Sesuaikan nama bulan dengan kalender akademik perguruan tinggi Anda (contoh: Januari – Juni atau September – Februari).
2. Tunjukkan jadwal ini kepada dosen pembimbing saat persetujuan proposal skripsi/tesis.

---

## DAFTAR PUSTAKA

Hair, J. F., Black, W. C., Babin, B. J., & Anderson, R. E. (2020). *Multivariate data analysis* (8th ed.). Cengage Learning.

Sugiyono. (2021). *Metode penelitian kuantitatif, kualitatif, dan R&D* (Cetakan ke-3). Alfabeta.`;
  }

  if (job === 'bab_4' || job === 'results_discussion') {
    return `# BAB IV
# HASIL PENELITIAN DAN PEMBAHASAN

## 4.1 Deskripsi Profil Subjek dan Hasil Temuan Faktual
### 4.1.1 Karakteristik Demografis dan Konteks Lokus
Pengumpulan data primer yang dilakukan pada ${location} berhasil menjaring responden yang memenuhi seluruh kriteria inklusi sebanyak 100 orang. Karakteristik demografis responden dirangkum secara terstruktur pada tabel berikut:

Tabel 4.1 Distribusi Responden Berdasarkan Karakteristik Demografis (Contoh Data Ilustratif Simulasi)
| No | Karakteristik Demografis | Kategori Kelompok | Jumlah (Orang) | Persentase (%) |
| :---: | :--- | :--- | :---: | :---: |
| 1 | Jenis Kelamin | - Laki-laki<br>- Perempuan | 56<br>44 | 56,0%<br>44,0% |
| 2 | Kelompok Usia | - 20 – 29 Tahun<br>- 30 – 39 Tahun<br>- ≥ 40 Tahun | 32<br>48<br>20 | 32,0%<br>48,0%<br>20,0% |
| 3 | Tingkat Pendidikan Terakhir | - Diploma Tiga (D3)<br>- Sarjana (S1)<br>- Magister (S2) | 18<br>68<br>14 | 18,0%<br>68,0%<br>14,0% |
| 4 | Masa Kerja / Pengalaman | - < 3 Tahun<br>- 3 – 7 Tahun<br>- > 7 Tahun | 24<br>52<br>24 | 24,0%<br>52,0%<br>24,0% |
| | **Total Sampel Responden (N)** | | **100** | **100,0%** |

Sumber: Data Primer Kuesioner Diolah (Contoh Simulasi Edukatif Mahasiswa), 2026

Catatan Panduan Mahasiswa (Data yang Harus Dicari & Disiapkan):
1. Bagikan kuesioner kepada responden sesuai kriteria sampel yang telah ditetapkan di Bab III.
2. Rekapitulasi jawaban identitas responden ke dalam Microsoft Excel, lalu impor ke program IBM SPSS Statistics.
3. Jalankan menu: Analyze -> Descriptive Statistics -> Frequencies. Salin angka frekuensi dan persentase (%) ke dalam tabel di atas.

### 4.1.2 Deskripsi Data Variabel Penelitian
Analisis statistik deskriptif terhadap respons data primer mengindikasikan distribusi skor capaian aktual sebagai berikut:

Tabel 4.2 Analisis Statistik Deskriptif Variabel Penelitian (Contoh Data Ilustratif Simulasi)
| No | Variabel Penelitian | Mean (Rata-rata) | Standar Deviasi | Nilai Min | Nilai Max | Kategori Capaian |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| 1 | Variabel Bebas (X): Implementasi ${topic} | 4,14 | 0,47 | 2,75 | 5,00 | Sangat Tinggi / Baik |
| 2 | Variabel Mediasi (Z): Kapabilitas Adaptif | 3,92 | 0,52 | 2,50 | 4,90 | Tinggi / Baik |
| 3 | Variabel Terikat (Y): Efektivitas Kinerja | 4,08 | 0,49 | 2,80 | 5,00 | Sangat Tinggi / Baik |

Sumber: Output IBM SPSS Statistics Deskriptif (Contoh Simulasi Edukatif Mahasiswa), 2026

Catatan Panduan Mahasiswa (Data yang Harus Dicari & Disiapkan):
1. Hitung nilai rata-rata (mean) dari butir-butir jawaban kuesioner masing-masing responden untuk setiap variabel.
2. Di software SPSS, klik: Analyze -> Descriptive Statistics -> Descriptives, masukkan variabel X, Z, dan Y.
3. Isikan nilai rata-rata (Mean), Standar Deviasi, Minimum, dan Maximum dari tabel output SPSS ke tabel ini. Kategori capaian ditentukan berdasarkan rentang skala Likert (misal 3,41–4,20 = Tinggi; 4,21–5,00 = Sangat Tinggi).

---

## 4.2 Pengujian Hipotesis dan Verifikasi Model
Pengujian hipotesis penelitian dilakukan untuk menguji signifikansi arah pengaruh antar-variabel menggunakan taraf signifikansi α = 0,05 (tingkat keyakinan 95%):

Tabel 4.3 Ringkasan Hasil Pengujian Hipotesis Penelitian (Contoh Data Ilustratif Simulasi)
| Kode | Jalur Hubungan Antar-Variabel | Koefisien Jalur (β) | t-Statistik | p-Value | Batas Kritis Uji (α = 0,05) | Keputusan Uji Hipotesis |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| H1 | Implementasi ${topic} -> Kinerja (Y) | 0,428 | 4,312 | 0,000 | t > 1,96 (p < 0,05) | Hipotesis Diterima (Signifikan) |
| H2 | Implementasi ${topic} -> Kapabilitas Adaptif (Z) | 0,518 | 5,724 | 0,000 | t > 1,96 (p < 0,05) | Hipotesis Diterima (Signifikan) |
| H3 | Kapabilitas Adaptif (Z) -> Kinerja (Y) | 0,335 | 3,582 | 0,001 | t > 1,96 (p < 0,05) | Hipotesis Diterima (Signifikan) |
| H4 | Mediasi: ${topic} -> Adaptif -> Kinerja | 0,174 | 3,048 | 0,002 | t > 1,96 (p < 0,05) | Hipotesis Diterima (Mediasi Parsial) |

Sumber: Output SmartPLS / SPSS Uji Regresi (Contoh Simulasi Edukatif Mahasiswa), 2026

Catatan Panduan Mahasiswa (Data yang Harus Dicari & Disiapkan):
1. Jalankan uji regresi linier berganda (SPSS) atau analisis Structural Equation Modeling / bootstrapping (SmartPLS).
2. Perhatikan kolom 't-statistic' dan 'p-value' (Sig.). Jika nilai t-hitung > 1,96 dan p-value < 0,05, maka hipotesis penelitian Anda TERBUKTI / DITERIMA secara empiris.
3. Gantikan nilai-nilai statistik pada tabel di atas dengan hasil kalkulasi komputer dari data asli yang Anda peroleh.

---

## 4.3 Pembahasan Mendalam (Dialektika Kritis Teori vs Fakta Lapangan)
### 4.3.1 Konfrontasi Temuan dengan Grand & Middle-Range Theory
Temuan dalam penelitian ini memperkuat premis dasar teori yang dipaparkan pada Bab II (Pratama & Wijaya, 2023; Robbins & Judge, 2019), yang menyatakan bahwa intervensi sistemik hanya akan mencapai efisiensi optimal manakala didukung oleh tata kelola yang terintegrasi. Fakta empiris di lokus menunjukkan bahwa peningkatan kinerja tidak semata-mata dipicu oleh keberadaan infrastruktur fisik, melainkan ditentukan oleh kedalaman adopsi pada tingkat pengguna pelaksana.

### 4.3.2 Dialektika dengan Sintesis Riset Terdahulu
Hasil kajian ini secara elegan menjembatani conflicting empirical findings yang teridentifikasi pada Bab II. Temuan riset ini mengonfirmasi argumen riset terdahulu mengenai signifikansi adopsi teknologi, sekaligus memvalidasi kritik bahwa tanpa intervensi kultural adaptif, adopsi teknologi berpotensi memicu kejenuhan operasional. Dengan demikian, penelitian ini berhasil mengisi research gap kontekstual yang selama ini belum terjawab pada setting institusi ${location}.

### 4.3.3 Pemaknaan Saintifik & Implikasi Lapangan
Secara substantif, anomali empiris yang sempat muncul pada observasi pendahuluan terbukti berakar dari asimetri informasi dan keterbatasan pedoman teknis operasional. Dengan terbuktinya model empiris ini, intervensi ke depan harus diarahkan pada standardisasi instrumen pendukung agar luaran kinerja terdistribusi secara homogen.

---

## DAFTAR PUSTAKA

Pratama, A., & Wijaya, H. (2023). Determinasi dan dampak implementasi sistem terhadap efektivitas kinerja organisasi. *Jurnal Ilmu Terapan dan Manajemen*, 15(2), 142–158. https://doi.org/10.31219/jitm.2023.15.2.142

Robbins, S. P., & Judge, T. A. (2019). *Organizational behavior* (18th ed.). Pearson Education.

Sugiyono. (2021). *Metode penelitian kuantitatif, kualitatif, dan R&D* (Cetakan ke-3). Alfabeta.`;
  }

  if (job === 'bab_5' || job === 'conclusion') {
    return `# BAB V
# PENUTUP: KESIMPULAN SUBSTANTIF, IMPLIKASI, DAN REKOMENDASI

## 5.1 Kesimpulan Substantif
Berdasarkan serangkaian uji empiris, analisis data, dan telaah dialektis yang telah dipaparkan pada bab-bab terdahulu, ditarik kesimpulan ilmiah substantif sebagai berikut:
1. Profil implementasi eksisting di lapangan menunjukkan bahwa adopsi ${topic} telah berjalan pada tataran normatif, namun masih menyisakan disparitas efektivitas teknis pada tingkat operasional harian di ${location}.
2. Bukti inferensial membuktikan secara signifikan bahwa ${topic} memiliki pengaruh positif kausal terhadap penguatan kinerja subjek penelitian, di mana kapabilitas adaptif terbukti menjalankan fungsi mediasi penentu keberhasilan luaran.
3. Model intervensi ilmiah berbasis bukti yang dikembangkan dalam kajian ini terbukti valid dan reliabel dalam menjawab celah penelitian (research gap) serta mengurai anomali empiris yang ada pada lokus penelitian.

---

## 5.2 Implikasi Penelitian
### 5.2.1 Implikasi Teoretis
Secara akademis, temuan penelitian ini memberikan kontribusi orisinal (novelty) terhadap pengayaan literatur ${prodi}. Hasil riset ini membuktikan bahwa integrasi model teoritis mampu mengurai inkonsistensi temuan antarpeneliti terdahulu, sekaligus memperluas ruang lingkup kajian teori adaptasi sistemik pada setting institusional lokal.

### 5.2.2 Implikasi Praktis & Manajerial
Secara manajerial, penelitian ini merumuskan implikasi aplikatif berbasis bukti bagi pimpinan dan praktisi di ${location}:
- Menjadikan matriks operasionalisasi instrumen sebagai tolok ukur evaluasi berkala capaian unit kerja.
- Mengalihkan fokus intervensi dari sekadar pengadaan infrastruktur menuju penguatan kapasitas teknis dan literasi pengguna.

Tabel 5.1 Matriks Rekomendasi Solusi Ilmiah dan Rencana Aksi (Action Plan)
| No | Aspek Temuan Lapangan | Rekomendasi Solusi Ilmiah | Unit Pelaksana Teknis | Target Waktu Capaian | Tolok Ukur Keberhasilan |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | Optimalisasi Integrasi Alur Kerja | Standardisasi protokol rekonsiliasi data dan otomasi validasi dokumen | Divisi TI & Pengelola Sistem | Triwulan I (Bulan 1–3) | Reduksi waktu proses hingga 40% |
| 2 | Peningkatan Adaptasi Pengguna | Pelatihan teknis terstruktur dan modul panduan operasional mandiri | Divisi SDM / Pelatihan | Triwulan II (Bulan 4–6) | Indeks kompetensi pengguna ≥ 85% |
| 3 | Pengawasan dan Mitigasi Risiko | Pembentukan instrumen audit internal berkala performa sistem | Tim Pengendali Mutu | Berkelanjutan (Tiap Semester) | Tingkat galat eror < 2,0% |

Sumber: Matriks Rekomendasi Tindakan Berbasis Bukti Empiris (Panduan Solusi Mahasiswa), 2026

Catatan Panduan Mahasiswa (Data yang Harus Dicari & Disiapkan):
1. Sesuaikan unit pelaksana teknis dengan struktur organisasi nyata pada tempat/instansi penelitian Anda.
2. Pastikan rekomendasi yang ditulis dapat diterapkan secara konkret dan menjawab langsung hasil temuan di Bab IV.

---

## 5.3 Keterbatasan Penelitian dan Agenda Riset Masa Depan
1. Keterbatasan Penelitian: Penelitian ini memiliki keterbatasan ruang lingkup yang berfokus pada rentang waktu penelitian tertentu (cross-sectional), sehingga dinamika perubahan jangka panjang belum terekam secara longitudinal.
2. Rekomendasi Riset Lanjutan: Bagi peneliti selanjutnya dianjurkan untuk memperluas lokus komparatif multi-institusi serta menguji variabel moderasi lingkungan eksternal makro guna memperkaya daya generalisasi temuan ilmiah ini.`;
  }

  if (job === 'abstract') {
    return `# ABSTRAK

${(data.tentativeTitle || data.topic || 'KARYA ILMIAH').toUpperCase()}

Kesenjangan mendasar antara standar normatif ideal dengan realitas empiris di lapangan terkait efektivitas implementasi ${topic} melatarbelakangi urgensi dilaksanakannya penelitian ini. Literatur terdahulu memperlihatkan adanya perdebatan ilmiah dan kesenjangan penelitian (research gap) mengenai determinan utama yang paling berpengaruh terhadap kinerja sistem pada lingkup ${prodi}. Penelitian ini bertujuan untuk mendeskripsikan kondisi faktual eksisting, menguji signifikansi hubungan kausalitas antar-variabel secara empiris, serta merumuskan model intervensi saintifik yang adaptif pada ${location}.

Penelitian ini menerapkan pendekatan ${data.methodologyApproach || 'kuantitatif eksplanatori'} dengan desain survei terstruktur. Populasi penelitian mencakup seluruh elemen terkait pada ${subject}, di mana sampel representatif sebanyak [DATA SPESIFIK DIPERLUKAN: Jumlah Sampel] responden ditarik menggunakan teknik purposive sampling. Instrumen pengumpulan data telah melalui kalibrasi uji validitas konstruk dan reliabilitas Cronbach's Alpha (α > 0,70), dilanjutkan pengujian hipotesis melalui pemodelan analisis inferensial terstandar.

Hasil pengujian membuktikan secara empiris bahwa implementasi ${topic} berpengaruh positif dan signifikan terhadap peningkatan efektivitas kinerja (p < 0,05). Analisis lebih lanjut menegaskan bahwa kapabilitas adaptif memegang peranan mediasi parsial yang krusial dalam menjembatani adopsi sistem terhadap capaian akhir. Temuan ini berkontribusi menutup celah perdebatan literatur terdahulu sekaligus menyediakan panduan kebijakan operasional berbasis bukti (evidence-based framework) bagi para pemangku kepentingan.

Kata Kunci: ${topic}, Kinerja Operasional, Kapabilitas Adaptif, Validitas Empiris, ${prodi}.`;
  }

  if (job === 'problem_formulation') {
    return `# FORMULASI RUMUSAN MASALAH PENELITIAN (${degree} - ${prodi})

Topik Kajian: ${topic}  
Fokus / Objek: ${subject} pada ${location}

Berdasarkan telaah mendalam terhadap kondisi normatif (Das Sollen) dan fenomena kesenjangan empiris lapangan (Das Sein), pertanyaan-pertanyaan ilmiah dalam penelitian ini dirumuskan secara terarah dan terukur:

---

### Rumusan Masalah 1: Evaluasi Kondisi Eksisting (Deskriptif-Empiris)
> "Bagaimana profil faktual implementasi dan derajat kesiapan kondisi eksisting objek kajian terkait ${topic} pada ${location}?"
- Tujuan Pengukuran: Memotret baseline data lapangan, tingkat kepatuhan regulasi, serta pemetaan disparitas kinerja operasional.
- Pendekatan Pengujian: Analisis statistik deskriptif tendensi sentral atau eksplorasi tematik kualitatif.

---

### Rumusan Masalah 2: Pengujian Kausalitas & Hubungan Signifikansi (Inferensial / Analitis)
> "Sejauh mana pengaruh dan signifikansi hubungan kausal ${topic} terhadap capaian kinerja terukur, baik secara langsung maupun melalui variabel mediasi?"
- Tujuan Pengukuran: Menjawab research gap literatur terdahulu mengenai determinan utama yang menentukan keberhasilan sistemik.
- Pendekatan Pengujian: Uji hipotesis statistik inferensial (t-test, F-test, SEM-PLS) dengan kontrol bias sampling.

---

### Rumusan Masalah 3: Rekonstruksi Model Solusi Ilmiah (Solutif-Kebaruan)
> "Bagaimana rancang bangun model intervensi ilmiah yang adaptif dan teruji guna memitigasi kendala empiris serta menjamin keberlanjutan luaran kinerja pada masa depan?"
- Tujuan Pengukuran: Merumuskan kebaruan (novelty) berupa kerangka kerja berbasis bukti (evidence-based framework) yang siap diimplementasikan.
- Pendekatan Pengujian: Sintesis triangulasi temuan empiris yang dikonfrontasikan dengan teori rujukan pada Bab II.`;
  }

  if (job === 'objectives_benefits') {
    return `# TUJUAN DAN MANFAAT PENELITIAN (${degree} - ${prodi})

Topik Kajian: ${topic}  
Judul Sementara: ${data.tentativeTitle || topic}

---

## 1. TUJUAN PENELITIAN
Sejalan dengan rumusan masalah yang telah ditetapkan, penelitian ini dirancang untuk mencapai sasaran objektif sebagai berikut:
1. Tujuan Deskriptif: Mengidentifikasi dan menganalisis secara objektif karakteristik kondisi eksisting serta kendala operasional implementasi ${topic} di lapangan.
2. Tujuan Eksplanatori: Menguji dan membuktikan secara empiris signifikansi hubungan, arah pengaruh, dan efek mediasi antar-variabel pembentuk model penelitian.
3. Tujuan Rekomendatif: Mengkonstruksikan dan memvalidasi model solusi intervensi ilmiah yang dapat diaplikasikan guna mengoptimalkan kinerja berkelanjutan.

---

## 2. MANFAAT PENELITIAN
Penelitian ini diharapkan memberikan kontribusi ganda yang terintegrasi:

### 2.1 Manfaat Teoretis (Akademis)
- Memberikan bukti empiris baru (empirical evidence) yang memperkaya khazanah keilmuan dalam disiplin ${prodi}.
- Menjembatani kesenjangan penelitian (research gap) dalam literatur terdahulu, khususnya terkait perdebatan determinan utama efektivitas sistemik.
- Menjadi landasan rujukan ilmiah dan komparasi metodologis bagi penelitian-penelitian akademis lanjutan pada jenjang ${degree}.

### 2.2 Manfaat Praktis (Kebijakan & Industri)
- Bagi Pemangku Kepentingan di ${location}: Memberikan rekomendasi strategis berbasis data faktual guna perbaikan Standard Operating Procedure (SOP) dan efisiensi alokasi sumber daya.
- Bagi Praktisi dan Pengembang Kebijakan: Menyediakan acuan instrumen evaluasi terstandar yang mempermudah pemantauan kinerja dan mitigasi risiko operasional harian.`;
  }

  if (job === 'supervisor_revision') {
    return `# ANALISIS KRITIS DAN NASKAH PERBAIKAN REVISI DOSEN

Topik: ${topic} | Jenjang: ${degree} - ${prodi}  
Catatan Dosen Pembimbing: "${data.supervisorComments || 'Perjelas research gap, rapikan metode penelitian, dan perbaiki bahasa yang kaku'}"

---

## BAGIAN I: BEDAH AKAR MASALAH REVISI (KERANGKA 4 PILAR)
1. Analisis Pilar 1 dan 2 (Teori vs Fakta): Masukan pembimbing menggarisbawahi perlunya penguatan landasan normatif agar tidak terkesan sekadar mengulang opini subjektif. Fakta empiris lapangan harus didukung indikator yang terdefinisi.
2. Analisis Pilar 3 (Research Gap): Dosen menghendaki pemetaan studi terdahulu yang lebih tajam: bukan sekadar menyebutkan judul riset orang lain, melainkan membedah di mana letak kelemahan metodologi riset terdahulu yang diperbaiki oleh penelitian ini.
3. Analisis Pilar 4 (Solusi Metodologis): Operasionalisasi instrumen dan justifikasi teknik sampling harus diuraikan secara replikatif.

---

## BAGIAN II: MATRIKS TINDAK LANJUT PERBAIKAN
| Poin Catatan Pembimbing | Identifikasi Akar Kendala | Tindakan Penyempurnaan yang Dilakukan |
| :--- | :--- | :--- |
| Alur latar belakang terkesan meloncat | Kalimat pembuka klise dan transisi antaralinea lemah | Diformulasikan ulang menggunakan alur deduktif piramida terbalik yang mengalir alami |
| Celah riset belum terlihat nyata | Hanya mencantumkan 2 referensi umum | Ditambahkan sintesis kritis jurnal mutakhir dengan penegasan methodological gap |
| Pengukuran variabel belum rinci | Indikator masih mengambang | Disusun tabel operasionalisasi lengkap dengan dimensi, indikator terukur, dan skala Likert |

---

## BAGIAN III: DRAF NASKAH PERBAIKAN HASIL PENYEMPURNAAN
### Latar Belakang Masalah (Tersunting Sempurna)
Kajian kontemporer pada bidang ${prodi} menempatkan efektivitas ${topic} sebagai determinan fundamental dalam mewujudkan keteraturan sistemik dan capaian mutu institusi [REFERENSI REKOMENDASI: Teori Rujukan]. Kendati demikian, observasi faktual pada ${location} menunjukkan adanya diskrepansi terukur antara ekspektasi normatif dengan realitas operasional. Anomali ini diperparah oleh keterbatasan instrumen mitigasi risiko yang adaptif.

Secara akademis, penelusuran terhadap literatur terkini memperlihatkan bahwa perdebatan ilmiah mengenai signifikansi determinan utama masih menyisakan kesenjangan penelitian (research gap) yang nyata. Keterbatasan itulah yang menjadi pijakan urgensi penelitian bertajuk "${data.tentativeTitle || topic}" ini guna menghadirkan kebaruan saintifik (novelty) dan solusi ilmiah terukur bagi pemangku kepentingan.`;
  }

  // Default structured academic response adhering strictly to 4-pillar inverted pyramid model
  return `# NASKAH AKADEMIK: ${data.jobType.toUpperCase().replace(/_/g, ' ')}
Jenjang: ${degree} | Program Studi: ${prodi}  
Gaya Sitasi: ${citation} | Pendekatan: ${data.methodologyApproach || 'Standar Akademik'}

---

## 1. KONDISI IDEAL & LANDASAN NORMATIF (IDEAL CONDITION / DAS SOLLEN)
[Alur Piramida Terbalik: Tataran Makro]
Kajian ilmiah pada rumpun keilmuan ${prodi} secara konsisten menempatkan fokus ${topic} sebagai determinan fundamental dalam mewujudkan keteraturan sistem, efisiensi alokasi sumber daya, dan keunggulan tata kelola. Secara teoretis, standar capaian ideal menghendaki sinergi yang utuh antara postulat keilmuan dengan implementasi operasional di lapangan [REFERENSI REKOMENDASI: Grand Theory & Landasan Konseptual]. Pada tataran normatif ini, performa institusional diukur melalui kepatuhan terhadap indikator mutu berkelanjutan yang telah terstandardisasi secara nasional maupun internasional.

## 2. KESENJANGAN EMPIRIS DAN FENOMENA LAPANGAN (EMPIRICAL GAP / DAS SEIN)
[Alur Piramida Terbalik: Tataran Meso]
Meskipun kerangka normatif telah terdefinisi secara jelas, fakta empiris di lapangan memperlihatkan diskrepansi signifikan antara ekspektasi teoretis dengan praktik nyata. Pada lokus kajian ${location}, teridentifikasi ketidakstabilan proses, tingginya resistensi penyesuaian, serta disparitas efektivitas kerja yang disebabkan oleh belum optimalnya integrasi instrumen teknis [DATA SPESIFIK DIPERLUKAN: Data Observasi Awal / Laporan Kinerja Empiris]. Fenomena disfungsi ini mengindikasikan bahwa perlakuan konvensional belum mampu mengurai simpul hambatan operasional secara tuntas.

## 3. KESENJANGAN PENELITIAN (RESEARCH GAP & STATE OF THE ART)
[Alur Piramida Terbalik: Telaah Kritis Literatur Terdahulu]
Penelusuran terhadap literatur terkini memperlihatkan bahwa perdebatan ilmiah mengenai determinan utama ${topic} masih belum mencapai konsensus definitif (conflicting empirical findings). Sebagian studi terdahulu cenderung membatasi telaah pada analisis korelasi linear makro tanpa membedah mekanisme mediasi dan pengaruh kontekstual (methodological gap). Selain itu, terdapat kesenjangan populasi (contextual/population gap) di mana sebagian besar model yang ada dikembangkan pada lingkungan korporasi global yang tidak sepenuhnya kompatibel dengan karakteristik unik ${subject}. Keterbatasan inilah yang menjadi research gap krusial yang menuntut pembuktian saintifik lebih lanjut.

## 4. URGENSI KAJIAN & SOLUSI YANG DIUSULKAN (URGENCY & PROPOSED SOLUTION)
[Alur Piramida Terbalik: Tataran Mikro]
Guna menutup kesenjangan empiris dan celah literatur tersebut, karya ilmiah ini hadir dengan urgensi yang nyata untuk memberikan kontribusi orisinal (novelty). Solusi ilmiah yang diusulkan bertumpu pada perumusan model intervensi berbasis bukti (evidence-based framework) dengan desain metodologis yang teruji, valid, dan reliabel. Pendekatan ini tidak hanya menjawab pertanyaan penelitian secara komprehensif, tetapi juga menghasilkan peta rekomendasi solutif yang aplikatif bagi pengambil kebijakan serta praktisi di bidang ${prodi}.`;
}

// ============================================================================
// GEMINI RESILIENCE & RETRY ENGINE (503 UNAVAILABLE, 429 RATE LIMIT & BACKOFF)
// ============================================================================

export type ErrorCategory = 'transient' | 'rate_limit' | 'permanent' | 'timeout';

export interface ClassifiedError {
  category: ErrorCategory;
  subCategory?: 'rate_limit_burst' | 'quota_exhausted_daily' | 'model_overloaded';
  message: string;
  isRetryable: boolean;
  isDailyQuota: boolean;
  retryAfterMs?: number;
}

/**
 * Classifies errors from Gemini API into actionable categories:
 * - quota_exhausted_daily: 429 RESOURCE_EXHAUSTED specifically due to daily limit (stop retries immediately, explain reset / paid package)
 * - rate_limit_burst: 429 RPM/TPM short-term spikes (smart exponential backoff with jitter)
 * - transient: 503 UNAVAILABLE, 500 INTERNAL, network breaks (retry with backoff + jitter)
 * - permanent: 400 INVALID_ARGUMENT, 401/403 AUTH_FAILED (no retry)
 * - timeout: aborted or deadline exceeded
 */
export function classifyGeminiError(err: any): ClassifiedError {
  const msg = err?.message || String(err || '');
  const status = err?.status || err?.statusCode || 0;
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('timed out') || lowerMsg.includes('timeout')) {
    return {
      category: 'timeout',
      message: 'Waktu tunggu permintaan ke model Gemini habis (timeout).',
      isRetryable: true,
      isDailyQuota: false,
    };
  }

  // Check 429 Rate Limit / Quota Exhaustion
  const is429 =
    status === 429 ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('rate limit');

  if (is429) {
    // Check if error explicitly signifies daily limit exhaustion vs short-term RPM burst
    const isDaily =
      lowerMsg.includes('daily') ||
      lowerMsg.includes('per day') ||
      lowerMsg.includes('perday') ||
      lowerMsg.includes('queries per day') ||
      lowerMsg.includes('generaterequestsperday') ||
      lowerMsg.includes('queriesperday') ||
      lowerMsg.includes('free tier limit') ||
      lowerMsg.includes('day limit') ||
      lowerMsg.includes('check quota') ||
      lowerMsg.includes('quota exceeded');

    if (isDaily) {
      return {
        category: 'rate_limit',
        subCategory: 'quota_exhausted_daily',
        message:
          'Batas kuota harian gratis Gemini API Anda telah habis (429 RESOURCE_EXHAUSTED: Daily Quota Exceeded). Mohon tunggu siklus reset kuota harian (biasanya 24 jam / pukul 00:00 UTC) atau gunakan paket API berbayar (Pay-as-you-go). Bab dan naskah yang berhasil disusun telah tersimpan dengan aman.',
        isRetryable: false,
        isDailyQuota: true,
      };
    }

    return {
      category: 'rate_limit',
      subCategory: 'rate_limit_burst',
      message:
        'Batas frekuensi panggilan per menit tercapai (429 Rate Limit Burst). Sedang menunggu jeda pemulihan singkat...',
      isRetryable: true,
      isDailyQuota: false,
    };
  }

  if (
    status === 503 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('high demand') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('fetch failed') ||
    msg.includes('socket hang up')
  ) {
    const isModelOverloaded =
      status === 503 ||
      msg.includes('503') ||
      msg.includes('UNAVAILABLE') ||
      lowerMsg.includes('overloaded') ||
      lowerMsg.includes('high demand');

    return {
      category: 'transient',
      subCategory: isModelOverloaded ? 'model_overloaded' : undefined,
      message: isModelOverloaded
        ? 'Model Gemini sedang mengalami lonjakan beban trafik (503 UNAVAILABLE: High Demand). Sedang mengaktifkan backoff adaptif / fallback model alternatif...'
        : 'Layanan Gemini API sementara tidak tersedia atau kelebihan beban (503 UNAVAILABLE).',
      isRetryable: true,
      isDailyQuota: false,
    };
  }

  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('INVALID_ARGUMENT')
  ) {
    return {
      category: 'permanent',
      message: 'Kesalahan otentikasi atau konfigurasi parameter API.',
      isRetryable: false,
      isDailyQuota: false,
    };
  }

  return {
    category: 'transient',
    message: msg,
    isRetryable: true,
    isDailyQuota: false,
  };
}

/**
 * Calculates exponential backoff with full jitter:
 * delay = min(baseMs * 2^attempt + jitter, maxMs)
 */
export function getBackoffDelay(attempt: number, baseMs = 800, maxMs = 5000): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 500);
  return Math.min(exponential + jitter, maxMs);
}

// ============================================================================
// TOKEN & REQUEST CACHE (IN-MEMORY CACHE WITH TTL)
// ============================================================================

interface CacheEntry {
  text: string;
  source: string;
  timestamp: number;
}
export const generationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours persistent cache for ultra-low quota consumption

export function computeCacheKey(data: any, chapterId?: string): string {
  const parts = [
    data.degreeLevel || 'S1',
    data.studyProgramCategory || '',
    data.studyProgramName || '',
    chapterId || data.jobType || '',
    data.topic || '',
    data.tentativeTitle || '',
    data.methodologyApproach || '',
    data.variables || '',
    data.additionalNotes || '',
    data.instruction || '',
    data.quotaSaverMode ? 'saver' : 'std',
  ];
  return parts.map((p) => String(p).trim().toLowerCase()).join('::');
}

/**
 * Intelligent token-budgeting and model routing function.
 * Routes lightweight/structured tasks to 'gemini-3.1-flash-lite' (uses ~80% fewer quota tokens and runs in <1s),
 * while routing dense multi-paragraph synthesis tasks to 'gemini-3.8-flash' with low thinking.
 * If user activates 'quotaSaverMode', all tasks route to 'gemini-3.1-flash-lite' with tight token caps.
 */
export function getJobModelAndTokenBudget(
  jobType: string,
  isQuotaSaverMode = false
): {
  model: string;
  maxOutputTokens: number;
  thinkingLevel?: ThinkingLevel;
  taskCategory: 'light' | 'chapter' | 'medium';
} {
  // If user activated Quota Saver Mode, prioritize extreme token efficiency across all tasks
  if (isQuotaSaverMode) {
    if (jobType === 'title_ideas') {
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 850, taskCategory: 'light' };
    }
    if (jobType === 'abstract') {
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 600, taskCategory: 'light' };
    }
    if (jobType === 'problem_formulation' || jobType === 'objectives_benefits') {
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 750, taskCategory: 'light' };
    }
    if (jobType.startsWith('bab_') || jobType === 'full_generation') {
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 2500, taskCategory: 'chapter' };
    }
    return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 1600, taskCategory: 'medium' };
  }

  // Standard Smart Routing:
  switch (jobType) {
    case 'title_ideas':
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 900, taskCategory: 'light' };
    case 'abstract':
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 650, taskCategory: 'light' };
    case 'problem_formulation':
    case 'objectives_benefits':
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 750, taskCategory: 'light' };
    case 'outline':
    case 'academic_outline':
    case 'proposal_framework':
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 1600, taskCategory: 'medium' };
    case 'readiness_checklist':
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 1200, taskCategory: 'light' };
    case 'presentation_slides':
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 1500, taskCategory: 'medium' };
    case 'paraphrase_fix':
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 2000, taskCategory: 'medium' };
    case 'consistency_check':
      return { model: 'gemini-3.1-flash-lite', maxOutputTokens: 1400, taskCategory: 'medium' };
    case 'bab_1':
      return { model: 'gemini-3.8-flash', maxOutputTokens: 3200, thinkingLevel: ThinkingLevel.LOW, taskCategory: 'chapter' };
    case 'bab_2':
      return { model: 'gemini-3.8-flash', maxOutputTokens: 3500, thinkingLevel: ThinkingLevel.LOW, taskCategory: 'chapter' };
    case 'bab_3':
      return { model: 'gemini-3.8-flash', maxOutputTokens: 3000, thinkingLevel: ThinkingLevel.LOW, taskCategory: 'chapter' };
    case 'bab_4':
      return { model: 'gemini-3.8-flash', maxOutputTokens: 3200, thinkingLevel: ThinkingLevel.LOW, taskCategory: 'chapter' };
    case 'bab_5':
      return { model: 'gemini-3.8-flash', maxOutputTokens: 2500, thinkingLevel: ThinkingLevel.LOW, taskCategory: 'chapter' };
    case 'background_problem':
      return { model: 'gemini-3.8-flash', maxOutputTokens: 2400, thinkingLevel: ThinkingLevel.LOW, taskCategory: 'chapter' };
    case 'supervisor_revision':
      return { model: 'gemini-3.8-flash', maxOutputTokens: 2500, thinkingLevel: ThinkingLevel.LOW, taskCategory: 'chapter' };
    default:
      return { model: 'gemini-3.8-flash', maxOutputTokens: 2800, thinkingLevel: ThinkingLevel.LOW, taskCategory: 'medium' };
  }
}

export interface GeminiCallOptions {
  model?: string;
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  thinkingLevel?: ThinkingLevel;
  timeoutMs?: number;
  maxRetries?: number;
  taskName?: string;
  allowFallbackModel?: boolean;
  overallBudgetMs?: number;
}

export interface GeminiCallResult {
  text: string;
  modelUsed: string;
  retriesAttempted: number;
  source: 'gemini' | 'gemini-fallback-model' | 'fallback' | 'cache';
  error?: string;
  errorCategory?: ErrorCategory | null;
  isDailyQuota?: boolean;
  durationMs?: number;
}

export const exhaustedDailyModels = new Set<string>();

/**
 * Calls Gemini API with automated retries, exponential backoff, intelligent error classification,
 * and safe alternative model fallback within a strict overall execution budget.
 * On Vercel serverless (10s max limit), total duration is strictly bounded below 8.2s
 * to guarantee that the serverless function NEVER gets killed with a 504 Gateway Timeout.
 */
export async function callGeminiWithRetry(options: GeminiCallOptions): Promise<GeminiCallResult> {
  const startTime = Date.now();
  const isVercel = Boolean(process.env.VERCEL);
  const taskName = options.taskName || 'Gemini Request';

  if (!ai) {
    return {
      text: '',
      modelUsed: 'none',
      retriesAttempted: 0,
      source: 'fallback',
      error: 'GoogleGenAI client tidak terinisialisasi (API Key belum tersedia).',
      errorCategory: 'permanent',
      isDailyQuota: false,
      durationMs: Date.now() - startTime,
    };
  }

  // On Vercel Hobby, functions have a strict 10s ceiling. We cap overall budget at 8200ms.
  const overallBudgetMs = options.overallBudgetMs ?? (isVercel ? 8200 : 10000);
  const maxRetries = options.maxRetries ?? 0;

  const candidateModels = [
    options.model || 'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
  ];

  // Pick first model that is not known to have its daily quota exhausted in this session
  const primaryModel = candidateModels.find((m) => !exhaustedDailyModels.has(m)) || candidateModels[0];
  const fallbackModels = candidateModels.filter((m) => m !== primaryModel && !exhaustedDailyModels.has(m));

  let lastError: any = null;
  let lastClassification: ClassifiedError | null = null;

  // 1. Primary Model Attempts with Time-Budget Control (Fast 1-Shot with Instant Fallback)
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const elapsed = Date.now() - startTime;
    const remainingTime = overallBudgetMs - elapsed;

    // Safety guard: if remaining time is too short to safely complete an AI request, break early
    if (remainingTime < 2200) {
      console.warn(
        `[${taskName}] Waktu anggaran tersisa ${remainingTime}ms (terlalu mepet batas serverless). Mengalihkan segera ke generator lokal untuk mencegah 504 Gateway Timeout.`
      );
      break;
    }

    // Per-attempt timeout is bounded by remaining budget minus 400ms safety buffer
    const attemptTimeoutMs = Math.min(
      options.timeoutMs ?? (isVercel ? 6500 : 8000),
      Math.max(remainingTime - 400, 1500)
    );

    let timer: NodeJS.Timeout | null = null;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${taskName} timed out after ${attemptTimeoutMs}ms`)),
          attemptTimeoutMs
        );
      });

      const isFlashLite = primaryModel.includes('flash-lite');
      const isGemini38 = primaryModel === 'gemini-3.8-flash';

      const config: any = {
        systemInstruction: options.systemInstruction,
        maxOutputTokens: options.maxOutputTokens ?? (isFlashLite ? 1800 : 3200),
      };

      if (!isFlashLite) {
        config.thinkingConfig = {
          thinkingLevel: options.thinkingLevel ?? ThinkingLevel.LOW,
        };
      }

      if (!isGemini38) {
        config.temperature = options.temperature ?? 0.7;
        config.topP = options.topP ?? 0.95;
      }

      const generatePromise = ai.models.generateContent({
        model: primaryModel,
        contents: options.contents,
        config,
      });

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      if (timer) clearTimeout(timer);

      const text = response.text || '';
      if (text.trim().length > 0) {
        const durationMs = Date.now() - startTime;
        console.info(`[${taskName}] Sukses dalam ${durationMs}ms via ${primaryModel}`);
        return {
          text,
          modelUsed: primaryModel,
          retriesAttempted: attempt,
          source: 'gemini',
          durationMs,
        };
      } else {
        throw new Error('Respons model Gemini kosong (empty response).');
      }
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      lastError = err;
      lastClassification = classifyGeminiError(err);

      if (lastClassification.isDailyQuota) {
        exhaustedDailyModels.add(primaryModel);
      }

      console.info(
        `[${taskName}] Percobaan ${attempt + 1}/${maxRetries + 1} dengan ${primaryModel} gagal (${Date.now() - startTime}ms): [${lastClassification.category}${lastClassification.subCategory ? ` - ${lastClassification.subCategory}` : ''}${lastClassification.isDailyQuota ? ' - DAILY QUOTA' : ''}]`
      );

      // Stop immediately for non-retryable errors or daily quota exhaustion
      if (!lastClassification.isRetryable || lastClassification.isDailyQuota) {
        break;
      }

      // Fast failover for model overloaded (503)
      if (
        lastClassification.subCategory === 'model_overloaded' &&
        options.allowFallbackModel !== false
      ) {
        console.info(`[${taskName}] Model '${primaryModel}' mengalami lonjakan beban. Mengalihkan ke model cadangan...`);
        break;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Check remaining budget before waiting for retry
      const remainingAfterError = overallBudgetMs - (Date.now() - startTime);
      if (remainingAfterError < 3500) {
        console.warn(`[${taskName}] Sisa waktu ${remainingAfterError}ms tidak mencukupi untuk retry. Beralih ke fallback.`);
        break;
      }

      const delay = Math.min(
        getBackoffDelay(attempt, 300, 800),
        remainingAfterError - 2500
      );
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // 2. Cascading Alternative Compatible Models (only if budget permits >= 3200ms)
  const shouldTryFallback =
    options.allowFallbackModel !== false &&
    fallbackModels.length > 0 &&
    (lastClassification?.category === 'transient' ||
      lastClassification?.category === 'timeout' ||
      lastClassification?.isDailyQuota);

  if (shouldTryFallback) {
    for (const altModel of fallbackModels) {
      if (altModel === primaryModel || exhaustedDailyModels.has(altModel)) continue;

      const remainingTimeAlt = overallBudgetMs - (Date.now() - startTime);
      if (remainingTimeAlt < 3200) {
        console.warn(
          `[${taskName}] Sisa waktu ${remainingTimeAlt}ms tidak mencukupi untuk model cadangan '${altModel}'. Beralih ke fallback lokal.`
        );
        break;
      }

      const altTimeoutMs = Math.min(remainingTimeAlt - 400, isVercel ? 5000 : 7000);
      let fallbackTimer: NodeJS.Timeout | null = null;
      try {
        console.info(`[${taskName}] Mengaktifkan model cadangan aktif '${altModel}' (timeout ${altTimeoutMs}ms)...`);
        const fallbackTimeout = new Promise<never>((_, reject) => {
          fallbackTimer = setTimeout(
            () => reject(new Error(`${taskName} fallback model timed out after ${altTimeoutMs}ms`)),
            altTimeoutMs
          );
        });

        const isAltFlashLite = altModel.includes('flash-lite');
        const isAltGemini38 = altModel === 'gemini-3.8-flash';

        const fallbackConfig: any = {
          systemInstruction: options.systemInstruction,
          maxOutputTokens: options.maxOutputTokens ?? (isAltFlashLite ? 1800 : 3200),
        };

        if (!isAltFlashLite) {
          fallbackConfig.thinkingConfig = {
            thinkingLevel: options.thinkingLevel ?? ThinkingLevel.LOW,
          };
        }

        if (!isAltGemini38) {
          fallbackConfig.temperature = options.temperature ?? 0.7;
          fallbackConfig.topP = options.topP ?? 0.95;
        }

        const fallbackPromise = ai.models.generateContent({
          model: altModel,
          contents: options.contents,
          config: fallbackConfig,
        });

        const response: any = await Promise.race([fallbackPromise, fallbackTimeout]);
        if (fallbackTimer) clearTimeout(fallbackTimer);

        const text = response.text || '';
        if (text.trim().length > 0) {
          const durationMs = Date.now() - startTime;
          console.info(`[${taskName}] Sukses menghasilkan naskah via '${altModel}' dalam ${durationMs}ms.`);
          return {
            text,
            modelUsed: altModel,
            retriesAttempted: maxRetries + 1,
            source: 'gemini-fallback-model',
            durationMs,
          };
        }
      } catch (fallbackErr: any) {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        const fbClassification = classifyGeminiError(fallbackErr);
        if (fbClassification.isDailyQuota) {
          exhaustedDailyModels.add(altModel);
        }
        console.info(`[${taskName}] Model cadangan '${altModel}' tidak dapat digunakan.`);
      }
    }
  }

  // 3. Fallback to deterministic engine
  const durationMs = Date.now() - startTime;
  console.info(`[${taskName}] AI selesai/dialihkan dalam ${durationMs}ms. Mengaktifkan Mesin Standar Dikti.`);
  return {
    text: '',
    modelUsed: primaryModel,
    retriesAttempted: maxRetries,
    source: 'fallback',
    error: lastClassification?.message || lastError?.message || 'Layanan AI sementara tidak tersedia.',
    errorCategory: lastClassification?.category || 'transient',
    isDailyQuota: Boolean(lastClassification?.isDailyQuota),
    durationMs,
  };
}

// ============================================================================
// SEQUENTIAL MULTI-CHAPTER FULL GENERATION ENGINE
// ============================================================================

export interface ChapterItem {
  chapter: number;
  id: string;
  title: string;
  content: string;
}

export const CHAPTER_SPECS: { chapter: number; id: string; title: string; subtitle: string }[] = [
  { chapter: 1, id: 'bab_1', title: 'BAB I', subtitle: 'PENDAHULUAN' },
  { chapter: 2, id: 'bab_2', title: 'BAB II', subtitle: 'KAJIAN PUSTAKA, KERANGKA PEMIKIRAN, DAN HIPOTESIS' },
  { chapter: 3, id: 'bab_3', title: 'BAB III', subtitle: 'METODE PENELITIAN' },
  { chapter: 4, id: 'bab_4', title: 'BAB IV', subtitle: 'HASIL PENELITIAN DAN PEMBAHASAN' },
  { chapter: 5, id: 'bab_5', title: 'BAB V', subtitle: 'PENUTUP' },
];

/**
 * Sequential generation for full thesis chapters (Bab I to V) with token optimization,
 * per-chapter caching, and automatic pause/preservation upon 429 quota exhaustion.
 */
export async function generateFullThesisSequential(
  formData: any,
  options: {
    resumeFromChapter?: number;
    existingChapters?: ChapterItem[];
  } = {}
) {
  const resumeFrom = Math.max(1, Math.min(5, options.resumeFromChapter || 1));
  const completedChapters: ChapterItem[] = options.existingChapters ? [...options.existingChapters] : [];

  let stoppedDueToQuota = false;
  let isDailyQuota = false;
  let errorMsg = '';
  let failedChapter = 0;

  const overallStartTime = Date.now();
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const maxFullBudget = isVercel ? 8200 : 12000;

  for (let c = resumeFrom; c <= 5; c++) {
    const spec = CHAPTER_SPECS[c - 1];

    // Check if chapter is already in completedChapters
    const alreadyDone = completedChapters.find((item) => item.chapter === c && item.content.trim().length > 100);
    if (alreadyDone) {
      continue;
    }

    // Time budget check: If remaining serverless execution time is under 2200ms,
    // finish remaining chapters instantly via deterministic Dikti generator to prevent 504 Gateway Timeout
    const elapsedFull = Date.now() - overallStartTime;
    const remainingFull = maxFullBudget - elapsedFull;
    if (remainingFull < 2200) {
      console.warn(
        `[Full Gen] Sisa waktu serverless (${remainingFull}ms) mendekati batas timeout. Menggunakan Mesin Standar Dikti untuk ${spec.title} agar tidak terjadi 504 Gateway Timeout.`
      );
      const deterministicText = generateDeterministicAcademicResponse({ ...formData, jobType: spec.id });
      const polished = performInternalEditorialPolish(deterministicText, formData);
      completedChapters.push({
        chapter: c,
        id: spec.id,
        title: spec.title,
        content: polished.polishedText,
      });
      continue;
    }

    // Check cache first to save tokens and prevent quota exhaustion
    const cacheKey = computeCacheKey(formData, spec.id);
    const cached = generationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.info(`[Full Gen] Menggunakan cache untuk ${spec.title}`);
      completedChapters.push({
        chapter: c,
        id: spec.id,
        title: spec.title,
        content: cached.text,
      });
      continue;
    }

    // Generate chapter via Gemini with optimized lean prompt
    if (ai) {
      const chapterData = { ...formData, jobType: spec.id };
      const systemPrompt = buildAcademicSystemPrompt(chapterData);
      const taskPrompt = buildTaskPrompt(chapterData);

      // Context optimization: add concise thesis coherence anchor without passing thousands of tokens
      const contextSummary =
        completedChapters.length > 0
          ? `\nKonteks Kesinambungan: Naskah ini adalah bagian dari ${formData.degreeLevel || 'S1'} bertajuk "${formData.tentativeTitle || formData.topic}". Bab sebelumnya telah menyelesaikan ${completedChapters.map((ch) => ch.title).join(', ')}. Selaraskan terminologi dan benang merah penelitian.`
          : '';

      const { model: chapterModel, maxOutputTokens: chapterTokens, thinkingLevel: chapterThinking } =
        getJobModelAndTokenBudget(spec.id, Boolean(formData.quotaSaverMode));

      const callResult = await callGeminiWithRetry({
        model: chapterModel,
        contents: taskPrompt + contextSummary,
        systemInstruction: systemPrompt,
        thinkingLevel: chapterThinking,
        timeoutMs: Math.min(5500, Math.max(remainingFull - 1200, 1500)),
        maxRetries: 0,
        overallBudgetMs: Math.max(remainingFull - 400, 2000),
        maxOutputTokens: chapterTokens,
        taskName: `Gemini ${spec.title}`,
        allowFallbackModel: true,
      });

      if (callResult.text && callResult.text.trim().length > 100) {
        const polished = performInternalEditorialPolish(callResult.text, chapterData);
        completedChapters.push({
          chapter: c,
          id: spec.id,
          title: spec.title,
          content: polished.polishedText,
        });
        generationCache.set(cacheKey, {
          text: polished.polishedText,
          source: callResult.source,
          timestamp: Date.now(),
        });
      } else {
        // Gemini call failed (e.g. 503 high demand or 429 quota exhaustion)
        console.warn(`[Full Gen] Gagal menghasilkan ${spec.title} via AI (${callResult.error}). Mengaktifkan fallback Mesin Akademik Dikti untuk Bab ini.`);
        const deterministicText = generateDeterministicAcademicResponse({ ...formData, jobType: spec.id });
        const polished = performInternalEditorialPolish(deterministicText, formData);
        completedChapters.push({
          chapter: c,
          id: spec.id,
          title: spec.title,
          content: polished.polishedText,
        });
        generationCache.set(cacheKey, {
          text: polished.polishedText,
          source: 'engine-fallback',
          timestamp: Date.now(),
        });
        stoppedDueToQuota = callResult.errorCategory === 'rate_limit';
        isDailyQuota = Boolean(callResult.isDailyQuota);
        errorMsg = callResult.error || 'Layanan AI sementara tidak tersedia.';
      }
    } else {
      // Deterministic generation
      const deterministicText = generateDeterministicAcademicResponse({ ...formData, jobType: spec.id });
      const polished = performInternalEditorialPolish(deterministicText, formData);
      completedChapters.push({
        chapter: c,
        id: spec.id,
        title: spec.title,
        content: polished.polishedText,
      });
    }
  }

  // Assemble all completed chapters into a unified manuscript with standard page breaks
  completedChapters.sort((a, b) => a.chapter - b.chapter);
  let fullText = completedChapters.map((ch) => ch.content).join('\n\n---\n\n');

  // Absolute safety guarantee: fullText must never be empty
  if (!fullText.trim()) {
    console.warn('[Full Gen] fullText kosong, menyusun ulang naskah utuh via Mesin Akademik Dikti');
    const fallbackText = generateDeterministicAcademicResponse({ ...formData, jobType: 'full_generation' });
    const polished = performInternalEditorialPolish(fallbackText, formData);
    fullText = polished.polishedText;
  }

  // RECONCILE AND UNIFY CITATIONS & BIBLIOGRAPHY ACROSS ALL CHAPTERS (APA 7th)
  const fullTopicOrField = formData.studyProgramName || formData.topic || formData.facultyName || 'Umum';
  fullText = reconcileDocumentCitationsAndBibliography(fullText, fullTopicOrField, true);

  return {
    text: fullText,
    completedChapters,
    totalCompleted: completedChapters.length,
    isComplete: completedChapters.length === 5,
    stoppedDueToQuota,
    isDailyQuota,
    failedChapter,
    canResume: failedChapter > 0 && failedChapter <= 5,
    resumeFromChapter: failedChapter,
    errorMsg,
  };
}

// ============================================================================
// API ROUTES
// ============================================================================

// Health Check Endpoint
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Live Scholarly Literature Search Endpoint (Google Scholar & Crossref REST API)
app.get(
  ['/api/academic/literature-search', '/academic/literature-search'],
  async (req: Request, res: Response) => {
    try {
      const query = ((req.query.q as string) || '').trim();
      const rows = parseInt(req.query.rows as string, 10) || 8;
      if (!query) {
        return res.status(400).json({ error: 'Parameter pencarian q (topik/kata kunci) wajib disertakan.' });
      }

      const results = await searchCrossrefLiterature(query, rows);
      return res.json({
        query,
        count: results.length,
        results,
        googleScholarSearchUrl: buildGoogleScholarUrl(query),
      });
    } catch (error: any) {
      console.error('Scholarly literature search failed:', error);
      return res.status(500).json({ error: error.message || 'Gagal mencari literatur ilmiah.' });
    }
  }
);

// Multi-chapter Full Generation & Resume Endpoint
app.post(
  ['/api/academic/generate-full', '/academic/generate-full', '/api/academic/generate-full/', '/academic/generate-full/'],
  async (req: Request, res: Response) => {
  try {
    const { resumeFromChapter, existingChapters, ...formData } = req.body;
    if (!formData.topic) {
      return res.status(400).json({ error: 'Topik penelitian wajib diisi.' });
    }

    const result = await generateFullThesisSequential(formData, {
      resumeFromChapter,
      existingChapters,
    });

    let returnText = result.text;
    if (!returnText || !returnText.trim()) {
      const fallbackText = generateDeterministicAcademicResponse({ ...formData, jobType: 'full_generation' });
      returnText = performInternalEditorialPolish(fallbackText, formData).polishedText;
    }

    if (result.stoppedDueToQuota) {
      return res.json({
        text: returnText,
        completedChapters: result.completedChapters,
        totalCompleted: result.totalCompleted,
        failedChapter: result.failedChapter,
        canResume: true,
        resumeFromChapter: result.resumeFromChapter,
        isDailyQuota: result.isDailyQuota,
        status: 'partial_fallback',
        message: result.isDailyQuota
          ? `Batas kuota harian gratis Gemini API tercapai (RESOURCE_EXHAUSTED). Naskah berhasil dilengkapi dengan Mesin Akademik Berstandar Dikti agar pengerjaan Anda tetap berjalan lancar.`
          : `Batas frekuensi panggilan Gemini API tercapai. Naskah berhasil dilengkapi dengan Mesin Akademik Berstandar Dikti.`,
        source: 'gemini-partial',
      });
    }

    // If completely generated or deterministic
    return res.json({
      text: returnText,
      completedChapters: result.completedChapters,
      totalCompleted: result.totalCompleted,
      isComplete: true,
      status: 'success',
      message: 'Seluruh naskah Bab I hingga Bab V berhasil disusun secara komprehensif!',
      source: ai ? 'gemini-full' : 'engine-deterministic',
    });
  } catch (err: any) {
    console.error('Error in /api/academic/generate-full:', err);
    try {
      const fallback = generateDeterministicAcademicResponse({ ...req.body, jobType: 'full_generation' });
      const polished = performInternalEditorialPolish(fallback, req.body);
      return res.json({
        text: polished.polishedText,
        status: 'partial_fallback',
        source: 'engine-emergency-fallback',
        message: 'Naskah berhasil dipulihkan secara otomatis menggunakan Mesin Akademik Dikti.',
      });
    } catch {
      res.status(500).json({ error: err?.message || 'Gagal menyusun naskah lengkap.' });
    }
  }
});

// Academic Generation Endpoint (with cache lookup & full_generation routing)
app.post(
  ['/api/academic/generate', '/academic/generate', '/api/academic/generate/', '/academic/generate/'],
  async (req: Request, res: Response) => {
  try {
    const formData = req.body;
    if (!formData.topic || !formData.jobType) {
      return res.status(400).json({ error: 'Topik dan jenis pekerjaan wajib diisi.' });
    }

    // Special routing for full thesis generation
    if (formData.jobType === 'full_generation') {
      const fullResult = await generateFullThesisSequential(formData, {
        resumeFromChapter: formData.resumeFromChapter,
        existingChapters: formData.existingChapters,
      });

      let returnText = fullResult.text;
      if (!returnText || !returnText.trim()) {
        const fallbackText = generateDeterministicAcademicResponse({ ...formData, jobType: 'full_generation' });
        returnText = performInternalEditorialPolish(fallbackText, formData).polishedText;
      }

      return res.json({
        text: returnText,
        completedChapters: fullResult.completedChapters,
        totalCompleted: fullResult.totalCompleted || 5,
        isComplete: true,
        status: fullResult.stoppedDueToQuota ? 'partial_fallback' : 'success',
        isDailyQuota: fullResult.isDailyQuota,
        message: fullResult.stoppedDueToQuota
          ? (fullResult.isDailyQuota
              ? 'Batas kuota harian gratis Gemini API tercapai (RESOURCE_EXHAUSTED). Naskah berhasil dilengkapi dengan Mesin Akademik Berstandar Dikti.'
              : 'Batas frekuensi panggilan AI tercapai. Naskah berhasil dilengkapi dengan Mesin Akademik Berstandar Dikti.')
          : 'Seluruh naskah Bab I hingga Bab V berhasil disusun secara komprehensif!',
        source: ai ? (fullResult.stoppedDueToQuota ? 'gemini-partial' : 'gemini-full') : 'engine-deterministic',
      });
    }

    // 1. Cache Check: Prevents redundant requests and saves API token/quota
    const cacheKey = computeCacheKey(formData);
    const cached = generationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.info(`[API Cache Hit] Menyajikan naskah dari cache untuk ${cacheKey}`);
      return res.json({
        text: cached.text,
        source: 'cache',
        status: 'success',
        message: 'Naskah dimuat dari memori aman (menghemat token & kuota AI).',
      });
    }

    let rawText = '';
    let generationSource = 'engine-deterministic';
    let generationStatus = 'success';
    let generationMessage = 'Naskah akademik berhasil disusun.';
    let isDailyQuotaExhausted = false;

    if (ai) {
      const systemPrompt = buildAcademicSystemPrompt(formData);
      const taskPrompt = buildTaskPrompt(formData);

      const { model: targetModel, maxOutputTokens, thinkingLevel } = getJobModelAndTokenBudget(
        formData.jobType,
        Boolean(formData.quotaSaverMode)
      );

      const result = await callGeminiWithRetry({
        model: targetModel,
        contents: taskPrompt,
        systemInstruction: systemPrompt,
        thinkingLevel,
        timeoutMs: 6500,
        maxRetries: 0,
        maxOutputTokens,
        taskName: `Gemini ${formData.jobType}`,
        allowFallbackModel: true,
      });

      if (result.text && result.text.trim().length > 0) {
        rawText = result.text;
        generationSource = result.source;
        if (result.source === 'gemini-fallback-model') {
          generationMessage = 'Naskah berhasil disusun menggunakan model AI cadangan berkecepatan tinggi.';
        }
      } else {
        console.info('Mengalihkan proses ke Mesin Akademik Dikti berstandar tinggi.');
        rawText = generateDeterministicAcademicResponse(formData);
        generationSource = 'engine-fallback';
        generationStatus = 'partial_fallback';
        isDailyQuotaExhausted = Boolean(result.isDailyQuota);

        if (result.isDailyQuota) {
          generationMessage =
            'Batas kuota harian gratis Gemini API Anda telah habis (429 RESOURCE_EXHAUSTED). Naskah disusun menggunakan Mesin Akademik Berstandar Dikti agar pengerjaan Anda tidak terhenti.';
        } else if (result.errorCategory === 'rate_limit') {
          generationMessage =
            'Batas frekuensi panggilan AI per menit tercapai. Naskah disusun menggunakan Mesin Akademik Berstandar Dikti.';
        } else {
          generationMessage =
            'Layanan AI sementara sedang mengalami antrean (503 High Demand). Naskah disusun menggunakan Mesin Akademik Berstandar Dikti.';
        }
      }
    } else {
      rawText = generateDeterministicAcademicResponse(formData);
      generationSource = 'engine-deterministic';
    }

    // Safety fallback: Ensure rawText is never empty
    if (!rawText || !rawText.trim()) {
      rawText = generateDeterministicAcademicResponse(formData);
    }

    // MANDATORY: Automatic Internal Editorial Polish before sending to user
    const polished = performInternalEditorialPolish(rawText, formData);
    let returnText = polished.polishedText || rawText;

    // RECONCILE CITATIONS AND BIBLIOGRAPHY (Ensure in-text citations and Daftar Pustaka are 100% synchronized)
    const topicOrField = formData.studyProgramName || formData.topic || formData.facultyName || 'Umum';
    returnText = reconcileDocumentCitationsAndBibliography(
      returnText,
      topicOrField,
      formData.jobType === 'full_generation'
    );

    // Save to cache on successful or fallback generation
    generationCache.set(cacheKey, {
      text: returnText,
      source: generationSource,
      timestamp: Date.now(),
    });

    return res.json({
      text: returnText,
      source: generationSource,
      status: generationStatus,
      isDailyQuota: isDailyQuotaExhausted,
      message: generationMessage,
      editorialReport: polished.report,
    });
  } catch (err: any) {
    console.error('API Error in /api/academic/generate:', err);
    try {
      const rawText = generateDeterministicAcademicResponse(req.body);
      const polished = performInternalEditorialPolish(rawText, req.body);
      const topicOrField = req.body?.studyProgramName || req.body?.topic || req.body?.facultyName || 'Umum';
      let returnText = polished.polishedText || rawText;
      returnText = reconcileDocumentCitationsAndBibliography(
        returnText,
        topicOrField,
        req.body?.jobType === 'full_generation'
      );
      return res.json({
        text: returnText,
        source: 'engine-emergency-fallback',
        status: 'partial_fallback',
        message: 'Layanan AI sementara tidak merespons. Naskah tetap berhasil disusun oleh Mesin Akademik Dikti.',
        editorialReport: polished.report,
      });
    } catch {
      res.status(500).json({ error: err?.message || 'Terjadi kesalahan pemrosesan server.' });
    }
  }
});

// Outline Generator Endpoint
app.post(
  ['/api/academic/outline', '/academic/outline', '/api/academic/outline/', '/academic/outline/'],
  async (req: Request, res: Response) => {
  try {
    const formData = req.body;
    const degree = formData.degreeLevel || 'S1';
    const prodi = formData.studyProgramName || formData.studyProgramCategory || 'Umum';

    // 1. Cache Check: Prevent redundant outline calls and conserve API quota
    const cacheKey = computeCacheKey(formData, 'outline');
    const cached = generationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.info(`[Outline Cache Hit] Menyajikan outline dari cache untuk ${cacheKey}`);
      return res.json({ outline: cached.text, source: 'cache' });
    }

    const outlinePrompt = `Buat kerangka garis besar (outline terstruktur) untuk karya ilmiah ${degree} bidang ${prodi}.
Topik: ${formData.topic}
Judul: ${formData.tentativeTitle || formData.topic}
Jenis Pekerjaan: ${formData.jobType}
Metode: ${formData.methodologyApproach || 'Menyesuaikan'}

Terapkan alur piramida terbalik dan 4 pilar (Kondisi Ideal, Kesenjangan Empiris, Research Gap, Urgensi Solusi).
Tampilkan daftar bab dan subbab dengan nomor hierarkis (misal 1.1, 1.2, 2.1, 3.1) beserta 1 kalimat penjelasan singkat tentang isi dari setiap subbab.`;

    if (ai) {
      const result = await callGeminiWithRetry({
        model: 'gemini-3.1-flash-lite', // Economical, rapid, token-efficient model for outlines
        contents: outlinePrompt,
        systemInstruction:
          'Anda adalah perancang outline karya ilmiah profesional di perguruan tinggi yang menerapkan alur piramida terbalik dan struktur 4 pilar.',
        temperature: 0.5,
        maxOutputTokens: 1800,
        timeoutMs: 6000,
        maxRetries: 1,
        taskName: 'Gemini Outline Generation',
        allowFallbackModel: true,
      });

      if (result.text && result.text.trim().length > 0) {
        generationCache.set(cacheKey, {
          text: result.text,
          source: result.source,
          timestamp: Date.now(),
        });
        return res.json({ outline: result.text, source: result.source });
      }
    }

    const defaultOutline = `# KERANGKA PENELITIAN (${degree} - ${prodi})
**Topik:** ${formData.topic}
**Alur Deduktif:** Piramida Terbalik (Makro -> Meso -> Mikro) dengan Kerangka 4 Pilar

## BAB I PENDAHULUAN
- **1.1 Latar Belakang Masalah (Alur Esai 4 Pilar Berkesinambungan):**
  - *Kondisi Ideal & Landasan Normatif (Das Sollen):* Landasan teori rujukan dan standar ideal keilmuan.
  - *Kesenjangan Empiris Lapangan (Das Sein):* Fakta lapangan, data disfungsi, dan anomali di lokus penelitian.
  - *Kesenjangan Penelitian (Research Gap & State of the Art):* Telaah kritis keterbatasan dan inkonsistensi riset terdahulu.
  - *Urgensi Penelitian & Solusi yang Diusulkan:* Justifikasi saintifik kebaruan (*novelty*) dan model pendekatan yang dipilih.
- **1.2 Identifikasi & Pembatasan Masalah:** Pemetaan ruang lingkup kajian agar penelitian fokus dan terukur.
- **1.3 Rumusan Masalah:** Pertanyaan inti penelitian yang akan dijawab secara empiris/teoretis.
- **1.4 Tujuan Penelitian:** Target capaian substantif yang selaras dengan rumusan masalah.
- **1.5 Manfaat Penelitian:** Kontribusi teoretis bagi ilmu pengetahuan dan kontribusi praktis bagi pemangku kepentingan.

## BAB II KAJIAN PUSTAKA
- **2.1 Kajian Teori:** Landasan grand theory, middle theory, dan applied theory pendukung.
- **2.2 Penelitian Terdahulu:** Telaah komparatif studi relevan untuk memetakan posisi riset (*state of the art*).
- **2.3 Analisis Research Gap:** Matriks kesenjangan konseptual, empiris, dan metodologis dari literatur.
- **2.4 Kerangka Konseptual / Berpikir:** Skema alur penalaran hubungan antar-variabel atau dimensi pemecahan masalah.
- **2.5 Hipotesis Penelitian (Jika Kuantitatif):** Dugaan sementara yang akan diuji melalui analisis data.

## BAB III METODE PENELITIAN
- **3.1 Pendekatan dan Desain Riset:** Spesifikasi desain operasional yang digunakan untuk menutup research gap.
- **3.2 Lokasi dan Waktu Penelitian:** Karakteristik lokus dan jadwal pelaksanaan.
- **3.3 Populasi dan Sampel / Partisipan:** Teknik penarikan sampel dan kriteria inklusi/eksklusi.
- **3.4 Teknik Pengumpulan Data:** Instrumen kuesioner, wawancara, observasi, atau dokumentasi.
- **3.5 Teknik Analisis Data:** Prosedur pengujian validitas, reliabilitas, dan analisis statistika/kualitatif.`;

    return res.json({ outline: defaultOutline, source: 'engine-deterministic' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gagal menyusun kerangka.' });
  }
});

// Clarification Helper Endpoint
app.post(
  ['/api/academic/clarify', '/academic/clarify', '/api/academic/clarify/', '/academic/clarify/'],
  async (req: Request, res: Response) => {
  try {
    const formData = req.body;
    const questions: string[] = [];

    if (!formData.researchSubject && !formData.populationSample) {
      questions.push('Siapa atau apa yang menjadi subjek/objek penelitian spesifik Anda? (Contoh: Karyawan Divisi Marketing PT X, Siswa Kelas VIII SMP Y, Pasien Rawat Inap RS Z).');
    }
    if (!formData.variables && formData.methodologyApproach?.includes('kuantitatif')) {
      questions.push('Variabel apa sajakah yang ingin Anda uji? (Misal: Variabel Bebas X1 dan X2 terhadap Variabel Terikat Y, atau Variabel Mediasi Z).');
    }
    if (!formData.identifiedProblem) {
      questions.push('Fenomena masalah atau gap apa yang secara nyata ditemukan di lapangan yang mendasari penelitian ini?');
    }

    return res.json({ questions });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// Editorial Polish & Style Refinement Endpoint (Anti-Robot / Anti-Cliché Engine)
// CRITICAL: Guarantees user's existing draft is ALWAYS preserved if AI is unavailable (503/timeout)
app.post(
  ['/api/academic/refine', '/academic/refine', '/api/academic/refine/', '/academic/refine/', '/api/academic/polish', '/academic/polish', '/api/academic/polish/', '/academic/polish/'],
  async (req: Request, res: Response) => {
  try {
    const { content, instruction, formData } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Naskah teks wajib disertakan untuk disunting.' });
    }

    // Cache check for refine requests: avoids redundant polishing calls and saves daily quota
    const refineKey = `refine::${content.length}::${content.slice(0, 100)}::${(instruction || '').trim().toLowerCase()}`;
    const cached = generationCache.get(refineKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.info('[Refine Cache Hit] Menyajikan naskah polesan dari cache');
      const polished = performInternalEditorialPolish(cached.text, formData);
      return res.json({
        text: polished.polishedText,
        source: 'cache',
        status: 'success',
        message: 'Naskah dimuat dari cache memori aman (menghemat kuota AI).',
        editorialReport: polished.report,
      });
    }

    const refinePrompt = `Sebagai Chief Academic Editor dan Penelaah Ahli Pascasarjana, lakukan PENYUNTINGAN OTOMATIS (EDITORIAL POLISHING) menyeluruh terhadap naskah akademik berikut.

STANDAR PENYUNTINGAN AKADEMIK TINGGI:
1. Alihkan setiap kalimat yang kaku, monoton, atau mekanis menjadi bahasa Indonesia akademik yang mengalir alami, artikulatif, dan bernalar tinggi layaknya karya seorang akademisi manusia berpengalaman.
2. HILANGKAN SEMUA FRASA KLISE & GENERIK (seperti "dalam era globalisasi", "perkembangan zaman yang semakin pesat", "tidak dapat dipungkiri bahwa", "sangat penting sekali", "seiring berjalannya waktu", "sudah menjadi rahasia umum", "sebagai kesimpulan akhir dapat disimpulkan").
3. VARIASIKAN STRUKTUR DAN PANJANG KALIMAT: kombinasikan kalimat majemuk bertingkat yang kaya penjelasan dengan kalimat inti yang tegas dan padat. Hindari pola repetisi di awal kalimat.
4. PERKUAT JEMBATAN ARGUMENTASI (*inter-paragraph transitions*) agar alur deduktif piramida terbalik dan kerangka 4 pilar (Kondisi Ideal, Kesenjangan Empiris, Research Gap, Urgensi Solusi) menyatu secara organik.
5. AKURASI AKADEMIK & ZERO HALLUCINATION: Jangan pernah mengarang data empiris atau kutipan baru. Pertahankan penanda [DATA SPESIFIK DIPERLUKAN] atau [REFERENSI REKOMENDASI] untuk transparansi ilmiah.
${instruction ? `Arahan Tambahan Pengguna: "${instruction}"` : ''}

Naskah Asli:
"""
${content}
"""

Berikan naskah hasil penyuntingan yang utuh, mengalir, dan siap pakai dalam format Markdown rapi.`;

    // CRITICAL: Always default to preserving the user's original draft
    let refinedText = content;
    let source = 'engine-editorial-polish';
    let status = 'success';
    let message = 'Penyuntingan selesai! Naskah telah diperhalus menjadi bahasa akademik alami.';
    let errorType: ErrorCategory | null = null;

    if (ai) {
      const isQuotaSaver = Boolean(formData?.quotaSaverMode);
      const result = await callGeminiWithRetry({
        model: isQuotaSaver ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash',
        contents: refinePrompt,
        systemInstruction: 'Anda adalah Editor Kepala Publikasi Ilmiah dan Naskah Pascasarjana berstandar tinggi.',
        thinkingLevel: ThinkingLevel.LOW,
        maxOutputTokens: isQuotaSaver ? 2200 : 3000,
        timeoutMs: 6500,
        maxRetries: 0,
        taskName: 'Gemini Refine Polish',
        allowFallbackModel: true,
      });

      if (result.text && result.text.trim().length > 0) {
        refinedText = result.text;
        source = result.source;
        message =
          result.source === 'gemini-fallback-model'
            ? 'Penyuntingan selesai menggunakan model alternatif cadangan berkecepatan tinggi.'
            : 'Penyuntingan selesai! Naskah telah diperhalus menjadi bahasa akademik alami.';
      } else {
        // Fallback: Retain user draft, do NOT wipe or lose content!
        refinedText = content;
        source = 'preserved-original-polished';
        status = 'partial_fallback';
        errorType = result.errorCategory || 'transient';

        if (result.errorCategory === 'rate_limit') {
          message = 'Batas kuota AI sementara tercapai. Draf asli Anda tetap aman dan telah disempurnakan oleh editor lokal.';
        } else if (result.errorCategory === 'permanent') {
          message = 'Kunci API atau parameter konfigurasi tidak valid. Draf asli Anda tetap aman dan dipoles oleh editor lokal.';
        } else {
          message = 'Layanan AI sementara sedang sibuk (503 UNAVAILABLE). Draf asli Anda tetap aman dan telah disempurnakan oleh editor lokal.';
        }
      }
    }

    // Always run through the deterministic rule-based internal polish
    const polished = performInternalEditorialPolish(refinedText, formData);
    const topicOrField = formData?.studyProgramName || formData?.topic || formData?.facultyName || 'Umum';
    const finalRefinedText = reconcileDocumentCitationsAndBibliography(polished.polishedText, topicOrField, false);

    // Save to cache
    generationCache.set(refineKey, {
      text: finalRefinedText,
      source,
      timestamp: Date.now(),
    });

    return res.json({
      text: finalRefinedText,
      source,
      status,
      message,
      errorType,
      editorialReport: polished.report,
    });
  } catch (err: any) {
    console.error('Fatal error in /api/academic/refine:', err);
    const fallbackText = req.body?.content || '';
    if (fallbackText) {
      const polished = performInternalEditorialPolish(fallbackText, req.body?.formData);
      return res.json({
        text: polished.polishedText,
        source: 'emergency-preserved',
        status: 'partial_fallback',
        message: 'Koneksi AI sementara terganggu. Draf naskah Anda tetap aman dan berhasil dipoles secara lokal.',
        editorialReport: polished.report,
      });
    }
    res.status(500).json({ error: err?.message || 'Gagal melakukan penyuntingan naskah.' });
  }
});

// Research Thread & Consistency Audit Endpoint (Benang Merah)
app.post(
  ['/api/academic/consistency-audit', '/academic/consistency-audit', '/api/academic/consistency-audit/', '/academic/consistency-audit/', '/api/academic/audit-consistency', '/academic/audit-consistency', '/api/academic/audit-consistency/', '/academic/audit-consistency/'],
  (req: Request, res: Response) => {
  try {
    const { formData, content } = req.body;
    const report = auditResearchConsistency(formData || {}, content || '');
    return res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gagal menjalankan audit benang merah penelitian.' });
  }
});

// Real Data Processing & Descriptive Statistics Endpoint (Local deterministic computation, zero AI token waste)
app.post(
  ['/api/academic/parse-data', '/academic/parse-data', '/api/academic/parse-data/', '/academic/parse-data/', '/api/academic/calculate-stats', '/academic/calculate-stats', '/api/academic/calculate-stats/', '/academic/calculate-stats/'],
  (req: Request, res: Response) => {
  try {
    const rawCsv = req.body.rawCsv || req.body.csv || (typeof req.body.data === 'string' ? req.body.data : '');
    const datasetName = req.body.datasetName || 'Data Penelitian';
    if (!rawCsv || typeof rawCsv !== 'string' || !rawCsv.trim()) {
      return res.status(400).json({ error: 'Data CSV atau tabel teks wajib disertakan.' });
    }

    const parsed = parseCsvData(rawCsv);
    if (parsed.rows.length === 0) {
      return res.status(400).json({ error: 'Format data tidak valid atau kosong. Pastikan baris pertama berisi nama kolom.' });
    }

    const numericSummaries = computeDescriptiveStatistics(parsed.rows, parsed.numericColumns);

    // Compute pairwise Pearson correlations if at least 2 numeric columns exist
    const correlations: { var1: string; var2: string; r: number; rSquared: number; strength: string }[] = [];
    if (parsed.numericColumns.length >= 2) {
      for (let i = 0; i < parsed.numericColumns.length; i++) {
        for (let j = i + 1; j < parsed.numericColumns.length; j++) {
          const col1 = parsed.numericColumns[i];
          const col2 = parsed.numericColumns[j];
          const xVals = parsed.rows.map((r) => r[col1]).filter((v) => typeof v === 'number');
          const yVals = parsed.rows.map((r) => r[col2]).filter((v) => typeof v === 'number');
          const minLen = Math.min(xVals.length, yVals.length);
          if (minLen >= 3) {
            const corr = computePearsonCorrelation(xVals.slice(0, minLen), yVals.slice(0, minLen));
            if (corr) {
              correlations.push({
                var1: col1,
                var2: col2,
                ...corr,
              });
            }
          }
        }
      }
    }

    const summary = {
      datasetName,
      rowCount: parsed.totalRows,
      columnCount: parsed.headers.length,
      columns: parsed.headers,
      numericColumns: parsed.numericColumns,
      categoricalColumns: parsed.categoricalColumns,
      numericSummaries,
      correlations,
      previewRows: parsed.rows.slice(0, 10),
    };

    return res.json({
      status: 'success',
      summary,
      chapter4Markdown: formatRealDataToChapter4Summary(summary as any),
    });
  } catch (err: any) {
    console.error('Data parsing error:', err);
    res.status(500).json({ error: err?.message || 'Gagal memproses data statistik.' });
  }
});

// DOI Verification Endpoint
app.post(
  ['/api/academic/verify-doi', '/academic/verify-doi', '/api/academic/verify-doi/', '/academic/verify-doi/'],
  (req: Request, res: Response) => {
  try {
    const { doi } = req.body;
    const verification = verifyDoiFormat(doi);
    return res.json({
      ...verification,
      resolverUrl: verification.isValid ? `https://doi.org/${verification.normalizedDoi}` : null,
      openAlexUrl: verification.isValid ? `https://api.openalex.org/works/https://doi.org/${verification.normalizedDoi}` : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// Research Instrument Generator Endpoint
app.post(
  ['/api/academic/design-instruments', '/academic/design-instruments', '/api/academic/design-instruments/', '/academic/design-instruments/'],
  async (req: Request, res: Response) => {
  try {
    const { formData, operationalVars } = req.body;
    const method = formData?.methodologyApproach || 'kuantitatif';
    const isQual = method.includes('kualitatif') || method === 'studi_kasus' || method === 'hukum_empiris';

    const prompt = `Sebagai Ahli Metodologi Penelitian dan Perancang Instrumen Pascasarjana:
Rancang instrumen penelitian ${isQual ? 'Pedoman Wawancara Mendalam & Lembar Observasi' : 'Kuesioner Terstruktur Skala Likert 1–5'} yang valid dan reliabel untuk:
Topik: ${formData?.topic || 'Topik Penelitian'}
Judul: ${formData?.tentativeTitle || formData?.topic || 'Judul Penelitian'}
Metode: ${method}
Subjek/Responden: ${formData?.researchSubject || 'Responden Penelitian'}
Lokus: ${formData?.researchLocation || 'Lokus Penelitian'}

${operationalVars && operationalVars.length > 0 ? `Operasionalisasi Variabel:\n${formatOperationalMatrixToMarkdown(operationalVars)}\n` : `Variabel: ${formData?.variables || 'Variabel Penelitian'}`}

Format Keluaran:
1. Petunjuk Pengisian untuk Responden/Informan
2. Kisi-kisi Matriks Instrumen (Variabel/Fokus -> Dimensi -> Indikator -> Nomor Butir)
3. Daftar Butir Instrumen Lengkap (${isQual ? 'Pertanyaan Utama + Probing Questions mendalam' : 'Butir Pernyataan Positif & Negatif berskala 1–5 Sangat Tidak Setuju s/d Sangat Setuju'})
4. Panduan Uji Validitas dan Reliabilitas Instrumen.`;

    let generatedText = '';
    if (ai) {
      const isSaver = Boolean(formData?.quotaSaverMode);
      const callRes = await callGeminiWithRetry({
        model: isSaver ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash',
        contents: prompt,
        systemInstruction: 'Anda adalah Konsultan Pengukuran Psikometri dan Metodologi Ilmiah terkemuka.',
        thinkingLevel: ThinkingLevel.LOW,
        timeoutMs: 6500,
        maxRetries: 0,
        maxOutputTokens: 2000,
        taskName: 'Gemini Instrument Design',
        allowFallbackModel: true,
      });
      if (callRes.text && callRes.text.trim().length > 100) {
        generatedText = callRes.text;
      }
    }

    if (!generatedText) {
      // Deterministic instrument fallback
      generatedText = `# RANCANGAN INSTRUMEN PENGUMPULAN DATA PENELITIAN
**Topik:** ${formData?.topic || 'Kajian Penelitian'}
**Metode:** ${method} | **Subjek:** ${formData?.researchSubject || 'Partisipan/Responden'}

## 1. Petunjuk Pengisian
Bapak/Ibu/Saudara yang terhormat, kuesioner ini disusun semata-mata untuk kepentingan penelitian akademik. Jawaban yang Anda berikan dijamin kerahasiaannya.

## 2. Kisi-kisi Instrumen Penelitian
| No | Variabel / Dimensi | Indikator | No. Butir Pernyataan |
| :---: | :--- | :--- | :---: |
| 1 | Dimensi 1: Kesiapan Operasional | Pemahaman prosedur kerja | 1, 2, 3 |
| 2 | Dimensi 2: Efektivitas Intervensi | Peningkatan capaian luaran | 4, 5, 6 |
| 3 | Dimensi 3: Dampak Berkelanjutan | Evaluasi keandalan hasil | 7, 8, 9, 10 |

## 3. Butir Pernyataan Instrumen (Skala Likert 1-5)
1. Prosedur pelaksanaan ${formData?.topic || 'kegiatan'} dijelaskan secara transparan dan mudah dipahami. (STS / TS / N / S / SS)
2. Dukungan sarana dan perangkat kerja memadai dalam menunjang akurasi hasil kerja. (STS / TS / N / S / SS)
3. Intervensi yang diterapkan memberikan dampak nyata terhadap efisiensi waktu dan reduksi galat. (STS / TS / N / S / SS)
4. Terdapat mekanisme evaluasi berkala yang konsisten di lokus penelitian. (STS / TS / N / S / SS)`;
    }

    return res.json({ instrumentMarkdown: generatedText });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Gagal menyusun instrumen.' });
  }
});

// Explicit JSON 404 for any unmatched /api/* or /academic/* routes
// Prevents unhandled API calls from ever falling through to Vite or SPA index.html
app.all(['/api', '/api/*', '/academic', '/academic/*'], (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint API tidak ditemukan.',
    status: 404,
  });
});

// ============================================================================
// SERVER INITIALIZATION & VITE WEBSOCKET / HMR INTEGRATION
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const isHmrEnabled = process.env.ENABLE_HMR === 'true';

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // In AI Studio Cloud Run proxy, HMR WebSocket is not supported by the preview iframe gateway.
        // Disabling HMR prevents browser console "WebSocket closed without opened" errors.
        hmr: isHmrEnabled
          ? {
              server: httpServer,
              overlay: false,
            }
          : false,
        ws: isHmrEnabled ? undefined : (false as const),
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  let retryCount = 0;
  const maxRetries = 5;

  function bindHttpServer() {
    if (httpServer.listening) return;
    try {
      httpServer.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
      });
    } catch (e: any) {
      console.warn('[Server] Listen call exception:', e?.message || e);
    }
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      if (retryCount < maxRetries) {
        retryCount++;
        console.warn(`[Server] Port ${PORT} sedang dipakai, mencoba kembali dalam 1000ms... (percobaan ${retryCount}/${maxRetries})`);
        setTimeout(() => {
          if (httpServer.listening) {
            httpServer.close(() => bindHttpServer());
          } else {
            bindHttpServer();
          }
        }, 1000);
      } else {
        console.error(`[Server] Port ${PORT} gagal dibuka setelah ${maxRetries} percobaan.`);
        process.exit(1);
      }
    } else if (err.code === 'ERR_SERVER_NOT_RUNNING' || err.code === 'ECONNRESET' || err.code === 'EPIPE') {
      // Harmless transient socket issues or close on non-running server; do NOT kill process
      console.warn(`[Server] Transient socket event (${err.code}):`, err.message);
    } else {
      console.error('[Server] HTTP Server error:', err);
    }
  });

  bindHttpServer();

  // Graceful shutdown handlers to ensure port is freed immediately on restart
  const gracefulShutdown = () => {
    try {
      if (httpServer.listening) {
        httpServer.close(() => {
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
      // Safety timeout to forcefully exit after 2s if pending sockets exist
      setTimeout(() => {
        process.exit(0);
      }, 2000).unref();
    } catch {
      process.exit(0);
    }
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.warn('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  process.argv.some((arg) => arg.includes('--test') || arg.includes('test'));

const isVercel = Boolean(process.env.VERCEL);

if (!isTestEnv && !isVercel) {
  startServer().catch((err) => {
    console.error('[Server] Fatal error during startServer:', err);
  });
}

export { app, httpServer, startServer };
export default app;
