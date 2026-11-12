import React, { useState } from 'react';
import {
  History,
  X,
  Trash2,
  ExternalLink,
  Calendar,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react';
import { AcademicFormData } from '../utils/academicRules.ts';

export interface SavedProject {
  id: string;
  createdAt: string;
  topic: string;
  degreeLevel: string;
  jobType: string;
  studyProgram: string;
  content: string;
  formData: AcademicFormData;
}

interface SavedProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  onLoadProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
  onClearAll: () => void;
}

export const SavedProjectsDrawer: React.FC<SavedProjectsDrawerProps> = ({
  isOpen,
  onClose,
  projects,
  onLoadProject,
  onDeleteProject,
  onClearAll,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-[#F0F9FF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8] text-white flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E3A5F]">
                Riwayat Pengerjaan Akademik
              </h3>
              <p className="text-xs text-slate-500">
                {projects.length} draf tersimpan di peramban Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada draf tersimpan
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Setelah naskah berhasil di-generate, tekan tombol "Simpan" di editor untuk menyimpannya ke sini.
              </p>
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 bg-white transition-all shadow-2xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0F9FF] text-[#0284C7] border border-sky-200">
                    {proj.degreeLevel} - {proj.jobType.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(proj.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-[#1E3A5F] line-clamp-2">
                  {proj.topic}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {proj.studyProgram}
                </p>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadProject(proj);
                      onClose();
                    }}
                    className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1"
                  >
                    <span>Buka Naskah</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {deleteConfirmId === proj.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-rose-600 font-semibold">Hapus?</span>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteProject(proj.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-600 text-white"
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-0.5 text-[11px] rounded bg-slate-200 text-slate-700"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(proj.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus draf ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {projects.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Total {projects.length} dokumen
            </span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Hapus seluruh riwayat pengerjaan tersimpan?')) {
                  onClearAll();
                }
              }}
              className="text-rose-600 hover:text-rose-800 font-semibold"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
