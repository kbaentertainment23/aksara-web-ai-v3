import React from 'react';
import { ShieldCheck, X, CheckCircle, AlertTriangle, BookOpen, Scale } from 'lucide-react';

interface AcademicEthicsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcademicEthicsModal: React.FC<AcademicEthicsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-[#F0F9FF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#1E3A5F]">
                Standar Kualitas Akademik & Panduan Etika AI
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                Prinsip integritas ilmiah, kejujuran riset, dan batasan penggunaan asisten akademik.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto text-xs sm:text-sm text-slate-700 space-y-4 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 flex items-start gap-2.5">
            <Scale className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Peran Asisten Akademik:</span> Aplikasi ini dirancang sebagai mitra berpikir (*collaborative thinking partner*), pembantu struktur naskah, dan asisten penyusun draf akademik, bukan sebagai pengganti proses penelitian mandiri mahasiswa atau joki tugas akhir.
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              1. Komitmen Terhadap Integritas Ilmiah
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Larangan Fabrikasi Data:</strong> Sistem tidak akan mengarang hasil survei, data statistik palsu, atau mengklaim penelitian lapangan sudah dilakukan jika Anda belum menginput data riil.
              </li>
              <li>
                <strong>Larangan Sitasi Fiktif:</strong> AI tidak akan memalsukan nama jurnal, DOI, atau kutipan buku. Jika rujukan spesifik belum diverifikasi, sistem akan mencantumkan penanda eksplisit <code>[REFERENSI DIPERLUKAN: ...]</code> agar mahasiswa mencari rujukan aslinya di Google Scholar / Scopus / SINTA.
              </li>
              <li>
                <strong>Preservasi Makna Parafrasa:</strong> Saat menggunakan fitur perbaikan atau parafrasa akademik, makna substansi gagasan asli tetap dipertahankan dengan diksi ilmiah yang baku.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              2. Tanggung Jawab Mahasiswa & Institusi
            </h4>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Verifikasi Fakta:</strong> Mahasiswa wajib membaca kembali setiap draf yang dihasilkan, membandingkan dengan buku teks rujukan utama, dan menguji kebenaran rumus atau formula.
              </li>
              <li>
                <strong>Kepatuhan Kebijakan Kampus:</strong> Setiap perguruan tinggi memiliki pedoman etika penggunaan kecerdasan buatan. Mahasiswa diimbau transparan dalam mendiskusikan penggunaan alat bantu penulisan dengan dosen pembimbing.
              </li>
              <li>
                <strong>Tidak Menjamin Kelulusan:</strong> Aplikasi tidak menjamin naskah otomatis disetujui dosen penguji atau bebas deteksi tanpa telaah mandiri mahasiswa.
              </li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
            <BookOpen className="w-4 h-4 text-slate-500 inline mr-1" />
            Dokumen yang diunggah mahasiswa (seperti pedoman kampus atau draf naskah) hanya diproses sebagai acuan perancangan format dan tidak dipublikasikan ke pihak ketiga.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold rounded-xl bg-[#1E3A5F] text-white hover:bg-[#152943] transition-colors cursor-pointer text-center"
          >
            Saya Memahami & Menyetujui
          </button>
        </div>
      </div>
    </div>
  );
};
