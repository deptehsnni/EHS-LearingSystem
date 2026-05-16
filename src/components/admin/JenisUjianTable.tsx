import React from 'react';
import { 
  CheckCircle2, 
  Copy, 
  QrCode, 
  Settings, 
  Trash2 
} from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '../../supabaseClient';
import { JenisUjian } from '../../types';

interface JenisUjianTableProps {
  jenisUjian: JenisUjian[];
  selectedJenis: string[];
  setSelectedJenis: (ids: string[]) => void;
  toggleJenisStatus: (id: string, currentStatus: boolean) => void;
  copyExamLink: (id: string) => void;
  handleShowQR: (j: JenisUjian) => void;
  handleEditJenis: (j: JenisUjian) => void;
  setViewingQuestionsJenis: (j: JenisUjian) => void;
  fetchData: () => void;
}

export const JenisUjianTable: React.FC<JenisUjianTableProps> = ({
  jenisUjian,
  selectedJenis,
  setSelectedJenis,
  toggleJenisStatus,
  copyExamLink,
  handleShowQR,
  handleEditJenis,
  setViewingQuestionsJenis,
  fetchData,
}) => {
  const handleDelete = async (id: string) => {
    if (confirm('Hapus jenis ujian ini? Seluruh soal terkait juga akan terhapus.')) {
      const { error } = await supabase.from('jenis_ujian').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus: ' + error.message);
      } else {
        fetchData();
      }
    }
  };

  return (
    <div>
      {/* PC: Tabel */}
      <div className="hidden md:block bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F3F0F5] text-[#49454F] text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">
                <input 
                  type="checkbox" 
                  className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                  onChange={(e) => { 
                    if (e.target.checked) setSelectedJenis(jenisUjian.map(j => j.id)); 
                    else setSelectedJenis([]); 
                  }}
                  checked={selectedJenis.length === jenisUjian.length && jenisUjian.length > 0} 
                />
              </th>
              <th className="px-6 py-4 font-bold">Nama Ujian / Training</th>
              <th className="px-6 py-4 font-bold">Durasi</th>
              <th className="px-6 py-4 font-bold">Limit 1x/Hari</th>
              <th className="px-6 py-4 font-bold">Komitmen</th>
              <th className="px-6 py-4 font-bold">Tipe</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E1E5]">
            {jenisUjian.map((j) => (
              <tr key={j.id} className="hover:bg-[#FDFCFB] transition-colors">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                    checked={selectedJenis.includes(j.id)}
                    onChange={(e) => { 
                      if (e.target.checked) setSelectedJenis([...selectedJenis, j.id]); 
                      else setSelectedJenis(selectedJenis.filter(id => id !== j.id)); 
                    }} 
                  />
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setViewingQuestionsJenis(j)} 
                    className="font-bold text-[#6750A4] hover:underline text-left"
                  >
                    {j.nama}
                  </button>
                </td>
                <td className="px-6 py-4">{Math.abs(j.timer_minutes)} Menit</td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", 
                    j.timer_minutes < 0 ? "bg-[#E3F2FD] text-[#1565C0]" : "bg-[#F5F5F5] text-[#757575]"
                  )}>
                    {j.timer_minutes < 0 ? 'Ya' : 'Tidak'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {j.has_commitment ? (
                    <span className="text-[#2E7D32] flex items-center gap-1 text-xs font-medium">
                      <CheckCircle2 size={14} /> Aktif
                    </span>
                  ) : (
                    <span className="text-[#49454F] text-xs">Tidak Ada</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold", 
                    j.tipe_ujian === 'umum' ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[#EDE7F6] text-[#4527A0]"
                  )}>
                    {j.tipe_ujian === 'umum' ? '🌐 Umum' : '🔒 Khusus'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleJenisStatus(j.id, !!j.is_active)} 
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase cursor-pointer transition-all hover:opacity-80 ${j.is_active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}
                  >
                    {j.is_active ? '🟢 ON' : '🔴 OFF'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => copyExamLink(j.id)} 
                      className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" 
                      title="Salin Link"
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={() => handleShowQR(j)} 
                      className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" 
                      title="QR Code"
                    >
                      <QrCode size={18} />
                    </button>
                    <button 
                      onClick={() => handleEditJenis(j)} 
                      className="p-2 text-[#49454F] hover:text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" 
                      title="Edit"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(j.id)} 
                      className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg transition-all" 
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {jenisUjian.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-[#49454F]">
                  Belum ada data jenis ujian. Klik "Tambah Jenis" untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: Card */}
      <div className="md:hidden space-y-3">
        {jenisUjian.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E6E1E5] p-8 text-center text-[#49454F]">
            Belum ada data jenis ujian.
          </div>
        )}
        {jenisUjian.map((j) => (
          <div key={j.id} className="bg-white rounded-2xl border border-[#E6E1E5] shadow-sm p-4">
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4] mt-1 flex-shrink-0"
                checked={selectedJenis.includes(j.id)}
                onChange={(e) => { 
                  if (e.target.checked) setSelectedJenis([...selectedJenis, j.id]); 
                  else setSelectedJenis(selectedJenis.filter(id => id !== j.id)); 
                }} 
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button 
                    onClick={() => setViewingQuestionsJenis(j)} 
                    className="font-bold text-[#6750A4] hover:underline text-left text-sm leading-tight"
                  >
                    {j.nama}
                  </button>
                  <button 
                    onClick={() => toggleJenisStatus(j.id, !!j.is_active)} 
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${j.is_active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}
                  >
                    {j.is_active ? '🟢 ON' : '🔴 OFF'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-[10px] bg-[#F3F0F5] text-[#49454F] px-2 py-0.5 rounded-full">{Math.abs(j.timer_minutes)} menit</span>
                  <span className={clsx(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold", 
                    j.timer_minutes < 0 ? "bg-[#E3F2FD] text-[#1565C0]" : "bg-[#F5F5F5] text-[#757575]"
                  )}>
                    {j.timer_minutes < 0 ? 'Limit 1x/hari' : 'Tanpa limit'}
                  </span>
                  {j.has_commitment && (
                    <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full font-bold">Komitmen</span>
                  )}
                  <span className={clsx(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold", 
                    j.tipe_ujian === 'umum' ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[#EDE7F6] text-[#4527A0]"
                  )}>
                    {j.tipe_ujian === 'umum' ? '🌐 Umum' : '🔒 Khusus'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => copyExamLink(j.id)} 
                    className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg" 
                    title="Salin Link"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    onClick={() => handleShowQR(j)} 
                    className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg" 
                    title="QR Code"
                  >
                    <QrCode size={16} />
                  </button>
                  <button 
                    onClick={() => handleEditJenis(j)} 
                    className="p-2 text-[#49454F] hover:bg-[#EADDFF] rounded-lg" 
                    title="Edit"
                  >
                    <Settings size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(j.id)} 
                    className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg" 
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
