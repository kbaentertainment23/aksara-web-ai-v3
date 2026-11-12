import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  ArrowLeft,
  Settings2,
  ShieldAlert,
  RefreshCw,
  Play,
  Check,
  User,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { JobTypeSelector } from './components/JobTypeSelector.tsx';
import { AcademicForm } from './components/AcademicForm.tsx';
import { DocumentEditor } from './components/DocumentEditor.tsx';
import { OutlineModal } from './components/OutlineModal.tsx';
import { ClarificationModal } from './components/ClarificationModal.tsx';
import { AcademicEthicsModal } from './components/AcademicEthicsModal.tsx';
import { SavedProjectsDrawer, SavedProject } from './components/SavedProjectsDrawer.tsx';
import { AIUsageAuditModal } from './components/AIUsageAuditModal.tsx';
import {
  AcademicFormData,
  validateAcademicForm,
  ValidationResult,
  AIAuditLogItem,
  calculateAcademicStats,
  AUTOSAVE_STORAGE_KEY,
  isValidAutoSavePayload,
  reconcileDocumentCitationsAndBibliography,
} from './utils/academicRules.ts';

export interface QuotaStatusInfo {
  isExhausted: boolean;
  isDailyQuota: boolean;
  message: string;
  canResume: boolean;
  resumeFromChapter?: number;
}

export interface ChapterProgressItem {
  chapter: number;
  id: string;
  title: string;
  content: string;
}

const INITIAL_FORM_DATA: AcademicFormData = {
  jobType: 'title_ideas',
  degreeLevel: '',
  studyProgramCategory: '',
  studyProgramName: '',
  facultyName: '',
  fieldOfStudy: '',
  studentName: '',
  studentId: '',
  institutionName: '',
  advisor1: '',
  advisor2: '',
  topic: '',
  tentativeTitle: '',
  backgroundProblem: '',
  identifiedProblem: '',
  researchSubject: '',
  researchLocation: '',
  populationSample: '',
  variables: '',
  coreTheories: '',
  researchObjectives: '',
  initialReferences: '',
  methodologyApproach: 'belum_ditentukan',
  outputFormat: 'docx',
  guidelineType: 'general',
  language: 'id',
  writingStyle: 'Akademik formal',
  academicComplexity: 'menengah',
  lengthCategory: 'sedang',
  citationStyle: 'APA 7th Edition',
  citationMode: 'both',
  chapterStructureType: 'standard_1_5',
  titleCount: 5,
  titleLength: 'sedang',
  titleStyle: 'Akademik formal',
  titleNovelty: 'pengembangan penelitian sebelumnya',
  quotaSaverMode: true,
};

/**
 * Safely parses fetch Response into JSON, preventing SyntaxError: Unexpected token '<'
 * when serverless functions, proxies, or SPA routing return HTML instead of JSON.
 */
async function safeParseJsonResponse<T = any>(
  response: Response
): Promise<{ ok: boolean; status: number; data?: T; errorText?: string }> {
  const status = response.status;
  if (status === 504) {
    return {
      ok: false,
      status: 504,
      errorText:
        'Layanan hosting serverless mengalami batas waktu (504 Gateway Timeout). Proses generasi AI membutuhkan waktu melebihi batas durasi platform. Silakan ulangi atau gunakan opsi penyusunan per bab agar proses berjalan lebih cepat dan stabil.',
    };
  }

  let rawText = '';
  try {
    rawText = await response.text();
  } catch (err: any) {
    return {
      ok: false,
      status,
      errorText: `Gagal membaca respons dari server: ${err?.message || 'Koneksi terputus'}.`,
    };
  }

  const trimmed = rawText.trim();
  if (
    trimmed.startsWith('<') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<!DOCTYPE') ||
    trimmed.startsWith('<html')
  ) {
    return {
      ok: false,
      status,
      errorText:
        status === 504
          ? 'Layanan hosting serverless mengalami batas waktu (504 Gateway Timeout). Silakan susun bab per bab secara bertahap.'
          : `Server mengembalikan halaman web HTML (Status ${status}) bukan format data JSON. Kemungkinan terjadi batas waktu pemanggilan (timeout) atau rute API belum siap di server backend.`,
    };
  }

  try {
    const data = JSON.parse(rawText) as T;
    return {
      ok: response.ok,
      status,
      data,
    };
  } catch {
    return {
      ok: false,
      status,
      errorText: `Format data respons server tidak valid (Status ${status}). Mohon coba sesaat lagi.`,
    };
  }
}

export default function App() {
  const [formData, setFormData] = useState<AcademicFormData>(INITIAL_FORM_DATA);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [outlineContent, setOutlineContent] = useState<string>('');
  const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [isClarificationOpen, setIsClarificationOpen] = useState<boolean>(false);
  const [isEthicsOpen, setIsEthicsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);

  // Primary Workspace View: 'form' (Pengaturan Formulir & Bab) or 'editor' (Ruang Editor Word A4)
  const [writingSubView, setWritingSubView] = useState<'form' | 'editor'>('form');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [validationState, setValidationState] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: [],
  });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [auditLogs, setAuditLogs] = useState<AIAuditLogItem[]>([]);

  // Quota Resilience & Sequential Chapter Progress States
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatusInfo | null>(null);
  const [completedChapters, setCompletedChapters] = useState<ChapterProgressItem[]>([]);
  const [recoveredDraftNotice, setRecoveredDraftNotice] = useState<{
    time: string;
    wordCount: number;
    topic: string;
  } | null>(null);

  // Quota Conservation Mode: Prioritizes ultra token-efficient models (Gemini Flash-Lite) & 24h caching
  const [isQuotaSaverMode, setIsQuotaSaverMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aksara_quota_saver') !== 'false';
    } catch {
      return true;
    }
  });

  const handleToggleQuotaSaverMode = () => {
    setIsQuotaSaverMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aksara_quota_saver', String(next));
      } catch {}
      setFormData((f) => ({ ...f, quotaSaverMode: next }));
      return next;
    });
  };

  // Load saved projects, logs, and auto-saved draft from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai_skripsi_projects');
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }
      const storedLogs = localStorage.getItem('ai_academic_audit_logs');
      if (storedLogs) {
        setAuditLogs(JSON.parse(storedLogs));
      }

      // Check and restore uncommitted draft from previous session
      const autoSavedStr = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
      if (autoSavedStr) {
        const parsed = JSON.parse(autoSavedStr);
        if (isValidAutoSavePayload(parsed)) {
          setGeneratedContent(parsed.content);
          if (parsed.formData) {
            setFormData((prev) => ({ ...prev, ...parsed.formData }));
          }
          setIsSaved(false);
          setRecoveredDraftNotice({
            time: parsed.timestamp
              ? new Date(parsed.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : 'sebelumnya',
            wordCount: parsed.content.split(/\s+/).filter(Boolean).length,
            topic: parsed.formData?.tentativeTitle || parsed.formData?.topic || 'Draf Naskah',
          });
        }
      }
    } catch (e) {
      console.error('Failed to load saved projects or autosave', e);
    }
  }, []);

  const handleDiscardAutoSavedDraft = () => {
    try {
      localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
    } catch (e) {}
    setGeneratedContent('');
    setRecoveredDraftNotice(null);
  };

  const handleFormChange = (updated: Partial<AcademicFormData>) => {
    setFormData((prev) => ({ ...prev, ...updated }));
    setIsSaved(false);
  };

  // Add log entry
  const recordAILog = (taskType: string, source: string, status: 'sukses' | 'cache' | 'fallback' | 'terhenti_kuota') => {
    const newLog: AIAuditLogItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      taskType,
      modelUsed: source?.includes('lite')
        ? 'Gemini 3.1 Flash-Lite (Mode Hemat)'
        : source?.includes('gemini')
        ? 'Gemini 3.8 Flash'
        : 'Mesin Standar Dikti',
      promptSummary: `${formData.degreeLevel} - ${formData.topic.substring(0, 45)}...`,
      estimatedTokens: source?.includes('lite') ? 350 : taskType.includes('Utuh') ? 3600 : 950,
      status,
      source: source || 'gemini',
    };
    const updatedLogs = [newLog, ...auditLogs.slice(0, 49)];
    setAuditLogs(updatedLogs);
    try {
      localStorage.setItem('ai_academic_audit_logs', JSON.stringify(updatedLogs));
    } catch (e) {
      console.error(e);
    }
  };

  // Execute Generation (supports standard & sequential full thesis generation)
  const executeGeneration = async (
    overrideData?: Partial<AcademicFormData>,
    resumeChapter?: number
  ) => {
    if (isLoading) return;
    const finalData = { ...formData, quotaSaverMode: isQuotaSaverMode, ...(overrideData || {}) };
    const validation = validateAcademicForm(finalData);
    setValidationState(validation);

    if (!validation.isValid) {
      setErrorMessage('Mohon lengkapi kolom bertanda bintang sebelum melanjutkan.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const isFullGen = finalData.jobType === 'full_generation';
    setProgressStep(
      isFullGen
        ? `Memulai generasi Bab I – V (${resumeChapter ? `Melanjutkan dari Bab ${resumeChapter}` : 'Mempersiapkan parameter'})`
        : 'Menganalisis parameter metodologis dan disiplin ilmu...'
    );

    const stepTimers: NodeJS.Timeout[] = [];
    if (!isFullGen) {
      stepTimers.push(
        setTimeout(() => {
          setProgressStep('Menyelaraskan struktur 4 pilar dan alur piramida terbalik...');
        }, 1000)
      );
      stepTimers.push(
        setTimeout(() => {
          setProgressStep('Menjalankan pemeriksaan otomatis & penyuntingan internal gaya bahasa...');
        }, 2400)
      );
    } else {
      stepTimers.push(
        setTimeout(() => {
          setProgressStep('Memproses bab secara berkesinambungan dengan optimasi token & kuota...');
        }, 1500)
      );
    }

    try {
      if (isFullGen) {
        // Multi-chapter progression: Process chapter by chapter to prevent 504 Gateway Timeout on Vercel
        const CHAPTER_SPECS_CLIENT = [
          { chapter: 1, id: 'bab_1', title: 'BAB I', name: 'Bab I (Pendahuluan)' },
          { chapter: 2, id: 'bab_2', title: 'BAB II', name: 'Bab II (Kajian Pustaka)' },
          { chapter: 3, id: 'bab_3', title: 'BAB III', name: 'Bab III (Metodologi Penelitian)' },
          { chapter: 4, id: 'bab_4', title: 'BAB IV', name: 'Bab IV (Hasil & Pembahasan)' },
          { chapter: 5, id: 'bab_5', title: 'BAB V', name: 'Bab V (Penutup)' },
        ];

        const startChapter = Math.max(1, Math.min(5, resumeChapter || 1));
        let currentChapters: ChapterProgressItem[] =
          resumeChapter && completedChapters.length > 0 ? [...completedChapters] : [];

        for (let c = startChapter; c <= 5; c++) {
          const spec = CHAPTER_SPECS_CLIENT[c - 1];
          setProgressStep(`Menyusun ${spec.name} (${c} dari 5)...`);

          const chapterPayload = {
            ...finalData,
            jobType: spec.id,
            currentChapter: c,
            existingChapters: currentChapters,
            isPartOfFullThesis: true,
          };

          const response = await fetch('/api/academic/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chapterPayload),
          });

          const parsed = await safeParseJsonResponse<any>(response);

          if (!parsed.ok || !parsed.data) {
            throw new Error(
              parsed.errorText ||
                parsed.data?.error ||
                parsed.data?.message ||
                `Gagal memproses ${spec.name} (Status ${response.status}).`
            );
          }

          const data = parsed.data;

          // Check quota exhaustion or rate limit stoppage
          if (
            data.status === 'daily_quota_stopped' ||
            data.status === 'rate_limit_stopped' ||
            (data.isDailyQuota && data.status !== 'partial_fallback')
          ) {
            setQuotaStatus({
              isExhausted: true,
              isDailyQuota: Boolean(data.isDailyQuota),
              message: data.message || 'Batas kuota harian tercapai.',
              canResume: true,
              resumeFromChapter: c,
            });

            setCompletedChapters(currentChapters);
            const rawPartialText = currentChapters.map((ch) => ch.content).join('\n\n---\n\n');
            const topicOrField = finalData.studyProgramName || finalData.topic || finalData.fieldOfStudy || 'Umum';
            const partialText = reconcileDocumentCitationsAndBibliography(rawPartialText, topicOrField, true);
            if (partialText.trim()) {
              setGeneratedContent(partialText);
              setWritingSubView('editor');
              setIsSaved(false);
            }
            recordAILog(`Generasi Bab I – V (terhenti di Bab ${c})`, data.source, 'terhenti_kuota');
            return;
          }

          if (data.text && data.text.trim().length > 0) {
            currentChapters = currentChapters.filter((ch) => ch.chapter !== c);
            currentChapters.push({
              chapter: c,
              id: spec.id,
              title: spec.title,
              content: data.text,
            });
            currentChapters.sort((a, b) => a.chapter - b.chapter);
            setCompletedChapters([...currentChapters]);

            // Live update editor content with all completed chapters and unified bibliography at the very end
            const rawLiveText = currentChapters.map((ch) => ch.content).join('\n\n---\n\n');
            const topicOrField = finalData.studyProgramName || finalData.topic || finalData.fieldOfStudy || 'Umum';
            const liveText = reconcileDocumentCitationsAndBibliography(rawLiveText, topicOrField, true);
            setGeneratedContent(liveText);
          }
        }

        // All 5 chapters completed successfully - consolidate into ONE single bibliography at the end
        const rawAssembledText = currentChapters.map((ch) => ch.content).join('\n\n---\n\n');
        const topicOrField = finalData.studyProgramName || finalData.topic || finalData.fieldOfStudy || 'Umum';
        const assembledText = reconcileDocumentCitationsAndBibliography(rawAssembledText, topicOrField, true);
        setGeneratedContent(assembledText);
        setQuotaStatus(null);
        setWritingSubView('editor');
        setIsSaved(false);
        recordAILog('Generasi Utuh Bab I - V', 'gemini-sequential', 'sukses');
        return;
      }

      // Single Task / Chapter Generation
      const response = await fetch('/api/academic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      const parsed = await safeParseJsonResponse<any>(response);

      if (!parsed.ok || !parsed.data) {
        throw new Error(
          parsed.errorText ||
            parsed.data?.error ||
            parsed.data?.message ||
            `Server returned status ${response.status}`
        );
      }

      const data = parsed.data;

      // Check quota exhaustion or rate limit stoppage
      if (
        data.status === 'daily_quota_stopped' ||
        data.status === 'rate_limit_stopped' ||
        (data.isDailyQuota && data.status !== 'partial_fallback')
      ) {
        setQuotaStatus({
          isExhausted: true,
          isDailyQuota: Boolean(data.isDailyQuota),
          message: data.message || 'Batas kuota harian tercapai.',
          canResume: Boolean(data.canResume),
          resumeFromChapter: data.resumeFromChapter || data.failedChapter,
        });

        if (data.completedChapters && data.completedChapters.length > 0) {
          setCompletedChapters(data.completedChapters);
        }

        // Preserve all completed text in the editor
        if (data.text && data.text.trim().length > 0) {
          setGeneratedContent(data.text);
          setWritingSubView('editor');
          setIsSaved(false);
        }
        recordAILog(`Generasi ${finalData.jobType}`, data.source, 'terhenti_kuota');
        return;
      }

      // Successful or partial fallback generation
      if (data.text && data.text.trim().length > 0) {
        setGeneratedContent(data.text);
        if (data.completedChapters && data.completedChapters.length > 0) {
          setCompletedChapters(data.completedChapters);
        }
        if (data.isDailyQuota) {
          setQuotaStatus({
            isExhausted: true,
            isDailyQuota: true,
            message: data.message || 'Batas kuota harian gratis Gemini API tercapai (RESOURCE_EXHAUSTED). Naskah berhasil dilengkapi dengan Mesin Akademik Berstandar Dikti agar pengerjaan Anda tetap berjalan lancar.',
            canResume: false,
          });
        } else {
          setQuotaStatus(null);
        }
        setWritingSubView('editor');
        setIsSaved(false);
        recordAILog(
          `Generasi ${finalData.jobType}`,
          data.source,
          data.source === 'cache' ? 'cache' : data.status === 'partial_fallback' ? 'fallback' : 'sukses'
        );
      } else {
        throw new Error(data.message || data.error || 'Naskah akademik tidak dapat dimuat dari respons server.');
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(
        err?.message || 'Terjadi kendala saat menyusun naskah. Periksa kembali koneksi atau coba sesuaikan masukan.'
      );
    } finally {
      stepTimers.forEach((t) => clearTimeout(t));
      setIsLoading(false);
      setProgressStep('');
    }
  };

  // Resume full generation from specified chapter
  const handleResumeGeneration = (chapterNum: number) => {
    executeGeneration({ jobType: 'full_generation' }, chapterNum);
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAcademicForm(formData);
    setValidationState(validation);

    if (!validation.isValid) {
      setErrorMessage('Lengkapi kolom wajib terlebih dahulu.');
      return;
    }

    if (!formData.researchSubject && !formData.populationSample && formData.jobType !== 'title_ideas') {
      setClarificationQuestions([
        'Siapa atau apa yang menjadi subjek/objek penelitian spesifik Anda? (Misal: Karyawan Divisi IT PT X, Siswa SMA Y, Pasien RS Z)',
        'Apakah sudah ada data awal atau fenomena empiris yang telah diamati?',
      ]);
      setIsClarificationOpen(true);
      return;
    }

    executeGeneration();
  };

  // Outline Generation Handler
  const handleGenerateOutline = async () => {
    if (isLoading) return;
    if (!formData.topic) {
      setErrorMessage('Topik penelitian wajib diisi sebelum melihat kerangka.');
      return;
    }

    setIsLoading(true);
    setProgressStep('Merancang kerangka bab terstruktur...');
    try {
      const response = await fetch('/api/academic/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, quotaSaverMode: isQuotaSaverMode }),
      });
      const parsed = await safeParseJsonResponse<any>(response);
      if (parsed.ok && parsed.data?.outline) {
        setOutlineContent(parsed.data.outline);
        setIsOutlineOpen(true);
        recordAILog('Pembuatan Outline Terstruktur', parsed.data.source, 'sukses');
      } else if (!parsed.ok) {
        setErrorMessage(parsed.errorText || parsed.data?.error || 'Gagal memuat kerangka penelitian.');
      }
    } catch (err: any) {
      console.error('Outline error:', err);
      setErrorMessage(err?.message || 'Gagal memuat kerangka penelitian.');
    } finally {
      setIsLoading(false);
      setProgressStep('');
    }
  };

  // Refine / Additional instruction handler (Auto-editorial & Polishing pipeline)
  const handleRefine = async (instruction: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setProgressStep('Menyunting naskah: menghapus klise & memperhalus alur bahasa akademik...');
    try {
      const response = await fetch('/api/academic/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedContent,
          instruction,
          formData: { ...formData, quotaSaverMode: isQuotaSaverMode },
        }),
      });

      const parsed = await safeParseJsonResponse<any>(response);
      if (parsed.ok && parsed.data?.text) {
        setGeneratedContent(parsed.data.text);
        setIsSaved(false);
        recordAILog('Poles & Penyuntingan Anti-Klise', parsed.data.source, 'sukses');
      } else if (!parsed.ok) {
        setErrorMessage(parsed.errorText || parsed.data?.error || 'Gagal melakukan penyuntingan naskah.');
      }
    } catch (err: any) {
      console.error('Refine error:', err);
      setErrorMessage(err?.message || 'Gagal melakukan penyuntingan naskah.');
    } finally {
      setIsLoading(false);
      setProgressStep('');
    }
  };

  // Save to localStorage
  const handleSaveToHistory = () => {
    if (!generatedContent) return;

    const newProject: SavedProject = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      topic: formData.topic || 'Tanpa Judul',
      degreeLevel: formData.degreeLevel || 'S1',
      jobType: formData.jobType,
      studyProgram: formData.studyProgramName || formData.studyProgramCategory || 'Umum',
      content: generatedContent,
      formData: { ...formData },
    };

    const updated = [newProject, ...savedProjects.filter((p) => p.topic !== newProject.topic)];
    setSavedProjects(updated);
    try {
      localStorage.setItem('ai_skripsi_projects', JSON.stringify(updated));
      setIsSaved(true);
    } catch (e) {
      console.error('Failed to save', e);
    }
  };

  // Load project from history
  const handleLoadProject = (project: SavedProject) => {
    setFormData(project.formData);
    setGeneratedContent(project.content);
    setWritingSubView('editor');
    setIsSaved(true);
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    const updated = savedProjects.filter((p) => p.id !== id);
    setSavedProjects(updated);
    localStorage.setItem('ai_skripsi_projects', JSON.stringify(updated));
  };

  // Clear all
  const handleClearAll = () => {
    setSavedProjects([]);
    localStorage.removeItem('ai_skripsi_projects');
  };

  // Export & Import full project JSON
  const handleExportProjectBackup = () => {
    const exportPayload = {
      version: '2.0-academic',
      exportDate: new Date().toISOString(),
      formData,
      generatedContent,
      completedChapters,
      auditLogs,
    };
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RemixAcademic_${(formData.studentName || formData.topic || 'Proyek').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProjectBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.formData) {
          setFormData(parsed.formData);
        }
        if (parsed.generatedContent) {
          setGeneratedContent(parsed.generatedContent);
        }
        if (parsed.completedChapters) {
          setCompletedChapters(parsed.completedChapters);
        }
        if (parsed.auditLogs) {
          setAuditLogs(parsed.auditLogs);
        }
        setWritingSubView('form');
        setIsSaved(true);
      } catch (err) {
        setErrorMessage('File cadangan JSON tidak valid atau rusak.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenEthics={() => setIsEthicsOpen(true)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onExportProjectBackup={handleExportProjectBackup}
        onImportProjectBackup={handleImportProjectBackup}
        savedCount={savedProjects.length}
        auditCount={auditLogs.length}
        isQuotaSaverMode={isQuotaSaverMode}
        onToggleQuotaSaverMode={handleToggleQuotaSaverMode}
        sticky={writingSubView !== 'editor'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Focused Thesis Workspace Navigation: Form Generator vs Editor Word A4 */}
        <div className={`sticky ${writingSubView === 'form' ? 'top-14 sm:top-16' : 'top-0 sm:top-1'} z-25 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-md transition-all flex flex-wrap items-center justify-between gap-2 p-1.5 sm:p-2`}>
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setWritingSubView('form')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                writingSubView === 'form'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Settings2 className={`w-4 h-4 shrink-0 ${writingSubView === 'form' ? 'text-sky-300' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Pengaturan & Formulir Bab</span>
              <span className="sm:hidden">Formulir Bab</span>
            </button>

            <button
              type="button"
              onClick={() => setWritingSubView('editor')}
              className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                writingSubView === 'editor'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <FileText
                className={`w-4 h-4 shrink-0 ${
                  writingSubView === 'editor'
                    ? 'text-sky-300'
                    : generatedContent
                    ? 'text-sky-500'
                    : 'text-slate-400'
                }`}
              />
              <span className="hidden sm:inline">Ruang Editor Word A4</span>
              <span className="sm:hidden">Editor Word A4</span>
              {generatedContent && (
                <span className="flex items-center gap-1 ml-0.5 sm:ml-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                    {calculateAcademicStats(generatedContent).wordCount}
                  </span>
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {generatedContent && writingSubView === 'form' && (
              <button
                type="button"
                onClick={() => setWritingSubView('editor')}
                className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Lihat Naskah ({calculateAcademicStats(generatedContent).wordCount} kata)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 pr-1 sm:pr-2 sm:border-l sm:border-slate-200 sm:pl-3">
              {formData.degreeLevel || formData.studyProgramName ? (
                <>
                  <span className="font-semibold text-slate-700">{formData.degreeLevel || 'Jenjang'}</span>
                  <span>•</span>
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">{formData.studyProgramName || formData.studyProgramCategory || 'Prodi'}</span>
                </>
              ) : (
                <span className="text-slate-400 italic text-[11px] sm:text-xs">Formulir Siap Digunakan</span>
              )}
            </div>
          </div>
        </div>

        {/* Restored Auto-Saved Draft Notification */}
        {recoveredDraftNotice && generatedContent && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-300 text-sky-950 text-xs flex flex-wrap items-center justify-between gap-2.5 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-sky-100 rounded-lg text-sky-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sky-900">Draf Sesi Terakhir Dipulihkan Otomatis:</span>{' '}
                <span className="text-slate-700">
                  {recoveredDraftNotice.topic} ({recoveredDraftNotice.wordCount} kata, tersimpan {recoveredDraftNotice.time})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {writingSubView !== 'editor' && (
                <button
                  type="button"
                  onClick={() => setWritingSubView('editor')}
                  className="px-2.5 py-1 text-[11px] font-bold bg-[#1E3A5F] hover:bg-[#2B579A] text-white rounded-md transition-colors cursor-pointer"
                >
                  Buka di Editor Word
                </button>
              )}
              <button
                type="button"
                onClick={handleDiscardAutoSavedDraft}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="Hapus draf otomatis ini jika ingin memulai dari awal"
              >
                Hapus Draf
              </button>
              <button
                type="button"
                onClick={() => setRecoveredDraftNotice(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Tutup pemberitahuan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Sederhana: Popup Notifikasi Kuota AI Habis */}
        {quotaStatus && quotaStatus.isExhausted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-2xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm sm:max-w-md w-full p-4 sm:p-5 overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {quotaStatus.isDailyQuota
                        ? 'Batas Kuota AI Tercapai'
                        : 'Frekuensi AI Dibatasi (Rate Limit)'}
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                      Draf Aman Tersimpan
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuotaStatus(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Tutup notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                {quotaStatus.message ||
                  'Batas kuota harian gratis Gemini API tercapai. Naskah Anda tetap aman dan secara otomatis diproses menggunakan Mesin Standar Dikti.'}
              </div>

              {quotaStatus.isDailyQuota && (
                <p className="text-[11px] text-slate-400 italic mt-2">
                  * Kuota gratis AI diperbarui otomatis setiap siklus 24 jam.
                </p>
              )}

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {quotaStatus.canResume && quotaStatus.resumeFromChapter ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setQuotaStatus(null)}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Buka Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const ch = quotaStatus.resumeFromChapter!;
                        setQuotaStatus(null);
                        handleResumeGeneration(ch);
                      }}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Lanjutkan Bab {quotaStatus.resumeFromChapter}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setQuotaStatus(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Mengerti
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sequential Chapter Progress Tracker */}
        {completedChapters.length > 0 && (
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Progres Bab Skripsi/Tesis:</span>
              <span className="text-xs text-slate-500 font-medium">
                ({completedChapters.length} dari 5 bab selesai tersimpan)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((c) => {
                const done = completedChapters.find((item) => item.chapter === c);
                const isFailed = quotaStatus?.resumeFromChapter === c;
                return (
                  <span
                    key={c}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      done
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isFailed
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 font-extrabold animate-pulse'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {done ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : isFailed ? (
                      <ShieldAlert className="w-3 h-3 text-amber-600" />
                    ) : null}
                    <span>Bab {c}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-[#1E3A5F] text-white shadow-md flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <div>
                <p className="text-xs sm:text-sm font-bold">Sedang Memproses...</p>
                <p className="text-[11px] text-sky-100">{progressStep}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-white/20 rounded-md">
              Gemini 3.8 Flash
            </span>
          </div>
        )}

        {/* Focused Workspace Content: Form / Generator vs Editor Word A4 */}
        <div className="space-y-5">
          {writingSubView === 'form' ? (
            <div className="space-y-6">
              <JobTypeSelector
                selectedJobId={formData.jobType}
                onSelectJob={(id) => handleFormChange({ jobType: id })}
              />

              <AcademicForm
                formData={formData}
                onChange={handleFormChange}
                onSubmit={handleSubmit}
                onGenerateOutline={handleGenerateOutline}
                isLoading={isLoading}
                validationErrors={validationState.errors}
                warnings={validationState.warnings}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setWritingSubView('form')}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1E3A5F] hover:text-[#0284C7] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Pengaturan Formulir</span>
                </button>
              </div>

              <DocumentEditor
                content={generatedContent}
                onContentChange={(newText) => {
                  setGeneratedContent(newText);
                  setIsSaved(false);
                }}
                formData={formData}
                onUpdateFormData={handleFormChange}
                onRegenerate={() => executeGeneration()}
                onRefine={handleRefine}
                onSaveToHistory={handleSaveToHistory}
                isLoading={isLoading}
                isSaved={isSaved}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals & Drawers */}
      <OutlineModal
        isOpen={isOutlineOpen}
        onClose={() => setIsOutlineOpen(false)}
        outlineText={outlineContent}
        onApproveAndGenerate={() => {
          setIsOutlineOpen(false);
          executeGeneration();
        }}
        isLoading={isLoading}
      />

      <ClarificationModal
        isOpen={isClarificationOpen}
        onClose={() => setIsClarificationOpen(false)}
        questions={clarificationQuestions}
        onSubmitAnswers={(answers) => {
          setIsClarificationOpen(false);
          const combinedAnswers = Object.values(answers).filter(Boolean).join('. ');
          executeGeneration({
            additionalNotes: `${formData.additionalNotes || ''}\n[JAWABAN KLARIFIKASI]: ${combinedAnswers}`,
          });
        }}
        onProceedAnyway={() => {
          setIsClarificationOpen(false);
          executeGeneration();
        }}
      />

      <AcademicEthicsModal
        isOpen={isEthicsOpen}
        onClose={() => setIsEthicsOpen(false)}
      />

      <AIUsageAuditModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        logs={auditLogs}
        studentName={formData.studentName}
        topic={formData.topic}
      />

      <SavedProjectsDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        projects={savedProjects}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        onClearAll={handleClearAll}
      />

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-200 bg-white text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 A K S A R A. Aplikasi Kendali Skripsi, Tugas Akhir, & Riset Akademik (D3 – S3).</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAuditLogOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              Log AI & Transparansi
            </button>
            <span>•</span>
            <button
              onClick={() => setIsEthicsOpen(true)}
              className="hover:text-slate-800 transition-colors"
            >
              Integritas & Etika Riset
            </button>
            <span>•</span>
            <span>Standar Dikti (KKNI Level 5–9)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
