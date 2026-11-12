import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  Copy,
  Check,
  Printer,
  PlusCircle,
  FileText,
  User,
  GraduationCap,
  Building,
  Calendar,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Eye,
  Stamp,
  Award,
  Layers,
  FileSignature,
} from 'lucide-react';
import {
  AcademicFormData,
  generatePreliminaryPagesText,
  PreliminaryPartType,
} from '../utils/academicRules.ts';

interface PreliminaryPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: AcademicFormData;
  onUpdateFormData: (updated: Partial<AcademicFormData>) => void;
  onInsertToContent: (preliminaryText: string, part: PreliminaryPartType) => void;
  initialTab?: PreliminarySheetTab;
}

export type PreliminarySheetTab =
  | 'all'
  | 'cover'
  | 'approval_advisor'
  | 'approval_examiners'
  | 'statement';

export const PreliminaryPagesModal: React.FC<PreliminaryPagesModalProps> = ({
  isOpen,
  onClose,
  formData,
  onUpdateFormData,
  onInsertToContent,
  initialTab = 'all',
}) => {
  const [activeTab, setActiveTab] = useState<PreliminarySheetTab>(initialTab || 'all');
  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual');
  const [isCopied, setIsCopied] = useState(false);
  const [isInserted, setIsInserted] = useState(false);
  const [insertedNotice, setInsertedNotice] = useState('');
  const [showEditFields, setShowEditFields] = useState(false);

  // Local state for instant reactivity and field customization
  const [studentName, setStudentName] = useState(formData.studentName || '');
  const [studentId, setStudentId] = useState(formData.studentId || '');
  const [advisor1, setAdvisor1] = useState(formData.advisor1 || '');
  const [advisor2, setAdvisor2] = useState(formData.advisor2 || '');
  const [headOfDepartment, setHeadOfDepartment] = useState(
    formData.headOfDepartment || 'Nama Ketua Program Studi, M.Kom.'
  );
  const [deanName, setDeanName] = useState(
    formData.deanName || 'Nama Dekan Fakultas, Dr., M.Sc.'
  );
  const [cityLocation, setCityLocation] = useState(formData.cityLocation || 'Jakarta');
  const [examDate, setExamDate] = useState('');
  const [year, setYear] = useState(
    formData.academicYear || new Date().getFullYear().toString()
  );

  // Re-sync local states and tab when modal opens
  React.useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      setStudentName(formData.studentName || '');
      setStudentId(formData.studentId || '');
      setAdvisor1(formData.advisor1 || '');
      setAdvisor2(formData.advisor2 || '');
      setHeadOfDepartment(formData.headOfDepartment || 'Nama Ketua Program Studi, M.Kom.');
      setDeanName(formData.deanName || 'Nama Dekan Fakultas, Dr., M.Sc.');
      setCityLocation(formData.cityLocation || 'Jakarta');
      setYear(formData.academicYear || new Date().getFullYear().toString());
    }
  }, [isOpen, initialTab, formData]);

  if (!isOpen) return null;

  // Sync edits to parent
  const handleFieldChange = (key: keyof AcademicFormData, val: string) => {
    onUpdateFormData({ [key]: val });
  };

  const currentFormData: Partial<AcademicFormData> = {
    ...formData,
    studentName: studentName || formData.studentName || 'NAMA MAHASISWA',
    studentId: studentId || formData.studentId || 'NIM MAHASISWA',
    advisor1: advisor1 || formData.advisor1 || 'Nama Dosen Pembimbing I, M.Kom., Ph.D.',
    advisor2: advisor2 || formData.advisor2 || 'Nama Dosen Pembimbing II, M.T.',
    headOfDepartment: headOfDepartment || formData.headOfDepartment || 'Nama Ketua Program Studi, M.Kom.',
    deanName: deanName || formData.deanName || 'Nama Dekan Fakultas, Dr., M.Sc.',
    cityLocation: cityLocation || formData.cityLocation || 'Jakarta',
    academicYear: year || formData.academicYear || new Date().getFullYear().toString(),
  };

  const degreeLabel =
    formData.degreeLevel === 'S2'
      ? 'TESIS'
      : formData.degreeLevel === 'S3'
      ? 'DISERTASI'
      : formData.degreeLevel === 'D3'
      ? 'TUGAS AKHIR'
      : formData.degreeLevel === 'D4'
      ? 'SKRIPSI TERAPAN'
      : 'SKRIPSI';

  const degreeTitle =
    formData.degreeLevel === 'S2'
      ? 'Magister'
      : formData.degreeLevel === 'S3'
      ? 'Doktor'
      : formData.degreeLevel === 'D3'
      ? 'Ahli Madya'
      : formData.degreeLevel === 'D4'
      ? 'Sarjana Terapan'
      : 'Sarjana';

  const studyProgram =
    formData.studyProgramName || formData.studyProgramCategory || 'Teknik Informatika';
  const faculty = formData.facultyName || 'Fakultas Teknik & Ilmu Komputer';
  const institution = formData.institutionName || 'UNIVERSITAS INDONESIA';
  const title = (formData.tentativeTitle || formData.topic || 'JUDUL PENELITIAN SKRIPSI / TESIS').toUpperCase();

  const previewCleanText = generatePreliminaryPagesText(
    currentFormData,
    activeTab === 'cover'
      ? 'cover_outer'
      : activeTab === 'approval_advisor'
      ? 'approval_advisor'
      : activeTab === 'approval_examiners'
      ? 'approval_examiners'
      : activeTab === 'statement'
      ? 'statement'
      : 'all'
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(previewCleanText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInsertPart = (part: PreliminaryPartType, noticeLabel: string) => {
    const textToInsert = generatePreliminaryPagesText(currentFormData, part);
    onInsertToContent(textToInsert, part);
    setInsertedNotice(noticeLabel);
    setIsInserted(true);
    setTimeout(() => {
      setIsInserted(false);
      onClose();
    }, 1200);
  };

  const handlePrint = () => {
    window.print();
  };

  // Reusable University Emblem Crest SVG
  const UniversitySeal = () => (
    <div className="flex flex-col items-center justify-center my-6 group">
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-amber-600/40 bg-gradient-to-b from-amber-50/50 via-white to-sky-50/40 p-2 shadow-xs flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full text-[#1E3A5F]">
          {/* Outer Gear / Wreath Pattern */}
          <circle cx="50" cy="50" r="46" fill="none" stroke="#B45309" strokeWidth="1.2" strokeDasharray="2,2" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1E3A5F" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#B45309" strokeWidth="0.8" />

          {/* Academic Laurel Leaves (Left) */}
          <path d="M 20 50 C 20 35 30 25 50 18 C 35 28 30 40 32 50 Z" fill="#B45309" opacity="0.3" />
          {/* Academic Laurel Leaves (Right) */}
          <path d="M 80 50 C 80 35 70 25 50 18 C 65 28 70 40 68 50 Z" fill="#B45309" opacity="0.3" />

          {/* Central Open Book of Science & Knowledge */}
          <path
            d="M 32 56 C 42 50 48 52 50 56 C 52 52 58 50 68 56 L 68 70 C 58 64 52 66 50 70 C 48 66 42 64 32 70 Z"
            fill="#1E3A5F"
          />
          <path d="M 50 56 L 50 70" stroke="#FFFFFF" strokeWidth="1" />

          {/* Torch / Flame of Enlightenment */}
          <path
            d="M 50 30 C 47 36 44 40 47 44 C 48.5 46 51.5 46 53 44 C 56 40 53 36 50 30 Z"
            fill="#D97706"
          />
          <path d="M 46 44 L 54 44 L 52 52 L 48 52 Z" fill="#92400E" />

          {/* Five Point Star */}
          <polygon
            points="50,20 52,24 56,24 53,27 54,31 50,28 46,31 47,27 44,24 48,24"
            fill="#B45309"
          />
        </svg>
      </div>
      <span className="text-[10px] sm:text-[11px] font-serif text-slate-500 italic mt-2 tracking-wide">
        [ Lambang / Logo Resmi Perguruan Tinggi ]
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      {/* Print Specific Stylesheet: Isolates the A4 document cleanly for printing without modal UI */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #a4-print-container, #a4-print-container * {
            visibility: visible;
          }
          #a4-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .a4-page-sheet {
            page-break-after: always;
            box-shadow: none !important;
            border: none !important;
            min-height: 297mm;
            padding: 30mm 25mm 25mm 35mm !important;
          }
        }
      `}</style>

      <div className="bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-300 shadow-2xl max-w-5xl w-full max-h-[92dvh] flex flex-col overflow-hidden my-auto">
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#1E3A5F] text-white rounded-xl shadow-xs">
              <FileCheck2 className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
                  Sampul Depan & Lembar Pengesahan Resmi (Format A4)
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-[#1E3A5F] border border-sky-200">
                  Standar Dikti A4
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">
                Tata letak resmi halaman pembuka skripsi/tesis (Cover Luar, Persetujuan, Pengesahan, Pernyataan Keaslian)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditFields(!showEditFields)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                showEditFields
                  ? 'bg-sky-50 border-sky-300 text-sky-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sesuaikan Identitas</span>
              {showEditFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Identity Quick Edit Bar */}
        {showEditFields && (
          <div className="px-6 py-4 bg-sky-50/60 border-b border-sky-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Mahasiswa</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  handleFieldChange('studentName', e.target.value);
                }}
                placeholder="Nama lengkap"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">NIM Mahasiswa</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  handleFieldChange('studentId', e.target.value);
                }}
                placeholder="Nomor Induk Mahasiswa"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Dosen Pembimbing I</label>
              <input
                type="text"
                value={advisor1}
                onChange={(e) => {
                  setAdvisor1(e.target.value);
                  handleFieldChange('advisor1', e.target.value);
                }}
                placeholder="Nama & Gelar Lengkap"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Dosen Pembimbing II</label>
              <input
                type="text"
                value={advisor2}
                onChange={(e) => {
                  setAdvisor2(e.target.value);
                  handleFieldChange('advisor2', e.target.value);
                }}
                placeholder="Nama & Gelar Lengkap"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Ketua Program Studi</label>
              <input
                type="text"
                value={headOfDepartment}
                onChange={(e) => {
                  setHeadOfDepartment(e.target.value);
                  handleFieldChange('headOfDepartment', e.target.value);
                }}
                placeholder="Nama Ketua Program Studi"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Dekan Fakultas</label>
              <input
                type="text"
                value={deanName}
                onChange={(e) => {
                  setDeanName(e.target.value);
                  handleFieldChange('deanName', e.target.value);
                }}
                placeholder="Nama Dekan Fakultas"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Kota Penyusunan</label>
              <input
                type="text"
                value={cityLocation}
                onChange={(e) => {
                  setCityLocation(e.target.value);
                  handleFieldChange('cityLocation', e.target.value);
                }}
                placeholder="Misal: Jakarta, Surabaya, Yogyakarta"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Tahun Akademik</label>
              <input
                type="text"
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  handleFieldChange('academicYear', e.target.value);
                }}
                placeholder="Tahun"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        )}

        {/* View Mode & Page Tabs Bar */}
        <div className="px-5 pt-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Sheet Selector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'all'
                  ? 'border-[#1E3A5F] text-[#1E3A5F] bg-slate-100/70'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              Semua Lembar A4 (Lengkap)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cover')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'cover'
                  ? 'border-[#1E3A5F] text-[#1E3A5F] bg-slate-100/70'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              1. Halaman Sampul (Cover)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('approval_advisor')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'approval_advisor'
                  ? 'border-[#1E3A5F] text-[#1E3A5F] bg-slate-100/70'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              2. Persetujuan Pembimbing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('approval_examiners')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'approval_examiners'
                  ? 'border-[#1E3A5F] text-[#1E3A5F] bg-slate-100/70'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              3. Pengesahan Penguji
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('statement')}
              className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'statement'
                  ? 'border-[#1E3A5F] text-[#1E3A5F] bg-slate-100/70'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              4. Pernyataan Keaslian (Materai)
            </button>
          </div>

          {/* Display Mode: Real A4 Sheet vs Clean Text */}
          <div className="flex items-center gap-1.5 pb-2">
            <span className="text-[11px] text-slate-500 hidden sm:inline mr-1">Tampilan:</span>
            <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('visual')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'visual'
                    ? 'bg-white text-[#1E3A5F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lembar Kertas A4</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('text')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'text'
                    ? 'bg-white text-[#1E3A5F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Teks Bersih (Plain)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Viewing Area */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-200/70 space-y-8">
          {/* Subtle Margin and Page Guideline Notice */}
          <div className="max-w-3xl mx-auto flex items-center justify-between text-[11px] text-slate-600 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>
                <strong>Format Dokumen A4 Resmi:</strong> Margin Kiri 4 cm • Atas 3 cm • Kanan 3 cm • Bawah 3 cm • Font Times New Roman
              </span>
            </div>
            <span className="hidden sm:inline text-slate-400">
              {viewMode === 'visual' ? 'Tampilan Siap Cetak (Wysiwyg)' : 'Format Siap Salin ke Word'}
            </span>
          </div>

          {/* VIEW MODE: REALISTIC A4 VISUAL SHEET */}
          {viewMode === 'visual' ? (
            <div id="a4-print-container" className="space-y-10">
              {/* SHEET 1: COVER LUAR / HALAMAN SAMPUL DEPAN */}
              {(activeTab === 'all' || activeTab === 'cover') && (
                <div className="a4-page-sheet max-w-2xl sm:max-w-3xl mx-auto bg-white p-4 sm:p-10 md:p-14 sm:py-16 shadow-2xl rounded-sm border border-slate-300 font-serif text-slate-900 text-center flex flex-col justify-between min-h-[780px] sm:min-h-[1050px] relative select-text">
                  {/* Watermark / Sheet Label */}
                  <div className="absolute top-3 right-4 text-[10px] font-sans font-semibold text-slate-300 uppercase tracking-widest pointer-events-none">
                    Halaman Sampul Depan
                  </div>

                  {/* 1. Judul Skripsi / Tesis (Piramida Terbalik) */}
                  <div className="space-y-3 pt-2">
                    <h1 className="text-base sm:text-xl font-bold uppercase tracking-wide leading-snug max-w-xl mx-auto text-slate-950 font-serif">
                      {title}
                    </h1>
                  </div>

                  {/* 2. Keterangan Jenis Karya & Peruntukan */}
                  <div className="space-y-2 py-4">
                    <p className="text-sm sm:text-base font-bold tracking-widest uppercase text-slate-900 font-serif">
                      {degreeLabel}
                    </p>
                    <p className="text-xs sm:text-sm italic leading-relaxed max-w-md mx-auto text-slate-700">
                      Diajukan untuk memenuhi salah satu syarat memperoleh gelar {degreeTitle} pada Program Studi {studyProgram}
                    </p>
                  </div>

                  {/* 3. Logo / Lambang Universitas */}
                  <UniversitySeal />

                  {/* 4. Identitas Penulis */}
                  <div className="space-y-1.5 py-4">
                    <p className="text-xs sm:text-sm font-semibold uppercase text-slate-700">Oleh:</p>
                    <p className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-950 underline underline-offset-4 decoration-1">
                      {studentName || 'NAMA LENGKAP MAHASISWA'}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                      NIM. {studentId || 'NOMOR INDUK MAHASISWA'}
                    </p>
                  </div>

                  {/* 5. Identitas Program Studi, Fakultas, Universitas, Tahun */}
                  <div className="pt-6 space-y-1 uppercase font-bold text-xs sm:text-sm tracking-wide text-slate-950 border-t border-slate-200 sm:border-transparent">
                    <p>PROGRAM STUDI {studyProgram.toUpperCase()}</p>
                    <p>{faculty.toUpperCase()}</p>
                    <p>{institution.toUpperCase()}</p>
                    <p className="font-normal pt-1">{cityLocation.toUpperCase()}, {year}</p>
                  </div>
                </div>
              )}

              {/* SHEET 2: LEMBAR PERSETUJUAN PEMBIMBING */}
              {(activeTab === 'all' || activeTab === 'approval_advisor') && (
                <div className="a4-page-sheet max-w-2xl sm:max-w-3xl mx-auto bg-white p-4 sm:p-10 md:p-14 sm:py-16 shadow-2xl rounded-sm border border-slate-300 font-serif text-slate-900 flex flex-col justify-between min-h-[780px] sm:min-h-[1050px] relative select-text">
                  <div className="absolute top-3 right-4 text-[10px] font-sans font-semibold text-slate-300 uppercase tracking-widest pointer-events-none">
                    Lembar Persetujuan Pembimbing
                  </div>

                  {/* Header Title */}
                  <div className="text-center space-y-2 pb-6 border-b border-slate-200">
                    <h2 className="text-sm sm:text-lg font-bold uppercase tracking-wider text-slate-950">
                      LEMBAR PERSETUJUAN PEMBIMBING
                    </h2>
                    <p className="text-xs text-slate-600 font-sans">
                      Naskah Ujian Sidang {degreeLabel}
                    </p>
                  </div>

                  {/* Metadata Tanpa Garis Tabel */}
                  <div className="py-3 space-y-1.5 text-xs sm:text-sm leading-relaxed">
                    <div className="grid grid-cols-12 gap-2 py-0.5">
                      <span className="col-span-4 sm:col-span-3 font-bold text-slate-800">Judul {degreeLabel}</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-7 sm:col-span-8 font-bold text-slate-950 uppercase">{title}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 py-0.5">
                      <span className="col-span-4 sm:col-span-3 font-semibold text-slate-700">Nama Mahasiswa</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-7 sm:col-span-8 text-slate-900">{studentName || 'Nama Mahasiswa'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 py-0.5">
                      <span className="col-span-4 sm:col-span-3 font-semibold text-slate-700">NIM</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-7 sm:col-span-8 text-slate-900">{studentId || 'NIM Mahasiswa'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 py-0.5">
                      <span className="col-span-4 sm:col-span-3 font-semibold text-slate-700">Program Studi</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-7 sm:col-span-8 text-slate-900">{studyProgram}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 py-0.5">
                      <span className="col-span-4 sm:col-span-3 font-semibold text-slate-700">Fakultas</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-7 sm:col-span-8 text-slate-900">{faculty}</span>
                    </div>
                  </div>

                  {/* Kalimat Persetujuan */}
                  <div className="py-3 text-xs sm:text-sm leading-relaxed text-justify text-slate-800">
                    <p>
                      Naskah <strong>{degreeLabel}</strong> ini telah diperiksa secara seksama, dikoreksi sesuai kaidah akademik, dan dinyatakan <strong>DISETUJUI</strong> untuk diajukan serta diujikan pada Sidang Ujian {degreeLabel} Program Studi {studyProgram} {institution}.
                    </p>
                  </div>

                  {/* Tanggal & Kolom Tanda Tangan Pembimbing */}
                  <div className="pt-4 space-y-6">
                    <p className="text-right text-xs sm:text-sm text-slate-800">
                      {cityLocation}, .................................... {year}
                    </p>

                    <div className="grid grid-cols-2 gap-8 text-center text-xs sm:text-sm">
                      <div className="flex flex-col justify-between h-36">
                        <p className="font-bold text-slate-900">Dosen Pembimbing I,</p>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-950 underline underline-offset-4 decoration-1">
                            {advisor1 || 'Nama Pembimbing I, M.Kom.'}
                          </p>
                          <p className="text-[11px] text-slate-600">NIP/NIDN. ........................................</p>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between h-36">
                        <p className="font-bold text-slate-900">Dosen Pembimbing II,</p>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-950 underline underline-offset-4 decoration-1">
                            {advisor2 || 'Nama Pembimbing II, M.T.'}
                          </p>
                          <p className="text-[11px] text-slate-600">NIP/NIDN. ........................................</p>
                        </div>
                      </div>
                    </div>

                    {/* Mengetahui Ketua Program Studi */}
                    <div className="pt-6 text-center text-xs sm:text-sm flex flex-col items-center">
                      <p className="font-bold text-slate-900">Mengetahui,</p>
                      <p className="text-slate-800 font-semibold mb-16">
                        Ketua Program Studi {studyProgram}
                      </p>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-950 underline underline-offset-4 decoration-1">
                          {headOfDepartment}
                        </p>
                        <p className="text-[11px] text-slate-600">NIP/NIDN. ........................................</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SHEET 3: LEMBAR PENGESAHAN TIM PENGUJI */}
              {(activeTab === 'all' || activeTab === 'approval_examiners') && (
                <div className="a4-page-sheet max-w-2xl sm:max-w-3xl mx-auto bg-white p-4 sm:p-10 md:p-14 sm:py-16 shadow-2xl rounded-sm border border-slate-300 font-serif text-slate-900 flex flex-col justify-between min-h-[780px] sm:min-h-[1050px] relative select-text">
                  <div className="absolute top-3 right-4 text-[10px] font-sans font-semibold text-slate-300 uppercase tracking-widest pointer-events-none">
                    Lembar Pengesahan Tim Penguji
                  </div>

                  {/* Header Title */}
                  <div className="text-center space-y-2 pb-6 border-b border-slate-200">
                    <h2 className="text-sm sm:text-lg font-bold uppercase tracking-wider text-slate-950">
                      LEMBAR PENGESAHAN PENGUJI
                    </h2>
                    <p className="text-xs text-slate-600 font-sans">
                      Dewan Penguji Sidang Ujian {degreeLabel}
                    </p>
                  </div>

                  {/* Metadata Naskah (Tanpa Garis Tabel) */}
                  <div className="py-3 space-y-1.5 text-xs sm:text-sm leading-relaxed">
                    <div className="grid grid-cols-12 gap-2 py-0.5">
                      <span className="col-span-4 sm:col-span-3 font-bold text-slate-800">Judul {degreeLabel}</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-7 sm:col-span-8 font-bold text-slate-950 uppercase">{title}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 py-0.5">
                      <span className="col-span-4 sm:col-span-3 font-semibold text-slate-700">Nama Mahasiswa</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-7 sm:col-span-8 text-slate-900">{studentName || 'Nama Mahasiswa'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 py-0.5">
                      <span className="col-span-4 sm:col-span-3 font-semibold text-slate-700">NIM</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-7 sm:col-span-8 text-slate-900">{studentId || 'NIM Mahasiswa'}</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 py-0.5">
                      <span className="col-span-4 sm:col-span-3 font-semibold text-slate-700">Program Studi</span>
                      <span className="col-span-1 text-center font-bold">:</span>
                      <span className="col-span-7 sm:col-span-8 text-slate-900">{studyProgram}</span>
                    </div>
                  </div>

                  {/* Kalimat Kelulusan Ujian */}
                  <div className="py-3 text-xs sm:text-sm leading-relaxed text-justify text-slate-800">
                    <p>
                      Naskah <strong>{degreeLabel}</strong> ini telah dipertahankan di hadapan Dewan Penguji dan dinyatakan <strong>LULUS</strong> pada Sidang Ujian {degreeLabel} pada hari ........................., tanggal ........................................ {year}.
                    </p>
                  </div>

                  {/* Tabel Susunan Dewan Penguji */}
                  <div className="py-4 space-y-3">
                    <p className="font-bold text-xs sm:text-sm text-slate-900">TIM DEWAN PENGUJI:</p>
                    <div className="border border-slate-300 rounded-lg overflow-hidden text-xs sm:text-sm">
                      <div className="grid grid-cols-12 bg-slate-100 p-2.5 font-bold border-b border-slate-300 text-slate-800">
                        <span className="col-span-1 text-center">No</span>
                        <span className="col-span-4">Jabatan</span>
                        <span className="col-span-4">Nama Lengkap & Gelar</span>
                        <span className="col-span-3 text-center">Tanda Tangan</span>
                      </div>

                      <div className="grid grid-cols-12 p-3 border-b border-slate-200 items-center">
                        <span className="col-span-1 text-center font-semibold">1.</span>
                        <span className="col-span-4 font-semibold text-slate-800">Ketua Penguji</span>
                        <span className="col-span-4 text-slate-600 italic">......................................................</span>
                        <span className="col-span-3 text-center text-slate-500 font-sans text-[11px]">( ................................ )</span>
                      </div>

                      <div className="grid grid-cols-12 p-3 border-b border-slate-200 items-center">
                        <span className="col-span-1 text-center font-semibold">2.</span>
                        <span className="col-span-4 font-semibold text-slate-800">Anggota Penguji I</span>
                        <span className="col-span-4 text-slate-600 italic">......................................................</span>
                        <span className="col-span-3 text-center text-slate-500 font-sans text-[11px]">( ................................ )</span>
                      </div>

                      <div className="grid grid-cols-12 p-3 items-center">
                        <span className="col-span-1 text-center font-semibold">3.</span>
                        <span className="col-span-4 font-semibold text-slate-800">Anggota Penguji II</span>
                        <span className="col-span-4 text-slate-600 italic">......................................................</span>
                        <span className="col-span-3 text-center text-slate-500 font-sans text-[11px]">( ................................ )</span>
                      </div>
                    </div>
                  </div>

                  {/* Mengesahkan Dekan Fakultas */}
                  <div className="pt-6 text-center text-xs sm:text-sm flex flex-col items-center">
                    <p className="font-bold text-slate-900">Mengesahkan,</p>
                    <p className="text-slate-800 font-semibold mb-16">
                      Dekan {faculty}
                    </p>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-950 underline underline-offset-4 decoration-1">
                        {deanName}
                      </p>
                      <p className="text-[11px] text-slate-600">NIP/NIDN. ........................................</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SHEET 4: SURAT PERNYATAAN KEASLIAN BERMATERAI (1 HALAMAN RESMI) */}
              {(activeTab === 'all' || activeTab === 'statement') && (
                <div className="a4-page-sheet max-w-2xl sm:max-w-3xl mx-auto bg-white p-4 sm:p-8 md:p-10 sm:py-10 shadow-2xl rounded-sm border border-slate-300 font-serif text-slate-900 flex flex-col justify-between min-h-[680px] sm:min-h-[850px] relative select-text">
                  <div className="absolute top-3 right-4 text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-widest pointer-events-none">
                    Pernyataan Keaslian (1 Halaman)
                  </div>

                  {/* Header Title */}
                  <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                    <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-950 font-serif">
                      SURAT PERNYATAAN KEASLIAN KARYA ILMIAH
                    </h2>
                    <p className="text-[11px] text-slate-600 font-sans">
                      Bebas Plagiarisme & Keaslian Naskah Akademik
                    </p>
                  </div>

                  {/* Identitas Mahasiswa Tanpa Tabel */}
                  <div className="py-2 space-y-1 text-xs sm:text-sm">
                    <p className="font-semibold text-slate-800 mb-1">Yang bertanda tangan di bawah ini:</p>
                    <div className="pl-3 space-y-0.5 border-l-2 border-slate-300">
                      <p><span className="w-28 sm:w-32 inline-block font-semibold text-slate-700">Nama Lengkap</span> : <strong>{studentName || 'Nama Mahasiswa'}</strong></p>
                      <p><span className="w-28 sm:w-32 inline-block font-semibold text-slate-700">NIM</span> : <strong>{studentId || 'NIM Mahasiswa'}</strong></p>
                      <p><span className="w-28 sm:w-32 inline-block font-semibold text-slate-700">Program Studi</span> : {studyProgram}</p>
                      <p><span className="w-28 sm:w-32 inline-block font-semibold text-slate-700">Fakultas</span> : {faculty}</p>
                      <p><span className="w-28 sm:w-32 inline-block font-semibold text-slate-700">Perguruan Tinggi</span> : {institution}</p>
                    </div>
                  </div>

                  {/* Isi Surat Pernyataan */}
                  <div className="py-1 space-y-2 text-xs sm:text-sm leading-relaxed text-justify text-slate-800">
                    <p>
                      Dengan ini menyatakan dengan penuh kesadaran dan tanggung jawab bahwa {degreeLabel} yang berjudul:
                    </p>
                    <blockquote className="p-2 bg-slate-50 rounded border-l-4 border-[#1E3A5F] font-bold text-center uppercase tracking-wide text-slate-950 text-xs sm:text-sm">
                      "{title}"
                    </blockquote>
                    <p className="indent-4 sm:indent-6">
                      1. Adalah <strong>benar-benar hasil karya ilmiah mandiri saya sendiri</strong>, bukan merupakan tiruan, saduran, atau penjiplakan (<strong>plagiarisme</strong>) dari karya orang lain, serta belum pernah diajukan untuk memperoleh gelar akademik di perguruan tinggi mana pun.
                    </p>
                    <p className="indent-4 sm:indent-6">
                      2. Semua sumber data, teori, gagasan, dan rujukan kutipan telah dicantumkan dalam teks naskah dan disebutkan dalam Daftar Pustaka sesuai kaidah serta etika penulisan karya ilmiah yang berlaku.
                    </p>
                    <p className="indent-4 sm:indent-6">
                      3. Apabila di kemudian hari terbukti atau dapat dibuktikan terdapat unsur plagiarisme atau manipulasi data, saya bersedia menerima sanksi akademik berupa <strong>pencabutan gelar akademik</strong> yang telah diperoleh, serta sanksi hukum sesuai ketentuan perundang-undangan.
                    </p>
                    <p className="indent-4 sm:indent-6">
                      Demikian surat pernyataan ini saya buat dengan sebenar-benarnya dalam keadaan sehat jasmani dan rohani, tanpa paksaan maupun tekanan dari pihak mana pun.
                    </p>
                  </div>

                  {/* Kolom Tanda Tangan Bermaterai */}
                  <div className="pt-3 flex justify-end">
                    <div className="w-64 text-center text-xs sm:text-sm space-y-1.5">
                      <p className="text-slate-800">
                        {cityLocation}, .................................... {year}
                      </p>
                      <p className="font-semibold text-slate-900">Yang membuat pernyataan,</p>

                      {/* Kotak Materai Tempel Rp 10.000 */}
                      <div className="relative mx-auto my-1.5 w-36 h-18 border-2 border-dashed border-amber-500/70 bg-amber-50/40 rounded-lg flex flex-col items-center justify-center p-1 shadow-2xs">
                        <Stamp className="w-4 h-4 text-amber-600 mb-0.5 opacity-70" />
                        <span className="text-[9px] font-sans font-bold text-amber-900 uppercase tracking-wider">
                          METERAI TEMPEL
                        </span>
                        <span className="text-[10px] font-sans font-extrabold text-amber-800">
                          Rp 10.000
                        </span>
                        <span className="text-[7.5px] font-sans text-amber-700/80 text-center leading-tight">
                          Tanda tangan basah menyentuh meterai
                        </span>
                      </div>

                      <div className="space-y-0.5 pt-0.5">
                        <p className="font-bold text-slate-950 uppercase underline underline-offset-4 decoration-1">
                          {studentName || 'NAMA LENGKAP MAHASISWA'}
                        </p>
                        <p className="text-[11px] text-slate-700 font-semibold">
                          NIM. {studentId || 'NOMOR INDUK MAHASISWA'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE: CLEAN TEXT (NO RAW HTML OR WEIRD SYMBOLS) */
            <div className="max-w-3xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-lg border border-slate-300 font-mono text-xs sm:text-sm leading-relaxed text-slate-800">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <span className="text-xs font-bold font-sans text-slate-600">
                  Teks Terstruktur Bersih (Siap Salin ke Microsoft Word / Google Docs)
                </span>
                <span className="text-[11px] font-sans text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Bebas Simbol Kode
                </span>
              </div>
              <pre className="font-serif whitespace-pre-wrap leading-relaxed select-text text-slate-900">
                {previewCleanText}
              </pre>
            </div>
          )}
        </div>

        {/* Quick Sheet Insertion Selection Bar */}
        <div className="px-6 py-2.5 bg-slate-100/90 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Layers className="w-4 h-4 text-[#1E3A5F]" />
            <span className="hidden sm:inline">Pilihan Sisipkan ke Naskah:</span>
            <span className="sm:hidden">Pilihan:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleInsertPart('all', 'Semua Lembar A4 (Lengkap)')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                activeTab === 'all'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title="Sisipkan 4 lembar lengkap: Sampul, Persetujuan, Pengesahan, & Pernyataan Keaslian"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Semua Lembar A4</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertPart('cover_outer', 'Halaman Sampul Saja')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1 cursor-pointer shadow-2xs ${
                activeTab === 'cover'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title="Sisipkan hanya Halaman Sampul Depan"
            >
              <span>1. Sampul Saja</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertPart('approval_advisor', 'Persetujuan Pembimbing Saja')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1 cursor-pointer shadow-2xs ${
                activeTab === 'approval_advisor'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title="Sisipkan hanya Lembar Persetujuan Pembimbing"
            >
              <span>2. Persetujuan Saja</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertPart('approval_examiners', 'Pengesahan Penguji Saja')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1 cursor-pointer shadow-2xs ${
                activeTab === 'approval_examiners'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title="Sisipkan hanya Lembar Pengesahan Penguji"
            >
              <span>3. Pengesahan Saja</span>
            </button>

            <button
              type="button"
              onClick={() => handleInsertPart('statement', 'Pernyataan Keaslian Saja')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1 cursor-pointer shadow-2xs ${
                activeTab === 'statement'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
              title="Sisipkan hanya Surat Pernyataan Keaslian Bermaterai"
            >
              <span>4. Pernyataan Saja</span>
            </button>
          </div>
        </div>

        {/* Bottom Footer Action Bar */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-bold text-[#1E3A5F]">{degreeLabel} ({formData.degreeLevel || 'S1'})</span>
            <span>•</span>
            <span className="truncate max-w-[200px] font-medium text-slate-700">{studyProgram}</span>
            <span>•</span>
            <span className="hidden sm:inline">{cityLocation}, {year}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Cetak langsung atau simpan sebagai dokumen PDF A4"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak / PDF A4</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            {/* Dynamic Contextual Insert Button */}
            {activeTab === 'all' ? (
              <button
                type="button"
                onClick={() => handleInsertPart('all', 'Semua Lembar A4 (Lengkap)')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-sky-700 hover:from-sky-700 hover:to-[#1E3A5F] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                {isInserted ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Berhasil Disisipkan!</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-sky-300" />
                    <span>Sisipkan Semua Lembar A4 ke Naskah</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const partType =
                      activeTab === 'cover'
                        ? 'cover_outer'
                        : activeTab === 'approval_advisor'
                        ? 'approval_advisor'
                        : activeTab === 'approval_examiners'
                        ? 'approval_examiners'
                        : 'statement';
                    const label =
                      activeTab === 'cover'
                        ? 'Halaman Sampul Saja'
                        : activeTab === 'approval_advisor'
                        ? 'Persetujuan Pembimbing Saja'
                        : activeTab === 'approval_examiners'
                        ? 'Pengesahan Penguji Saja'
                        : 'Pernyataan Keaslian Saja';
                    handleInsertPart(partType, label);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-sky-700 hover:from-sky-700 hover:to-[#1E3A5F] text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isInserted ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>{insertedNotice || 'Berhasil Disisipkan!'}</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 text-sky-300" />
                      <span>
                        {activeTab === 'cover'
                          ? 'Sisipkan Sampul Ini Saja'
                          : activeTab === 'approval_advisor'
                          ? 'Sisipkan Persetujuan Ini Saja'
                          : activeTab === 'approval_examiners'
                          ? 'Sisipkan Pengesahan Ini Saja'
                          : 'Sisipkan Pernyataan Ini Saja'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleInsertPart('all', 'Semua Lembar A4 (Lengkap)')}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Sisipkan seluruh 4 lembar pembuka sekaligus"
                >
                  <Layers className="w-3.5 h-3.5 text-[#1E3A5F]" />
                  <span>Sisipkan Semua</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
