import React from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  Sparkles,
  Download,
  FileCheck2,
  AlertCircle,
  Database,
  Cpu,
} from 'lucide-react';
import { AIAuditLogItem } from '../utils/academicRules.ts';

interface AIUsageAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AIAuditLogItem[];
  studentName?: string;
  topic?: string;
}

export const AIUsageAuditModal: React.FC<AIUsageAuditModalProps> = ({
  isOpen,
  onClose,
  logs,
  studentName,
  topic,
}) => {
  if (!isOpen) return null;

  const totalTokens = logs.reduce((acc, l) => acc + (l.estimatedTokens || 1200), 0);

  const handleDownloadDeclaration = () => {
    const text = `# PERNYATAAN TRANSPARANSI & INTEGRITAS PENGGUNAAN KECERDASAN BUATAN (AI)
DALAM PENYUSUNAN KARYA ILMIAH

Nama Mahasiswa : ${studentName || 'Mahasiswa Peneliti'}
Topik Kajian   : ${topic || 'Karya Ilmiah'}
Tanggal Laporan: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}

Daftar Rekam Jejak Pemanggilan Layanan AI (Remix AI Academic):
Total Sesi Interaksi: ${logs.length} kali
Total Estimasi Token: ${totalTokens} token

Rincian Aktivitas:
${logs
  .map(
    (l, idx) =>
      `${idx + 1}. [${l.timestamp}] Tugas: ${l.taskType} | Model: ${l.modelUsed} | Status: ${l.status} | Sumber: ${l.source}`
  )
  .join('\n')}

PERNYATAAN PENELITI:
Seluruh luaran teks yang dihasilkan oleh asisten AI telah ditelaah secara kritis, disunting ulang, dan diverifikasi kebenarannya oleh peneliti. Tidak ada data faktual atau hasil empiris yang dimanipulasi atau dikarang secara fiktif. Seluruh rujukan eksternal telah diverifikasi secara independen.`;

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Deklarasi_Penggunaan_AI_${(studentName || 'Mahasiswa').replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Pencatatan & Audit Integritas AI
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                Transparansi pemanfaatan AI sesuai panduan etika riset Kemendikbudristek
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Metric Stats */}
        <div className="p-5 border-b border-slate-100 grid grid-cols-3 gap-3 text-center bg-slate-50/30">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Sesi AI Dipanggil</span>
            <p className="text-lg font-black text-slate-800">{logs.length}</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Estimasi Token</span>
            <p className="text-lg font-black text-sky-700">{totalTokens.toLocaleString('id-ID')}</p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase">Model Utama</span>
            <p className="text-xs font-bold text-slate-700 mt-1">Gemini 3.8 Flash</p>
          </div>
        </div>

        {/* Log List */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-2">
              <Cpu className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-medium">Belum ada riwayat pemanggilan AI pada sesi ini.</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{log.taskType}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'sukses'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : log.status === 'cache'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {log.status === 'sukses'
                      ? 'Sukses'
                      : log.status === 'cache'
                      ? 'Cache Memori'
                      : 'Mesin Dikti'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </span>
                  <span>Model: {log.modelUsed}</span>
                </div>
                {log.promptSummary && (
                  <p className="text-[11px] text-slate-600 truncate">{log.promptSummary}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <span className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
            Dapat dilampirkan dalam naskah sidang ujian skripsi/tesis.
          </span>
          <button
            type="button"
            onClick={handleDownloadDeclaration}
            className="px-4 py-2.5 text-xs font-bold rounded-xl bg-[#1E3A5F] hover:bg-[#152840] text-white transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Surat Pernyataan AI (.md)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
