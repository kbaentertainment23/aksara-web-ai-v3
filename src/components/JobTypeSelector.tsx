import React from 'react';
import {
  Lightbulb,
  FileSpreadsheet,
  BookOpen,
  HelpCircle,
  Target,
  FileText,
  Library,
  Compass,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  FileSearch,
  RefreshCw,
  CheckSquare,
  ShieldCheck,
  ListChecks,
  Presentation,
  Layers,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { ACADEMIC_JOB_TYPES } from '../data/academicConstants.ts';

const ICON_COMPONENTS: Record<string, React.ElementType> = {
  Lightbulb,
  FileSpreadsheet,
  BookOpen,
  HelpCircle,
  Target,
  FileText,
  Library,
  Compass,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  FileSearch,
  RefreshCw,
  CheckSquare,
  ShieldCheck,
  ListChecks,
  Presentation,
  Layers,
};

interface JobTypeSelectorProps {
  selectedJobId: string;
  onSelectJob: (id: string) => void;
}

export const JobTypeSelector: React.FC<JobTypeSelectorProps> = ({
  selectedJobId,
  onSelectJob,
}) => {
  const activeJob =
    ACADEMIC_JOB_TYPES.find((j) => j.id === selectedJobId) || ACADEMIC_JOB_TYPES[0];
  const ActiveIcon = ICON_COMPONENTS[activeJob.icon] || FileText;

  // Grouped options for a super clear, organized dropdown experience
  const groups = [
    {
      groupName: '💡 Ide & Perencanaan Penelitian',
      items: ACADEMIC_JOB_TYPES.filter((j) => j.category === 'ide'),
    },
    {
      groupName: '📖 Bab Lengkap Skripsi / Tesis (Bab I – V)',
      items: ACADEMIC_JOB_TYPES.filter((j) => j.category === 'bab'),
    },
    {
      groupName: '✍️ Bagian / Elemen Penulisan Khusus',
      items: ACADEMIC_JOB_TYPES.filter((j) => j.category === 'elemen'),
    },
    {
      groupName: '📋 Instrumen Riset & Wawancara',
      items: ACADEMIC_JOB_TYPES.filter((j) => j.category === 'instrumen'),
    },
    {
      groupName: '🔍 Perbaikan, Parafrasa & Revisi Dosen',
      items: ACADEMIC_JOB_TYPES.filter((j) => j.category === 'revisi'),
    },
    {
      groupName: '🎓 Persiapan Seminar & Sidang Ujian',
      items: ACADEMIC_JOB_TYPES.filter((j) => j.category === 'sidang'),
    },
    {
      groupName: '⚡ Kustom & Lainnya',
      items: ACADEMIC_JOB_TYPES.filter((j) => j.category === 'lainnya'),
    },
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
      {/* Header Label */}
      <div>
        <label
          htmlFor="academic-job-dropdown"
          className="block text-sm font-bold text-[#1E3A5F] mb-1 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <span>Jenis Pekerjaan Akademik</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200">
              Pilih dari Menu
            </span>
          </span>
          <span className="text-xs font-normal text-slate-500 hidden sm:inline">
            19 Tugas Tersedia
          </span>
        </label>
        <p className="text-xs text-slate-500">
          Pilih tugas atau bab yang ingin Anda buat. Formulir di bawah akan otomatis menyesuaikan diri.
        </p>
      </div>

      {/* Clean, Full-width Dropdown */}
      <div className="relative">
        <select
          id="academic-job-dropdown"
          value={selectedJobId}
          onChange={(e) => onSelectJob(e.target.value)}
          className="w-full appearance-none pl-4 pr-10 py-3 text-sm font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-200 hover:border-[#38BDF8] rounded-xl focus:outline-none focus:ring-3 focus:ring-[#38BDF8]/20 focus:border-[#38BDF8] transition-all cursor-pointer shadow-2xs"
        >
          {groups.map((group) => (
            <optgroup key={group.groupName} label={group.groupName} className="font-bold text-[#1E3A5F]">
              {group.items.map((job) => (
                <option
                  key={job.id}
                  value={job.id}
                  className="font-normal text-slate-800 py-1"
                >
                  {job.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500">
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      {/* Helpful & Friendly Explanation Card for Beginners */}
      <div className="p-3.5 rounded-xl bg-[#F0F9FF] border border-sky-200/80 flex items-start gap-3 transition-all animate-in fade-in duration-150">
        <div className="w-9 h-9 rounded-xl bg-[#38BDF8] text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <ActiveIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-[#1E3A5F] truncate">
              {activeJob.label}
            </h4>
            {activeJob.badge && (
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white text-[#0284C7] border border-sky-200 shadow-2xs">
                {activeJob.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {activeJob.description}
          </p>
          <div className="mt-2 text-[11px] text-sky-800 font-medium flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>
              {activeJob.id === 'title_ideas'
                ? 'Panduan: Masukkan bidang minat atau masalah awal Anda, lalu tentukan preferensi judul di bawah.'
                : activeJob.id === 'supervisor_revision'
                ? 'Panduan: Masukkan catatan coretan dari dosen pembimbing Anda agar AI membedah dan memperbaikinya.'
                : activeJob.id === 'bab_1' || activeJob.id === 'bab_2' || activeJob.id === 'bab_3'
                ? 'Panduan: Anda dapat melihat kerangka bab terlebih dahulu atau langsung generate naskah lengkap.'
                : 'Panduan: Lengkapi informasi penelitian yang relevan di bawah, kemudian tekan tombol Generate.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
