import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  BookMarked,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileCheck,
  AlertCircle,
  Lightbulb,
  Upload,
  HelpCircle,
  Sparkles,
  Info,
  CheckCircle,
  Wand2,
  Search,
  Check,
  X,
  Layers,
  Filter,
  User,
} from 'lucide-react';
import {
  DEGREE_LEVELS,
  STUDY_PROGRAM_CATEGORIES,
  RESEARCH_METHODS,
  CITATION_STYLES,
  WRITING_STYLES,
  CHAPTER_STRUCTURE_OPTIONS,
  CHAPTER_GUIDELINES_CHECKLIST,
  ACADEMIC_RESEARCH_PRESETS,
  ResearchPreset,
  STRUCTURED_STUDY_PROGRAMS_BY_FIELD,
  ALL_STRUCTURED_STUDY_PROGRAMS,
  searchStudyPrograms,
  StudyProgramItem,
} from '../data/academicConstants.ts';
import { AcademicFormData, recommendMethodologyHeuristics } from '../utils/academicRules.ts';

interface AcademicFormProps {
  formData: AcademicFormData;
  onChange: (data: Partial<AcademicFormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGenerateOutline: () => void;
  isLoading: boolean;
  validationErrors: Record<string, string>;
  warnings: string[];
}

export const AcademicForm: React.FC<AcademicFormProps> = ({
  formData,
  onChange,
  onSubmit,
  onGenerateOutline,
  isLoading,
  validationErrors,
  warnings,
}) => {
  // Collapsible accordion states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showGuidelinesSection, setShowGuidelinesSection] = useState(false);
  const [showStudentProfileSection, setShowStudentProfileSection] = useState(
    Boolean(formData.studentName || formData.studentId || formData.institutionName)
  );
  const [isCustomProdi, setIsCustomProdi] = useState(
    formData.studyProgramCategory === 'Lainnya' || Boolean(formData.facultyName)
  );
  const [prodiSearch, setProdiSearch] = useState('');

  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  // Sync selectedPresetId if form was cleared
  useEffect(() => {
    if (!formData.topic && !formData.studyProgramName && selectedPresetId) {
      setSelectedPresetId('');
    }
  }, [formData.topic, formData.studyProgramName, selectedPresetId]);

  // Handler for quick academic presets across D3, D4, S1, S2
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) {
      // Return to clean empty state
      onChange({
        degreeLevel: '',
        studyProgramCategory: '',
        studyProgramName: '',
        facultyName: '',
        fieldOfStudy: '',
        topic: '',
        tentativeTitle: '',
        backgroundProblem: '',
        identifiedProblem: '',
        researchSubject: '',
        researchLocation: '',
        populationSample: '',
        variables: '',
        methodologyApproach: 'belum_ditentukan',
        coreTheories: '',
        researchObjectives: '',
        writingStyle: 'formal',
        citationStyle: 'APA 7th Edition',
        academicComplexity: 'menengah',
      });
      return;
    }

    const preset = ACADEMIC_RESEARCH_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onChange({
        degreeLevel: preset.degreeLevel,
        studyProgramCategory: preset.studyProgramCategory,
        studyProgramName: preset.studyProgramName,
        facultyName: preset.facultyName,
        topic: preset.topic,
        tentativeTitle: preset.tentativeTitle,
        backgroundProblem: preset.backgroundProblem,
        identifiedProblem: preset.identifiedProblem,
        researchSubject: preset.researchSubject,
        researchLocation: preset.researchLocation,
        populationSample: preset.populationSample || '',
        variables: preset.variables,
        methodologyApproach: preset.methodologyApproach,
        coreTheories: preset.coreTheories,
        researchObjectives: preset.researchObjectives,
        writingStyle: preset.writingStyle,
        citationStyle: preset.citationStyle,
        academicComplexity: preset.academicComplexity,
      });
    }
  };

  const currentDegreeObj = DEGREE_LEVELS.find((d) => d.id === formData.degreeLevel);
  const recommendation = recommendMethodologyHeuristics(formData);

  // Searchable categorized prodi dropdown states
  const [prodiSearchQuery, setProdiSearchQuery] = useState('');
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('all');
  const [isProdiDropdownOpen, setIsProdiDropdownOpen] = useState(false);
  const prodiDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (prodiDropdownRef.current && !prodiDropdownRef.current.contains(event.target as Node)) {
        setIsProdiDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered study programs based on search query, current degreeLevel, and field filter
  const filteredPrograms = searchStudyPrograms(
    prodiSearchQuery,
    formData.degreeLevel,
    selectedFieldFilter
  );

  // Group filtered programs by field
  const groupedFilteredPrograms = STRUCTURED_STUDY_PROGRAMS_BY_FIELD.map((group) => {
    const matchingInGroup = filteredPrograms.filter((p) => p.fieldId === group.fieldId);
    return {
      ...group,
      programs: matchingInGroup,
    };
  }).filter((group) => group.programs.length > 0);

  // Select study program handler
  const handleSelectStudyProgram = (prog: StudyProgramItem) => {
    // If current degreeLevel is not set or not supported, select a supported degree
    let targetDegree = formData.degreeLevel;
    if (
      !targetDegree ||
      (targetDegree !== 'Lainnya' && targetDegree !== 'S3' && !prog.degreeLevels.includes(targetDegree as any))
    ) {
      targetDegree = prog.degreeLevels.includes('S1') ? 'S1' : prog.degreeLevels[0];
    }

    onChange({
      studyProgramName: prog.name,
      studyProgramCategory: prog.category,
      facultyName: formData.facultyName ? formData.facultyName : prog.defaultFaculty,
      degreeLevel: targetDegree,
    });
    setProdiSearchQuery('');
    setIsProdiDropdownOpen(false);
  };

  const handleClearStudyProgram = () => {
    onChange({
      studyProgramName: '',
    });
    setProdiSearchQuery('');
  };

  // File upload simulation/parsing for campus guideline
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onChange({
          uploadedGuidelineName: file.name,
          uploadedGuidelineText: text ? text.substring(0, 4000) : `Dokumen pedoman terunggah: ${file.name}`,
          guidelineType: 'uploaded',
        });
      };
      reader.readAsText(file);
    }
  };

  const isTitleJob = formData.jobType === 'title_ideas';
  const isRevisionJob = formData.jobType === 'supervisor_revision';

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Quick Preset Dropdown Bar (D3, D4, S1, S2) - OPSIONAL / HANYA CONTOH */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50/70 via-sky-50/40 to-slate-50 border-2 border-dashed border-amber-300/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-2xs">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Coba Contoh Data Riset (Simulasi Pengisian)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  Opsional • Bukan Wajib
                </span>
              </div>
            </div>
          </div>
          <span className="text-[11px] font-medium text-amber-800/90 bg-amber-100/70 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            💡 Lewati bagian ini jika ingin isi naskah sendiri
          </span>
        </div>

        <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
          Kotak ini <strong>tidak wajib diisi</strong>. Fitur ini hanya disediakan sebagai <em>template contoh</em> apabila Anda ingin mencoba alur dan tampilan sistem secara instan. Jika Anda ingin menyusun penelitian Anda sendiri, silakan <strong>abaikan kotak ini</strong> dan langsung mulai mengisi dari <strong>Bagian 1 (Jenjang & Program Studi)</strong> di bawah.
        </p>

        <div className="relative">
          <select
            id="academic-preset-select"
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="w-full py-2.5 pl-3.5 pr-10 text-xs sm:text-sm font-medium rounded-xl border border-amber-300/90 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
          >
            <option value="">-- Lewati (Atau Pilih Contoh Jurusan untuk Uji Coba Cepat) --</option>
            {(['D3', 'D4', 'S1', 'S2'] as const).map((deg) => {
              const presetsInDeg = ACADEMIC_RESEARCH_PRESETS.filter((p) => p.degreeLevel === deg);
              if (presetsInDeg.length === 0) return null;
              const groupTitle =
                deg === 'D3'
                  ? '─── D3 (Ahli Madya / Vokasi Operasional & Terapan) ───'
                  : deg === 'D4'
                  ? '─── D4 (Sarjana Terapan / Rekayasa Terapan & Industri) ───'
                  : deg === 'S1'
                  ? '─── S1 (Sarjana Akademik / Pengujian Empiris & Teori) ───'
                  : '─── S2 (Magister / Tesis, Novelty & Sintesis Gap) ───';
              return (
                <optgroup key={deg} label={groupTitle} className="font-bold text-slate-800 bg-slate-100">
                  {presetsInDeg.map((p) => (
                    <option key={p.id} value={p.id} className="font-normal text-slate-700 bg-white py-1">
                      Contoh {deg}: {p.label}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        {!selectedPresetId ? (
          <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white/90 px-3 py-2 rounded-xl border border-amber-200/60">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Status: <strong>Mengisi Data Sendiri</strong>. Formulir di bawah dalam kondisi kosong dan siap Anda isi sesuai topik Anda.
            </span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs animate-in fade-in duration-150">
            {(() => {
              const active = ACADEMIC_RESEARCH_PRESETS.find((p) => p.id === selectedPresetId);
              if (!active) return null;
              return (
                <>
                  <div className="flex items-start sm:items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 uppercase tracking-wide">
                      Contoh Aktif ({active.degreeLevel})
                    </span>
                    <span className="font-semibold text-slate-900 shrink-0">
                      {active.studyProgramName}:
                    </span>
                    <span className="text-slate-700 truncate text-[11px] sm:text-xs">
                      {active.tentativeTitle}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 self-end sm:self-auto shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Hapus Contoh & Mulai Dari Awal</span>
                  </button>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* SECTION 1: JENJANG PENDIDIKAN & PROGRAM STUDI */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F]">
                Jenjang Pendidikan & Program Studi
              </h3>
              <p className="text-xs text-slate-500">
                Menentukan kedalaman analisis, kompleksitas teori, dan peristilahan disiplin ilmu.
              </p>
            </div>
          </div>
          {currentDegreeObj && (
            <span className="hidden sm:inline-flex text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F0F9FF] text-[#0284C7] border border-sky-200">
              {currentDegreeObj.depth}
            </span>
          )}
        </div>

        {/* 1A. JENJANG PENDIDIKAN (D3, D4, S1, S2, + S3/Lainnya) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700">
              Jenjang Pendidikan <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Pilih jenjang untuk menyelaraskan standar akademik & bobot analisis
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'D3', label: 'D3 – Ahli Madya', role: 'Vokasi Operasional', desc: 'Laporan Tugas Akhir / Prosedur Terapan' },
              { id: 'D4', label: 'D4 – Sarjana Terapan', role: 'Rekayasa Terapan', desc: 'Produk Inovatif / Implementasi Industri' },
              { id: 'S1', label: 'S1 – Sarjana', role: 'Akademik Empiris', desc: 'Skripsi / Pengujian Hipotesis & Teori' },
              { id: 'S2', label: 'S2 – Magister', role: 'Sintesis Teoretis', desc: 'Tesis / Novelty & Analisis Research Gap' },
            ].map((deg) => {
              const isSelected = formData.degreeLevel === deg.id;
              return (
                <button
                  key={deg.id}
                  type="button"
                  onClick={() => onChange({ degreeLevel: deg.id })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-400/40 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-sky-800' : 'text-slate-800'}`}>
                      {deg.id}
                    </span>
                    {isSelected ? (
                      <span className="p-0.5 rounded-full bg-sky-500 text-white">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">{deg.role}</span>
                    )}
                  </div>
                  <div className={`text-xs font-semibold mt-1 ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                    {deg.label.split('–')[1]?.trim() || deg.label}
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {deg.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Opsi Jenjang Lainnya (S3 / Spesialis) */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Pilihan jenjang lanjutan:</span>
              <select
                value={['D3', 'D4', 'S1', 'S2'].includes(formData.degreeLevel) ? '' : formData.degreeLevel}
                onChange={(e) => {
                  if (e.target.value) {
                    onChange({ degreeLevel: e.target.value });
                  }
                }}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="">-- Pilih S3 atau Program Profesi --</option>
                <option value="S3">S3 – Disertasi (Orisinalitas & Grand Theory)</option>
                <option value="Lainnya">Lainnya (Program Profesi / Spesialis)</option>
              </select>
            </div>
            {validationErrors.degreeLevel && (
              <p className="text-xs text-rose-500">{validationErrors.degreeLevel}</p>
            )}
          </div>

          {formData.degreeLevel === 'Lainnya' && (
            <input
              type="text"
              placeholder="Tuliskan jenjang spesifik Anda (misal: Program Profesi Apoteker / Spesialis Medis)"
              value={formData.customDegree || ''}
              onChange={(e) => onChange({ customDegree: e.target.value })}
              className="mt-2 w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-400"
            />
          )}
        </div>

        {/* 1B. SEARCHABLE CATEGORIZED STUDY PROGRAM DROPDOWN */}
        <div ref={prodiDropdownRef} className="relative space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Program Studi & Rumpun Keilmuan <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Dikelompokkan menurut bidang (Engineering, Health, Social Sciences, IT, Law, dll)
            </span>
          </div>

          {/* Trigger button / search display */}
          <div
            onClick={() => setIsProdiDropdownOpen(!isProdiDropdownOpen)}
            className={`w-full p-3 rounded-xl border bg-white cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs hover:border-slate-400 ${
              validationErrors.studyProgramCategory || validationErrors.studyProgramName
                ? 'border-rose-400 bg-rose-50/20'
                : isProdiDropdownOpen
                ? 'border-sky-500 ring-2 ring-sky-400/30'
                : 'border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              {formData.studyProgramName ? (
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {formData.studyProgramName}
                    </span>
                    {formData.studyProgramCategory && (
                      <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-semibold">
                        {formData.studyProgramCategory}
                      </span>
                    )}
                    {formData.facultyName && (
                      <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
                        • {formData.facultyName}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-xs sm:text-sm text-slate-400">
                  -- Klik untuk mencari Program Studi (misal: Teknik Sipil, Informatika, Manajemen, Hukum, Keperawatan) --
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {formData.studyProgramName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearStudyProgram();
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Kosongkan pilihan prodi"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isProdiDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* Validation error msg */}
          {(validationErrors.studyProgramCategory || validationErrors.studyProgramName) && (
            <p className="mt-1 text-xs text-rose-500">
              {validationErrors.studyProgramCategory || validationErrors.studyProgramName}
            </p>
          )}

          {/* DROPDOWN POPUP MENU */}
          {isProdiDropdownOpen && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Search Bar & Category Filter Pills */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={prodiSearchQuery}
                    onChange={(e) => setProdiSearchQuery(e.target.value)}
                    placeholder="Cari program studi, kata kunci (misal: mesin, perawat, iot, sdm), atau bidang ilmu..."
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    autoFocus
                  />
                  {prodiSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProdiSearchQuery('')}
                      className="absolute right-2.5 top-2.5 p-0.5 rounded-md text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Field Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setSelectedFieldFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors cursor-pointer ${
                      selectedFieldFilter === 'all'
                        ? 'bg-[#1E3A5F] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Semua Rumpun ({ALL_STRUCTURED_STUDY_PROGRAMS.length})
                  </button>
                  {STRUCTURED_STUDY_PROGRAMS_BY_FIELD.map((g) => {
                    const isSelected = selectedFieldFilter === g.fieldId;
                    return (
                      <button
                        key={g.fieldId}
                        type="button"
                        onClick={() => setSelectedFieldFilter(g.fieldId)}
                        className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {g.fieldName}
                      </button>
                    );
                  })}
                </div>

                {/* Filter Status Bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3 h-3 text-sky-600" />
                    <span>
                      Filter jenjang aktif:{' '}
                      <strong className="text-slate-800">
                        {formData.degreeLevel ? formData.degreeLevel : 'Semua Jenjang'}
                      </strong>
                    </span>
                  </div>
                  {formData.degreeLevel && (
                    <button
                      type="button"
                      onClick={() => onChange({ degreeLevel: '' })}
                      className="text-sky-600 hover:underline cursor-pointer"
                    >
                      Tampilkan semua jenjang
                    </button>
                  )}
                </div>
              </div>

              {/* Grouped Programs List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
                {groupedFilteredPrograms.length > 0 ? (
                  groupedFilteredPrograms.map((group) => (
                    <div key={group.fieldId} className="py-2">
                      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/80 rounded-md flex items-center justify-between mb-1">
                        <span>
                          {group.fieldName} • {group.fieldEnglish}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {group.programs.length} prodi
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {group.programs.map((prog) => {
                          const isCurrent = formData.studyProgramName === prog.name;
                          return (
                            <button
                              key={prog.id}
                              type="button"
                              onClick={() => handleSelectStudyProgram(prog)}
                              className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-sky-50 text-sky-900 font-semibold'
                                  : 'hover:bg-slate-100/80 text-slate-700'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-medium text-slate-800">
                                    {prog.name}
                                  </span>
                                  {isCurrent && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                  <span>{prog.defaultFaculty}</span>
                                  <span>•</span>
                                  <span>{prog.category}</span>
                                </div>
                              </div>

                              {/* Available Degree Levels Badge */}
                              <div className="flex items-center gap-1 shrink-0">
                                {(['D3', 'D4', 'S1', 'S2'] as const).map((lvl) => {
                                  const supports = prog.degreeLevels.includes(lvl);
                                  const isCurrentLevel = formData.degreeLevel === lvl;
                                  if (!supports) return null;
                                  return (
                                    <span
                                      key={lvl}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        isCurrentLevel
                                          ? 'bg-sky-500 text-white shadow-2xs'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      {lvl}
                                    </span>
                                  );
                                })}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      Tidak ditemukan program studi standar untuk &ldquo;{prodiSearchQuery}&rdquo;.
                    </p>
                    {prodiSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          onChange({
                            studyProgramName: prodiSearchQuery,
                            studyProgramCategory: 'Lainnya',
                          });
                          setIsCustomProdi(true);
                          setIsProdiDropdownOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        Gunakan &ldquo;{prodiSearchQuery}&rdquo; sebagai Program Studi Khusus
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                <button
                  type="button"
                  onClick={() => setIsProdiDropdownOpen(false)}
                  className="text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
                >
                  Tutup Pilihan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Custom Prodi toggle */}
        <div className="pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={isCustomProdi}
              onChange={(e) => setIsCustomProdi(e.target.checked)}
              className="rounded text-[#38BDF8] focus:ring-[#38BDF8] w-4 h-4 border-slate-300"
            />
            <span>Program studi tidak ada? Isi nama prodi, fakultas, atau bidang ilmu secara manual</span>
          </label>

          {isCustomProdi && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Program Studi Spesifik
                </label>
                <input
                  type="text"
                  placeholder="Contoh: S1 Teknik Informatika"
                  value={formData.studyProgramName || ''}
                  onChange={(e) => onChange({ studyProgramName: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Fakultas (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Fakultas Teknik"
                  value={formData.facultyName || ''}
                  onChange={(e) => onChange({ facultyName: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Konsentrasi / Peminatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Artificial Intelligence"
                  value={formData.fieldOfStudy || ''}
                  onChange={(e) => onChange({ fieldOfStudy: e.target.value })}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: INFORMASI PENELITIAN */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F]">
                Informasi & Substansi Penelitian
              </h3>
              <p className="text-xs text-slate-500">
                Isi informasi yang relevan dengan pekerjaan Anda. Kolom yang belum dimiliki bersifat opsional.
              </p>
            </div>
          </div>
        </div>

        {/* Chapter Guidelines Checklist Indicator */}
        {formData.jobType.startsWith('bab_') && CHAPTER_GUIDELINES_CHECKLIST[formData.jobType] && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50/60 border border-sky-200 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1E3A5F]">
                  Pedoman Baku: {CHAPTER_GUIDELINES_CHECKLIST[formData.jobType].romanNumeral} – {CHAPTER_GUIDELINES_CHECKLIST[formData.jobType].chapterTitle}
                </span>
                <span className="text-[10px] font-semibold bg-sky-200/80 text-sky-900 px-2 py-0.5 rounded-full">
                  Standar Dikti
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {CHAPTER_GUIDELINES_CHECKLIST[formData.jobType].requiredSections.length} Komponen Standar
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {CHAPTER_GUIDELINES_CHECKLIST[formData.jobType].generalDescription}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CHAPTER_GUIDELINES_CHECKLIST[formData.jobType].requiredSections.map((sec) => (
                <span
                  key={sec.id}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs"
                  title={sec.guidanceTip}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${sec.importance === 'wajib' ? 'bg-rose-500' : 'bg-sky-500'}`} />
                  <span>{sec.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Topic (Mandatory) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Topik atau Bidang Penelitian <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: Penerapan model hybrid machine learning untuk klasifikasi citra medis"
            value={formData.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
            className={`w-full p-2.5 text-xs sm:text-sm rounded-lg border bg-white focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent ${
              validationErrors.topic ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
            }`}
          />
          {validationErrors.topic && (
            <p className="mt-1 text-xs text-rose-500">{validationErrors.topic}</p>
          )}
        </div>

        {/* Tentative Title (Optional) */}
        {!isTitleJob && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Judul Sementara <span className="text-slate-400 font-normal">(Jika sudah ada)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Analisis Kinerja Model CNN dalam Mendeteksi Diabetic Retinopathy"
              value={formData.tentativeTitle || ''}
              onChange={(e) => onChange({ tentativeTitle: e.target.value })}
              className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
        )}

        {/* Background / Problem Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Latar Belakang & Gejala Masalah</span>
              <span className="text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded font-medium">Das Sollen & Das Sein</span>
            </label>
            <textarea
              rows={3}
              placeholder="Pilar 1 & 2: Ceritakan kondisi ideal menurut teori/regulasi (Das Sollen), lalu paparkan kesenjangan riil, fakta lapangan, atau data awal di lokus penelitian (Das Sein)..."
              value={formData.backgroundProblem || ''}
              onChange={(e) => onChange({ backgroundProblem: e.target.value })}
              className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Celah Penelitian & Solusi Ilmiah</span>
              <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-medium">Research Gap & Solusi</span>
            </label>
            <textarea
              rows={3}
              placeholder="Pilar 3 & 4: Masalah apa yang secara nyata terjadi? Apa celah penelitian (empirical / theoretical gap) yang belum terjawab tuntas oleh studi terdahulu?"
              value={formData.identifiedProblem || ''}
              onChange={(e) => onChange({ identifiedProblem: e.target.value })}
              className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
        </div>

        {/* Subject, Location, Population, Variables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Objek / Subjek Penelitian
            </label>
            <input
              type="text"
              placeholder="Misal: Mahasiswa Tingkat Akhir"
              value={formData.researchSubject || ''}
              onChange={(e) => onChange({ researchSubject: e.target.value })}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Lokasi Penelitian
            </label>
            <input
              type="text"
              placeholder="Misal: Kota Bandung / PT XYZ"
              value={formData.researchLocation || ''}
              onChange={(e) => onChange({ researchLocation: e.target.value })}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Populasi & Sampel
            </label>
            <input
              type="text"
              placeholder="Misal: 120 Responden (Slovin)"
              value={formData.populationSample || ''}
              onChange={(e) => onChange({ populationSample: e.target.value })}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Variabel / Fokus Kajian
            </label>
            <input
              type="text"
              placeholder="Misal: Variabel X, Y, Z"
              value={formData.variables || ''}
              onChange={(e) => onChange({ variables: e.target.value })}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Theories, Objectives, References */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Teori atau Konsep Utama
            </label>
            <input
              type="text"
              placeholder="Misal: Technology Acceptance Model (TAM)"
              value={formData.coreTheories || ''}
              onChange={(e) => onChange({ coreTheories: e.target.value })}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Tujuan Penelitian
            </label>
            <input
              type="text"
              placeholder="Misal: Menguji pengaruh X terhadap Y"
              value={formData.researchObjectives || ''}
              onChange={(e) => onChange({ researchObjectives: e.target.value })}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Referensi Awal (DOI / Judul Jurnal)
            </label>
            <input
              type="text"
              placeholder="Misal: Smith (2023), Jurnal Sinta 2"
              value={formData.initialReferences || ''}
              onChange={(e) => onChange({ initialReferences: e.target.value })}
              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: PENDEKATAN & METODE PENELITIAN */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F]">
                Pendekatan & Metode Penelitian
              </h3>
              <p className="text-xs text-slate-500">
                Pilih metode riset Anda atau minta rekomendasi otomatis berdasarkan masalah & objek.
              </p>
            </div>
          </div>
        </div>

        {/* Methodology Educational Note */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-800">Catatan Metodologis:</span> Pilihan metode tidak seluruhnya berada pada tingkatan yang sama. <em>Kuantitatif & Kualitatif</em> adalah <strong>paradigma/pendekatan</strong>; <em>Eksperimen, Studi Kasus, & R&D</em> adalah <strong>desain penelitian</strong>; sedangkan <em>Korelasional & Komparatif</em> adalah <strong>sifat analisis</strong>. AI akan mengintegrasikan ketiga tingkatan ini ke dalam naskah metodologi Anda.
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Pilihan Pendekatan / Metode
          </label>
          <select
            value={formData.methodologyApproach}
            onChange={(e) => onChange({ methodologyApproach: e.target.value })}
            className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#38BDF8]"
          >
            {RESEARCH_METHODS.map((method) => (
              <option key={method.id} value={method.id}>
                {method.label} ({method.category})
              </option>
            ))}
          </select>
        </div>

        {/* Recommendation card when "belum_ditentukan" is chosen */}
        {formData.methodologyApproach === 'belum_ditentukan' && (
          <div className="p-4 rounded-xl bg-[#F0F9FF] border border-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7]">
                <Wand2 className="w-4 h-4 text-sky-500" /> Rekomendasi Metode Dari Analisis AI
              </span>
              <button
                type="button"
                onClick={() => {
                  const targetMethod = recommendation.suggestedApproaches[0];
                  const found = RESEARCH_METHODS.find((m) =>
                    m.label.toLowerCase().includes(targetMethod.toLowerCase())
                  );
                  onChange({
                    methodologyApproach: found ? found.id : 'kuantitatif',
                  });
                }}
                className="text-xs px-2.5 py-1 rounded-md bg-[#38BDF8] text-white hover:bg-sky-500 font-semibold shadow-xs"
              >
                Gunakan Rekomendasi Ini
              </button>
            </div>
            <p className="text-sm font-bold text-[#1E3A5F]">
              {recommendation.recommendedMethod}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {recommendation.rationale}
            </p>
          </div>
        )}
      </div>

      {/* SECTION 4 (CONDITIONAL): PREFERENSI KHUSUS JUDUL (When jobType === 'title_ideas') */}
      {isTitleJob && (
        <div className="bg-white p-5 rounded-2xl border border-sky-300 ring-2 ring-sky-100 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F]">
                Preferensi Pencarian Judul Penelitian
              </h3>
              <p className="text-xs text-slate-500">
                Kustomisasi jumlah alternatif judul, gaya, panjang, dan tingkat kebaruan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Alternatif Judul
              </label>
              <div className="flex items-center gap-2">
                {[5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => onChange({ titleCount: cnt })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      (formData.titleCount || 10) === cnt
                        ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cnt} Judul
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Panjang Judul
              </label>
              <select
                value={formData.titleLength || 'sedang'}
                onChange={(e) => onChange({ titleLength: e.target.value as any })}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="ringkas">Ringkas (8–12 Kata)</option>
                <option value="sedang">Sedang (12–16 Kata - Standar)</option>
                <option value="deskriptif">Deskriptif & Rinci (16–20 Kata)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gaya Judul
              </label>
              <select
                value={formData.titleStyle || 'Akademik formal'}
                onChange={(e) => onChange({ titleStyle: e.target.value })}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="Langsung dan spesifik">Langsung dan Spesifik</option>
                <option value="Akademik formal">Akademik Formal</option>
                <option value="Berorientasi masalah">Berorientasi Masalah</option>
                <option value="Berorientasi solusi">Berorientasi Solusi</option>
                <option value="Terapan">Terapan / Rekayasa Industri</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Kebaruan (Novelty)
              </label>
              <select
                value={formData.titleNovelty || 'pengembangan penelitian sebelumnya'}
                onChange={(e) => onChange({ titleNovelty: e.target.value })}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="dasar">Dasar (Penerapan metode umum pada objek baru)</option>
                <option value="pengembangan penelitian sebelumnya">Pengembangan Penelitian Sebelumnya (Replikasi Teruji)</option>
                <option value="eksplorasi celah penelitian">Eksplorasi Celah Penelitian Baru (High Gap/Novelty)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata atau Batasan yang Dihindari (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Hindari kata 'studi kasus', hindari metode waterfall"
                value={formData.avoidWords || ''}
                onChange={(e) => onChange({ avoidWords: e.target.value })}
                className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5 (CONDITIONAL): CATATAN REVISI DOSEN (When jobType === 'supervisor_revision') */}
      {isRevisionJob && (
        <div className="bg-white p-5 rounded-2xl border border-purple-300 ring-2 ring-purple-100 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F]">
                Analisis & Perbaikan Revisi Dosen Pembimbing
              </h3>
              <p className="text-xs text-slate-500">
                Tempelkan catatan dosen agar AI membedah poin keberatan dan merumuskan naskah perbaikan yang tepat.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Coretan Dosen Pembimbing <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Contoh: 'Latar belakang terlalu umum! Mana data dukung angka stunting tahun 2023? Kaitkan rumusan masalah dengan teori Health Belief Model. Perbaiki teknik sampling!'"
              value={formData.supervisorComments || ''}
              onChange={(e) => onChange({ supervisorComments: e.target.value })}
              className={`w-full p-2.5 text-xs sm:text-sm rounded-lg border bg-white focus:ring-2 focus:ring-purple-400 ${
                validationErrors.supervisorComments ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
              }`}
            />
            {validationErrors.supervisorComments && (
              <p className="mt-1 text-xs text-rose-500">{validationErrors.supervisorComments}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Draf Naskah Sebelumnya yang Ingin Diperbaiki
            </label>
            <textarea
              rows={4}
              placeholder="Tempelkan paragraf atau bab Anda yang terkena revisi di sini..."
              value={formData.currentDraft || ''}
              onChange={(e) => onChange({ currentDraft: e.target.value })}
              className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>
      )}

      {/* SECTION 6: PENGATURAN LANJUTAN (ACCORDION) */}
      <div className="space-y-3">
        {/* Accordion 0: Identitas Mahasiswa & Kampus (Untuk Sampul & Pengesahan Dokumen Word) */}
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowStudentProfileSection(!showStudentProfileSection)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-sky-600" />
              <div>
                <span className="text-sm font-bold text-[#1E3A5F]">
                  Identitas Mahasiswa & Kampus
                </span>
                <span className="ml-2 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Opsional untuk Halaman Sampul & Pengesahan Word
                </span>
              </div>
            </div>
            {showStudentProfileSection ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showStudentProfileSection && (
            <div className="p-4 pt-1 border-t border-slate-100 space-y-3.5">
              <p className="text-[11px] text-slate-500">
                Data ini otomatis dimasukkan ke format halaman sampul resmi, lembar persetujuan pembimbing, dan ekspor file Microsoft Word (.docx).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Mahasiswa</label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={formData.studentName || ''}
                    onChange={(e) => onChange({ studentName: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIM / Nomor Pokok Mahasiswa</label>
                  <input
                    type="text"
                    placeholder="Contoh: 202401001"
                    value={formData.studentId || ''}
                    onChange={(e) => onChange({ studentId: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Perguruan Tinggi / Universitas</label>
                  <input
                    type="text"
                    placeholder="Contoh: Universitas Indonesia"
                    value={formData.institutionName || ''}
                    onChange={(e) => onChange({ institutionName: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosen Pembimbing I (beserta Gelar)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Dr. Ir. Ahmad Fauzi, M.Kom."
                    value={formData.advisor1 || ''}
                    onChange={(e) => onChange({ advisor1: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosen Pembimbing II (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Siti Rahma, S.T., M.T."
                    value={formData.advisor2 || ''}
                    onChange={(e) => onChange({ advisor2: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 1: Format Dokumen, Pedoman Kampus & Sitasi */}
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowGuidelinesSection(!showGuidelinesSection)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-bold text-[#1E3A5F]">
                Format Dokumen, Pedoman Kampus & Gaya Sitasi
              </span>
            </div>
            {showGuidelinesSection ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showGuidelinesSection && (
            <div className="p-4 pt-1 border-t border-slate-100 space-y-4">
              {/* Output format */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Format Dokumen Keluaran
                  </label>
                  <select
                    value={formData.outputFormat}
                    onChange={(e) => onChange({ outputFormat: e.target.value as any })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="docx">DOCX – Dokumen Microsoft Word (Unduh Otomatis)</option>
                    <option value="text">Teks Terstruktur untuk Disalin Langsung</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pedoman Penulisan Kampus
                  </label>
                  <select
                    value={formData.guidelineType}
                    onChange={(e) => onChange({ guidelineType: e.target.value as any })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="general">Pedoman Umum Karya Ilmiah Standar</option>
                    <option value="uploaded">Pedoman Kampus dari Unggah Dokumen</option>
                    <option value="manual">Pedoman Manual (Margin & Aturan Khusus)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gaya Sitasi & Referensi
                  </label>
                  <select
                    value={formData.citationStyle}
                    onChange={(e) => onChange({ citationStyle: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    {CITATION_STYLES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload file guideline */}
              {formData.guidelineType === 'uploaded' && (
                <div className="p-3 rounded-xl border border-dashed border-sky-300 bg-[#F0F9FF] text-center space-y-2">
                  <Upload className="w-5 h-5 text-sky-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Unggah Dokumen Pedoman Kampus (.docx, .pdf, .txt)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    AI akan menggunakan aturan margin, font, spasi, dan struktur bab dari dokumen Anda.
                  </p>
                  <input
                    type="file"
                    accept=".txt,.doc,.docx,.pdf"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                  />
                  {formData.uploadedGuidelineName && (
                    <div className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Pedoman terbaca: {formData.uploadedGuidelineName}
                    </div>
                  )}
                </div>
              )}

              {/* Manual guidelines options */}
              {formData.guidelineType === 'manual' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Font Utama</label>
                    <select
                      value={formData.manualGuidelines?.fontFamily || 'Times New Roman'}
                      onChange={(e) =>
                        onChange({
                          manualGuidelines: {
                            ...formData.manualGuidelines,
                            fontFamily: e.target.value,
                          },
                        })
                      }
                      className="w-full p-1.5 text-xs rounded-md border border-slate-300 bg-white"
                    >
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                      <option value="Calibri">Calibri</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Spasi Baris</label>
                    <select
                      value={formData.manualGuidelines?.lineSpacing || 1.5}
                      onChange={(e) =>
                        onChange({
                          manualGuidelines: {
                            ...formData.manualGuidelines,
                            lineSpacing: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full p-1.5 text-xs rounded-md border border-slate-300 bg-white"
                    >
                      <option value="1.5">1.5 Spasi (Standar)</option>
                      <option value="2.0">2.0 Ganda</option>
                      <option value="1.15">1.15 Rapat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Format Margin</label>
                    <select
                      value={formData.manualGuidelines?.margins || '4-3-3-3'}
                      onChange={(e) =>
                        onChange({
                          manualGuidelines: {
                            ...formData.manualGuidelines,
                            margins: e.target.value,
                          },
                        })
                      }
                      className="w-full p-1.5 text-xs rounded-md border border-slate-300 bg-white"
                    >
                      <option value="4-3-3-3">Standar Dikti: Kiri 4cm, Atas 3cm, Bawah 3cm, Kanan 3cm (4-3-3-3)</option>
                      <option value="4-4-3-3">Variasi Kampus: Kiri 4cm, Atas 4cm, Bawah 3cm, Kanan 3cm (4-4-3-3)</option>
                      <option value="2.54">Standar Internasional (1 inch / 2.54cm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Struktur Bab</label>
                    <select
                      value={formData.chapterStructureType || 'standard_1_5'}
                      onChange={(e) => onChange({ chapterStructureType: e.target.value })}
                      className="w-full p-1.5 text-xs rounded-md border border-slate-300 bg-white"
                    >
                      {CHAPTER_STRUCTURE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Academic Citation Mode & Honesty Disclaimer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Standar Integritas Ilmiah:</strong> AI tidak akan mengarang kutipan palsu. Jika rujukan primer belum Anda input, sistem akan memberikan penanda <code>[REFERENSI DIPERLUKAN]</code> beserta saran kata kunci pencarian ilmiah di Sinta/Scopus.
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="font-semibold text-[11px]">Sajikan:</span>
                  <select
                    value={formData.citationMode}
                    onChange={(e) => onChange({ citationMode: e.target.value as any })}
                    className="p-1 text-xs rounded-md border border-amber-300 bg-white font-medium"
                  >
                    <option value="both">Sitasi Teks & Daftar Pustaka</option>
                    <option value="in_text">Hanya Sitasi Dalam Teks</option>
                    <option value="footnote">Catatan Kaki (Footnote)</option>
                    <option value="bibliography">Hanya Daftar Pustaka</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Bahasa, Gaya Penulisan & Batas Kata */}
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-bold text-[#1E3A5F]">
                Gaya Bahasa, Panjang Tulisan & Batas Kata
              </span>
            </div>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-4 pt-1 border-t border-slate-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bahasa</label>
                  <select
                    value={formData.language}
                    onChange={(e) => onChange({ language: e.target.value as any })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="id">Bahasa Indonesia (EYD V & KBBI)</option>
                    <option value="en">Bahasa Inggris (Academic English)</option>
                    <option value="other">Bahasa Lainnya</option>
                  </select>
                  {formData.language === 'other' && (
                    <input
                      type="text"
                      placeholder="Tuliskan bahasa..."
                      value={formData.customLanguage || ''}
                      onChange={(e) => onChange({ customLanguage: e.target.value })}
                      className="mt-1 w-full p-1.5 text-xs rounded-md border border-slate-300"
                    />
                  )}
                </div>

                {/* Writing style */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gaya Bahasa</label>
                  <select
                    value={formData.writingStyle}
                    onChange={(e) => onChange({ writingStyle: e.target.value })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    {WRITING_STYLES.map((ws) => (
                      <option key={ws.id} value={ws.label}>
                        {ws.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Complexity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kompleksitas Analisis</label>
                  <select
                    value={formData.academicComplexity}
                    onChange={(e) => onChange({ academicComplexity: e.target.value as any })}
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="dasar">Dasar (Lugas & Mudah Dipahami)</option>
                    <option value="menengah">Menengah (Standar S1 / Skripsi)</option>
                    <option value="mendalam">Mendalam (Tesis S2 & Disertasi S3)</option>
                  </select>
                </div>
              </div>

              {/* Length Category & Word Limits */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Panjang Tulisan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'singkat', label: 'Singkat (~400 kata)' },
                    { id: 'sedang', label: 'Sedang (~800 kata)' },
                    { id: 'panjang', label: 'Panjang (~1500 kata)' },
                    { id: 'sangat_mendalam', label: 'Mendalam (~2500 kata)' },
                    { id: 'kustom', label: 'Tentukan Sendiri' },
                  ].map((len) => (
                    <button
                      key={len.id}
                      type="button"
                      onClick={() => onChange({ lengthCategory: len.id as any })}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all text-center ${
                        formData.lengthCategory === len.id
                          ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {len.label}
                    </button>
                  ))}
                </div>

                {formData.lengthCategory === 'kustom' && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Target Kata</label>
                      <input
                        type="number"
                        placeholder="Contoh: 1200"
                        value={formData.targetWordCount || ''}
                        onChange={(e) => onChange({ targetWordCount: parseInt(e.target.value) || undefined })}
                        className="w-full p-1.5 text-xs rounded-md border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Batas Minimum</label>
                      <input
                        type="number"
                        placeholder="Contoh: 800"
                        value={formData.minWordCount || ''}
                        onChange={(e) => onChange({ minWordCount: parseInt(e.target.value) || undefined })}
                        className="w-full p-1.5 text-xs rounded-md border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Batas Maksimum</label>
                      <input
                        type="number"
                        placeholder="Contoh: 1500"
                        value={formData.maxWordCount || ''}
                        onChange={(e) => onChange({ maxWordCount: parseInt(e.target.value) || undefined })}
                        className="w-full p-1.5 text-xs rounded-md border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Estimasi Halaman</label>
                      <input
                        type="number"
                        placeholder="Misal: 5"
                        value={formData.estimatedPages || ''}
                        onChange={(e) => onChange({ estimatedPages: parseInt(e.target.value) || undefined })}
                        className="w-full p-1.5 text-xs rounded-md border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                )}
                <p className="mt-1.5 text-[11px] text-slate-500 italic">
                  *Catatan: Jumlah halaman riil mengikuti font, margin, spasi, tabel, dan format kampus yang diterapkan saat rendering dokumen.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 7: INSTRUKSI KHUSUS / CATATAN TAMBAHAN */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <label className="block text-xs font-bold text-[#1E3A5F]">
          Instruksi Khusus atau Catatan Tambahan (Opsional)
        </label>
        <textarea
          rows={3}
          placeholder="Masukkan arahan dosen pembimbing, teori yang wajib digunakan, batasan penelitian, karakter tulisan yang diinginkan, format khusus, atau bagian yang ingin diperbaiki..."
          value={formData.additionalNotes || ''}
          onChange={(e) => onChange({ additionalNotes: e.target.value })}
          className="w-full p-2.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-[#38BDF8]"
        />
        <p className="text-[11px] text-slate-500">
          Instruksi ini akan diprioritaskan bersama pedoman kampus yang aktif.
        </p>
      </div>

      {/* Advisory Warnings */}
      {warnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <Info className="w-4 h-4 text-amber-600" /> Rekomendasi Kualitas Akademik ({formData.degreeLevel}):
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}


      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onGenerateOutline}
          disabled={isLoading || !formData.topic}
          className="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <BookMarked className="w-4 h-4 text-sky-600" />
          <span>Lihat Kerangka Bab Dahulu</span>
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#1E3A5F] via-[#0284C7] to-[#38BDF8] text-white hover:opacity-95 text-xs sm:text-sm font-bold shadow-md shadow-sky-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menyusun Naskah Akademik...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>Generate Karya Akademik</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
