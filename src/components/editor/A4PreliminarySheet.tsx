import React, { memo } from 'react';
import {
  Stamp,
  Edit3,
  X,
} from 'lucide-react';
import {
  ParsedPreliminarySheet,
  AcademicFormData,
  formatRomanPageNumber,
  PreliminaryPartType,
} from '../../utils/academicRules.ts';

const UniversityEmblemSeal: React.FC = () => (
  <div className="flex flex-col items-center justify-center my-4 select-none">
    <div className="relative w-28 h-28 rounded-full border-2 border-amber-600/40 bg-gradient-to-b from-amber-50/50 via-white to-sky-50/40 p-2 shadow-xs flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full text-[#1E3A5F]">
        <circle cx="50" cy="50" r="46" fill="none" stroke="#B45309" strokeWidth="1.2" strokeDasharray="2,2" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#1E3A5F" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#B45309" strokeWidth="0.8" />
        <path d="M 20 50 C 20 35 30 25 50 18 C 35 28 30 40 32 50 Z" fill="#B45309" opacity="0.3" />
        <path d="M 80 50 C 80 35 70 25 50 18 C 65 28 70 40 68 50 Z" fill="#B45309" opacity="0.3" />
        <path
          d="M 32 56 C 42 50 48 52 50 56 C 52 52 58 50 68 56 L 68 70 C 58 64 52 66 50 70 C 48 66 42 64 32 70 Z"
          fill="#1E3A5F"
        />
        <path d="M 50 56 L 50 70" stroke="#FFFFFF" strokeWidth="1" />
        <path
          d="M 50 30 C 47 36 44 40 47 44 C 48.5 46 51.5 46 53 44 C 56 40 53 36 50 30 Z"
          fill="#D97706"
        />
        <path d="M 46 44 L 54 44 L 52 52 L 48 52 Z" fill="#92400E" />
        <polygon
          points="50,20 52,24 56,24 53,27 54,31 50,28 46,31 47,27 44,24 48,24"
          fill="#B45309"
        />
      </svg>
    </div>
    <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mt-1.5">
      Lambang / Logo Resmi Kampus
    </span>
    <span className="text-[8.5px] font-sans italic text-slate-400">
      (Format Standar Karya Ilmiah)
    </span>
  </div>
);

export interface A4PreliminarySheetProps {
  sheet: ParsedPreliminarySheet;
  sheetIndex: number;
  formData: AcademicFormData;
  fontSizePt: number;
  lineSpacing: number;
  fontFamily: string;
  onOpenModal: (tab: PreliminaryPartType) => void;
  onRemoveSheet: (tab: PreliminaryPartType) => void;
}

export function renderPreliminarySheetContent(
  sheet: ParsedPreliminarySheet,
  fontSizePt: number,
  _lineSpacing: number
) {
  const details = sheet.details || sheet.data || ({} as any);
  const { title = '', degreeLabel = '', degreeTitle = '', studentName = '', studentId = '', studyProgram = '', faculty = '', institution = '', year = '', cityLocation = '', advisor1 = '', advisor2 = '', headOfDepartment = '', deanName = '' } = details;

  switch (sheet.type) {
    case 'cover':
      return (
        <div className="font-serif text-slate-900 text-center flex flex-col justify-between h-full min-h-[820px] select-text">
          <div className="space-y-2 pt-2">
            <h1
              className="font-bold uppercase tracking-wide leading-snug max-w-xl mx-auto text-slate-950 font-serif"
              style={{ fontSize: `${fontSizePt + 2}pt`, lineHeight: 1.35 }}
            >
              {title}
            </h1>
          </div>

          <div className="space-y-2 py-3">
            <p
              className="font-bold tracking-widest uppercase text-slate-900 font-serif"
              style={{ fontSize: `${fontSizePt + 1}pt` }}
            >
              {degreeLabel}
            </p>
            <p
              className="italic leading-relaxed max-w-md mx-auto text-slate-700"
              style={{ fontSize: `${fontSizePt - 1}pt` }}
            >
              Diajukan untuk memenuhi salah satu syarat memperoleh gelar {degreeTitle} pada Program Studi {studyProgram}
            </p>
          </div>

          <UniversityEmblemSeal />

          <div className="space-y-1 py-3">
            <p className="text-xs font-semibold uppercase text-slate-700">Oleh:</p>
            <p
              className="font-bold uppercase tracking-wider text-slate-950 underline underline-offset-4 decoration-1 font-serif"
              style={{ fontSize: `${fontSizePt + 1}pt` }}
            >
              {studentName}
            </p>
            <p className="font-semibold text-slate-800" style={{ fontSize: `${fontSizePt - 1}pt` }}>
              NIM. {studentId}
            </p>
          </div>

          <div
            className="pt-4 space-y-1 uppercase font-bold tracking-wide text-slate-950 border-t border-slate-200"
            style={{ fontSize: `${fontSizePt}pt` }}
          >
            <p>PROGRAM STUDI {studyProgram.toUpperCase()}</p>
            <p>{faculty.toUpperCase()}</p>
            <p>{institution.toUpperCase()}</p>
            <p className="font-normal pt-1">{cityLocation.toUpperCase()}, {year}</p>
          </div>
        </div>
      );

    case 'approval_advisor':
      return (
        <div className="font-serif text-slate-900 flex flex-col justify-between h-full min-h-[820px] select-text">
          <div className="text-center space-y-1 pb-4 border-b border-slate-200">
            <h2
              className="font-bold uppercase tracking-wider text-slate-950 font-serif"
              style={{ fontSize: `${fontSizePt + 2}pt` }}
            >
              LEMBAR PERSETUJUAN PEMBIMBING
            </h2>
            <p className="text-xs text-slate-600 font-sans">
              Naskah Ujian Sidang {degreeLabel}
            </p>
          </div>

          <div className="py-2 space-y-1 leading-relaxed" style={{ fontSize: `${fontSizePt}pt` }}>
            <div className="grid grid-cols-12 gap-2 py-0.5">
              <span className="col-span-4 font-bold text-slate-800">Judul {degreeLabel}</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 font-bold text-slate-950 uppercase">{title}</span>
            </div>
            <div className="grid grid-cols-12 gap-2 py-0.5">
              <span className="col-span-4 font-semibold text-slate-700">Nama Mahasiswa</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 text-slate-900">{studentName}</span>
            </div>
            <div className="grid grid-cols-12 gap-2 py-0.5">
              <span className="col-span-4 font-semibold text-slate-700">NIM</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 text-slate-900">{studentId}</span>
            </div>
            <div className="grid grid-cols-12 gap-2 py-0.5">
              <span className="col-span-4 font-semibold text-slate-700">Program Studi</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 text-slate-900">{studyProgram}</span>
            </div>
            <div className="grid grid-cols-12 gap-2 py-0.5">
              <span className="col-span-4 font-semibold text-slate-700">Fakultas</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 text-slate-900">{faculty}</span>
            </div>
          </div>

          <div className="py-2 text-justify leading-relaxed text-slate-800" style={{ fontSize: `${fontSizePt}pt` }}>
            <p className="indent-8">
              Naskah {degreeLabel} ini telah diperiksa secara seksama, dikoreksi sesuai kaidah akademik, dan dinyatakan <strong>DISETUJUI</strong> untuk diajukan serta diujikan pada Sidang Ujian {degreeLabel} Program Studi {studyProgram} {institution}.
            </p>
          </div>

          <div className="pt-2 text-right">
            <p className="text-slate-800" style={{ fontSize: `${fontSizePt}pt` }}>
              {cityLocation}, .................................... {year}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 text-center">
            <div className="space-y-16">
              <p className="font-semibold text-slate-800" style={{ fontSize: `${fontSizePt}pt` }}>Dosen Pembimbing I,</p>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-950 underline underline-offset-4 decoration-1" style={{ fontSize: `${fontSizePt}pt` }}>
                  {advisor1}
                </p>
                <p className="text-xs text-slate-500 font-sans">NIP/NIDN. ........................................</p>
              </div>
            </div>
            <div className="space-y-16">
              <p className="font-semibold text-slate-800" style={{ fontSize: `${fontSizePt}pt` }}>Dosen Pembimbing II,</p>
              <div className="space-y-0.5">
                <p className="font-bold text-slate-950 underline underline-offset-4 decoration-1" style={{ fontSize: `${fontSizePt}pt` }}>
                  {advisor2}
                </p>
                <p className="text-xs text-slate-500 font-sans">NIP/NIDN. ........................................</p>
              </div>
            </div>
          </div>

          <div className="pt-6 pb-2 text-center space-y-14 border-t border-slate-200 mt-4">
            <p className="font-semibold text-slate-800" style={{ fontSize: `${fontSizePt}pt` }}>
              Mengetahui,<br />
              Ketua Program Studi {studyProgram}
            </p>
            <div className="space-y-0.5">
              <p className="font-bold text-slate-950 underline underline-offset-4 decoration-1" style={{ fontSize: `${fontSizePt}pt` }}>
                {headOfDepartment}
              </p>
              <p className="text-xs text-slate-500 font-sans">NIP/NIDN. ........................................</p>
            </div>
          </div>
        </div>
      );

    case 'approval_examiners':
      return (
        <div className="font-serif text-slate-900 flex flex-col justify-between h-full min-h-[820px] select-text">
          <div className="text-center space-y-1 pb-4 border-b border-slate-200">
            <h2
              className="font-bold uppercase tracking-wider text-slate-950 font-serif"
              style={{ fontSize: `${fontSizePt + 2}pt` }}
            >
              LEMBAR PENGESAHAN PENGUJI
            </h2>
            <p className="text-xs text-slate-600 font-sans">
              Dewan Penguji Sidang Ujian {degreeLabel}
            </p>
          </div>

          <div className="py-2 space-y-1 leading-relaxed" style={{ fontSize: `${fontSizePt}pt` }}>
            <div className="grid grid-cols-12 gap-2 py-0.5">
              <span className="col-span-4 font-bold text-slate-800">Judul {degreeLabel}</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 font-bold text-slate-950 uppercase">{title}</span>
            </div>
            <div className="grid grid-cols-12 gap-2 py-0.5">
              <span className="col-span-4 font-semibold text-slate-700">Nama Mahasiswa</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 text-slate-900">{studentName}</span>
            </div>
            <div className="grid grid-cols-12 gap-2 py-0.5">
              <span className="col-span-4 font-semibold text-slate-700">NIM</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 text-slate-900">{studentId}</span>
            </div>
            <div className="grid grid-cols-12 gap-2 py-0.5">
              <span className="col-span-4 font-semibold text-slate-700">Program Studi</span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 text-slate-900">{studyProgram}</span>
            </div>
          </div>

          <div className="py-2 text-justify leading-relaxed text-slate-800" style={{ fontSize: `${fontSizePt}pt` }}>
            <p className="indent-8">
              Naskah {degreeLabel} ini telah dipertahankan di hadapan Dewan Penguji dan dinyatakan <strong>LULUS</strong> pada Sidang Ujian {degreeLabel} pada hari ........................., tanggal ........................................ {year}.
            </p>
          </div>

          <div className="py-3">
            <p className="font-bold text-slate-900 mb-2 uppercase text-xs font-sans tracking-wide">
              TIM DEWAN PENGUJI:
            </p>
            <div className="border border-slate-300 rounded-sm overflow-hidden text-xs font-sans">
              <div className="grid grid-cols-12 bg-slate-100 font-bold p-2 border-b border-slate-300 text-slate-800">
                <span className="col-span-1 text-center">No</span>
                <span className="col-span-4">Jabatan</span>
                <span className="col-span-4">Nama Lengkap & Gelar</span>
                <span className="col-span-3 text-center">Tanda Tangan</span>
              </div>
              <div className="grid grid-cols-12 p-3 border-b border-slate-200 items-center">
                <span className="col-span-1 text-center font-bold">1.</span>
                <span className="col-span-4">Ketua Penguji</span>
                <span className="col-span-4">......................................................</span>
                <span className="col-span-3 text-center">( ................................ )</span>
              </div>
              <div className="grid grid-cols-12 p-3 border-b border-slate-200 items-center">
                <span className="col-span-1 text-center font-bold">2.</span>
                <span className="col-span-4">Anggota Penguji I</span>
                <span className="col-span-4">......................................................</span>
                <span className="col-span-3 text-center">( ................................ )</span>
              </div>
              <div className="grid grid-cols-12 p-3 items-center">
                <span className="col-span-1 text-center font-bold">3.</span>
                <span className="col-span-4">Anggota Penguji II</span>
                <span className="col-span-4">......................................................</span>
                <span className="col-span-3 text-center">( ................................ )</span>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-2 text-center space-y-14 border-t border-slate-200 mt-2">
            <p className="font-semibold text-slate-800" style={{ fontSize: `${fontSizePt}pt` }}>
              Mengesahkan,<br />
              Dekan {faculty}
            </p>
            <div className="space-y-0.5">
              <p className="font-bold text-slate-950 underline underline-offset-4 decoration-1" style={{ fontSize: `${fontSizePt}pt` }}>
                {deanName}
              </p>
              <p className="text-xs text-slate-500 font-sans">NIP/NIDN. ........................................</p>
            </div>
          </div>
        </div>
      );

    case 'statement':
      return (
        <div className="font-serif text-slate-900 flex flex-col justify-between h-full min-h-[750px] max-h-[896px] select-text">
          <div className="text-center space-y-0.5 pb-2 border-b border-slate-200">
            <h2
              className="font-bold uppercase tracking-wider text-slate-950 font-serif"
              style={{ fontSize: `${fontSizePt + 1}pt` }}
            >
              SURAT PERNYATAAN KEASLIAN KARYA ILMIAH
            </h2>
            <p className="text-[10px] text-slate-500 font-sans italic">
              Bebas Plagiarisme & Keaslian Naskah Akademik
            </p>
          </div>

          <div className="py-1 text-slate-800 space-y-1" style={{ fontSize: `${fontSizePt - 1}pt` }}>
            <p className="font-semibold text-slate-800">Yang bertanda tangan di bawah ini:</p>
            <div className="space-y-0.5 pl-3">
              <div className="grid grid-cols-12 gap-1 py-0.2">
                <span className="col-span-4 font-semibold text-slate-700">Nama Lengkap</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-bold text-slate-900 uppercase">{studentName}</span>
              </div>
              <div className="grid grid-cols-12 gap-1 py-0.2">
                <span className="col-span-4 font-semibold text-slate-700">NIM</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-bold text-slate-900">{studentId}</span>
              </div>
              <div className="grid grid-cols-12 gap-1 py-0.2">
                <span className="col-span-4 font-semibold text-slate-700">Program Studi</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-slate-900">{studyProgram}</span>
              </div>
              <div className="grid grid-cols-12 gap-1 py-0.2">
                <span className="col-span-4 font-semibold text-slate-700">Fakultas</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-slate-900">{faculty}</span>
              </div>
              <div className="grid grid-cols-12 gap-1 py-0.2">
                <span className="col-span-4 font-semibold text-slate-700">Perguruan Tinggi</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-slate-900">{institution}</span>
              </div>
            </div>
          </div>

          <div className="py-1 space-y-1 text-justify leading-snug text-slate-800" style={{ fontSize: `${fontSizePt - 1}pt` }}>
            <p>
              Dengan ini menyatakan dengan penuh kesadaran dan tanggung jawab bahwa {degreeLabel} yang berjudul:
            </p>
            <p className="font-bold text-center uppercase py-0.5 px-3 bg-slate-50 border border-slate-200 rounded text-slate-950 font-serif" style={{ fontSize: `${fontSizePt}pt` }}>
              "{title}"
            </p>
            <p className="indent-6">
              1. Adalah benar-benar hasil karya ilmiah mandiri saya sendiri, bukan merupakan tiruan, saduran, atau penjiplakan (plagiarisme) dari karya orang lain, serta belum pernah diajukan untuk memperoleh gelar akademik di perguruan tinggi mana pun.
            </p>
            <p className="indent-6">
              2. Semua sumber data, teori, gagasan, dan rujukan kutipan telah dicantumkan dalam teks naskah dan disebutkan dalam Daftar Pustaka sesuai kaidah serta etika penulisan karya ilmiah yang berlaku.
            </p>
            <p className="indent-6">
              3. Apabila di kemudian hari terbukti terdapat unsur plagiarisme atau manipulasi data, saya bersedia menerima sanksi akademik berupa pencabutan kelulusan dan gelar akademik yang telah diperoleh, serta sanksi hukum sesuai peraturan perundang-undangan.
            </p>
            <p className="indent-6">
              Demikian surat pernyataan ini saya buat dengan sebenar-benarnya dalam keadaan sehat jasmani dan rohani, tanpa paksaan dari pihak mana pun.
            </p>
          </div>

          <div className="pt-2 flex flex-col items-end">
            <div className="w-64 text-center space-y-1">
              <p className="text-slate-800" style={{ fontSize: `${fontSizePt - 1}pt` }}>
                {cityLocation}, .................................... {year}
              </p>
              <p className="font-semibold text-slate-900" style={{ fontSize: `${fontSizePt}pt` }}>
                Yang membuat pernyataan,
              </p>

              <div className="flex justify-center my-1.5">
                <div className="w-36 h-18 border-2 border-dashed border-amber-500/80 rounded bg-amber-50/50 flex flex-col items-center justify-center p-1 text-center shadow-2xs font-sans">
                  <span className="text-[9px] font-bold text-amber-900 tracking-wider">METERAI TEMPEL</span>
                  <span className="text-[11px] font-black text-amber-950">Rp 10.000</span>
                  <span className="text-[7.5px] text-amber-800 italic mt-0.5">(Tanda tangan basah menyentuh meterai)</span>
                </div>
              </div>

              <div className="pt-0.5 space-y-0.5">
                <p
                  className="font-bold text-slate-950 underline underline-offset-4 decoration-1 font-serif"
                  style={{ fontSize: `${fontSizePt}pt` }}
                >
                  {studentName}
                </p>
                <p className="text-xs text-slate-600 font-sans">
                  NIM. {studentId}
                </p>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}


export const A4PreliminarySheet: React.FC<A4PreliminarySheetProps> = memo(({
  sheet,
  sheetIndex,
  fontSizePt,
  lineSpacing,
  fontFamily,
  onOpenModal,
  onRemoveSheet,
}) => {


  return (
    <div
      className="bg-white text-slate-900 shadow-2xl rounded-xs relative border border-slate-300 transition-all flex flex-col justify-between"
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
      {/* SHEET BANNER / QUICK ACTIONS */}
      <div className="absolute top-4 left-[151px] right-[113px] flex items-center justify-between border-b border-slate-100 pb-2 select-none font-sans">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
          <Stamp className="w-3 h-3 text-sky-600" />
          {sheet.title}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenModal(sheet.type)}
            className="px-2.5 py-0.5 text-[10px] font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-sky-700 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Sesuaikan identitas lembar ini"
          >
            <Edit3 className="w-2.5 h-2.5 text-slate-500" />
            <span>Sesuaikan</span>
          </button>
          <button
            type="button"
            onClick={() => onRemoveSheet(sheet.type)}
            className="px-2.5 py-0.5 text-[10px] font-semibold rounded-md bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Hapus lembar ini dari naskah"
          >
            <X className="w-2.5 h-2.5 text-rose-500" />
            <span>Hapus</span>
          </button>
        </div>
      </div>

      {/* SHEET BODY */}
      <div className="flex-1 flex flex-col justify-between">
        {renderPreliminarySheetContent(sheet, fontSizePt, lineSpacing)}
      </div>

      {/* SHEET FOOTER */}
      <div className="absolute bottom-6 left-[151px] right-[113px] flex items-center justify-between text-[10pt] text-slate-400 border-t border-slate-200/80 pt-2 select-none font-sans">
        <span className="text-[9pt] text-slate-400">
          Format Kertas A4 (Margin 4-3-3-3 cm)
        </span>
        <span className="text-[9.5pt] font-semibold text-slate-600 font-serif">
          {sheet.type === 'cover' ? 'Sampul (Tanpa Nomor)' : `Halaman ${formatRomanPageNumber(sheetIndex + 1)}`}
        </span>
      </div>
    </div>
  );
});
