import React from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Trash2, 
  FileQuestion 
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx } from 'clsx';
import { HasilUjian, JenisUjian, PesertaMaster } from '../../types';

interface HasilManagementProps {
  results: HasilUjian[];
  jenisUjian: JenisUjian[];
  peserta: PesertaMaster[];
  showHasilDetail: boolean;
  setShowHasilDetail: (val: boolean) => void;
  selectedHasilJenis: string | null;
  setSelectedHasilJenis: (val: string | null) => void;
  selectedHasilDate: string | null;
  setSelectedHasilDate: (val: string | null) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  deleteHasil: (id: string) => void;
  setSelectedResultForCheating: (r: HasilUjian) => void;
  setShowCheatingModal: (val: boolean) => void;
}

export const HasilManagement: React.FC<HasilManagementProps> = ({
  results,
  jenisUjian,
  peserta,
  showHasilDetail,
  setShowHasilDetail,
  selectedHasilJenis,
  setSelectedHasilJenis,
  selectedHasilDate,
  setSelectedHasilDate,
  searchTerm,
  setSearchTerm,
  deleteHasil,
  setSelectedResultForCheating,
  setShowCheatingModal,
}) => {

  const groupedSummary = React.useMemo(() => {
    const grouped = results.reduce((acc, curr) => {
      try {
        const date = format(new Date(curr.waktu_selesai), 'yyyy-MM-dd');
        const key = `${date}_${curr.jenis_ujian_id}`;
        if (!acc[key]) {
          acc[key] = {
            date,
            jenis_id: curr.jenis_ujian_id,
            total: 0,
            lulus: 0,
            tidakLulus: 0
          };
        }
        acc[key].total++;
        if (curr.status_lulus) acc[key].lulus++;
        else acc[key].tidakLulus++;
      } catch (e) {
        console.error('Invalid date in results:', curr.waktu_selesai);
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => b.date.localeCompare(a.date));
  }, [results]);

  const detailedResults = React.useMemo(() => {
    if (!selectedHasilJenis || !selectedHasilDate) return [];
    return results
      .filter(r => r.jenis_ujian_id === selectedHasilJenis && format(new Date(r.waktu_selesai), 'yyyy-MM-dd') === selectedHasilDate)
      .filter(r => r.nama.toLowerCase().includes(searchTerm.toLowerCase()) || (r.nik && r.nik.includes(searchTerm)));
  }, [results, selectedHasilJenis, selectedHasilDate, searchTerm]);

  return (
    <div className="space-y-6">
      {!showHasilDetail ? (
        <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-[#F3F0F5] text-[#49454F] text-[10px] md:text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 md:px-6 py-4 font-bold">Tanggal</th>
                  <th className="px-4 md:px-6 py-4 font-bold">Nama Ujian</th>
                  <th className="px-4 md:px-6 py-4 font-bold text-center">Total</th>
                  <th className="px-4 md:px-6 py-4 font-bold text-center hidden sm:table-cell">Lulus</th>
                  <th className="px-4 md:px-6 py-4 font-bold text-center hidden sm:table-cell">Gagal</th>
                  <th className="px-4 md:px-6 py-4 font-bold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1E5]">
                {groupedSummary.map((summary: any) => (
                  <tr 
                    key={`${summary.date}_${summary.jenis_id}`}
                    className="hover:bg-[#FDFCFB] transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedHasilJenis(summary.jenis_id);
                      setSelectedHasilDate(summary.date);
                      setShowHasilDetail(true);
                      setSearchTerm(''); // Reset search when entering detail
                    }}
                  >
                    <td className="px-4 md:px-6 py-4 text-xs md:text-sm font-medium">
                      {format(new Date(summary.date), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-xs md:text-sm font-bold text-[#6750A4]">
                      {jenisUjian.find(j => j.id === summary.jenis_id)?.nama || 'Ujian Tidak Diketahui'}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center font-bold text-xs md:text-sm">{summary.total}</td>
                    <td className="px-4 md:px-6 py-4 text-center hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold">
                        {summary.lulus}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-full bg-[#F9DEDC] text-[#B3261E] text-[10px] font-bold">
                        {summary.tidakLulus}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <ChevronRight size={18} className="text-[#49454F] group-hover:translate-x-1 transition-transform inline" />
                    </td>
                  </tr>
                ))}
                {groupedSummary.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[#49454F]">
                      Belum ada data hasil ujian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
          <div className="p-4 md:p-6 border-b border-[#E6E1E5] flex flex-col md:flex-row justify-between items-start md:items-center bg-[#FDFCFB] gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  setShowHasilDetail(false);
                  setSelectedHasilJenis(null);
                  setSelectedHasilDate(null);
                }}
                className="p-2 hover:bg-[#F3F0F5] rounded-full transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h3 className="text-lg font-bold leading-tight">
                  {jenisUjian.find(j => j.id === selectedHasilJenis)?.nama || 'Ujian Tidak Diketahui'}
                </h3>
                <p className="text-[10px] md:text-xs text-[#49454F]">
                  {selectedHasilDate ? format(new Date(selectedHasilDate), 'dd MMMM yyyy', { locale: id }) : '-'}
                </p>
              </div>
            </div>
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#49454F]">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder="Cari Nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#E6E1E5] rounded-xl text-sm focus:ring-2 focus:ring-[#6750A4]"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F3F0F5] text-[#49454F] text-[10px] md:text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 md:px-6 py-4 font-bold">Nama</th>
                  <th className="px-4 md:px-6 py-4 font-bold">NIK / No.ID</th>
                  <th className="px-4 md:px-6 py-4 font-bold text-center">Nilai</th>
                  <th className="px-4 md:px-6 py-4 font-bold">Perusahaan</th>
                  <th className="px-4 md:px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-4 md:px-6 py-4 font-bold text-center">Info</th>
                  <th className="px-4 md:px-6 py-4 font-bold text-center">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1E5]">
                {detailedResults.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FDFCFB] transition-colors">
                    <td className="px-4 md:px-6 py-4">
                      <p className="font-bold text-[#1C1B1F] text-xs md:text-sm">{r.nama}</p>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <p className="text-[10px] text-[#49454F] font-mono">{r.nik || '-'}</p>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <span className={clsx(
                        "text-sm md:text-base font-black",
                        r.nilai >= 70 ? 'text-[#2E7D32]' : 'text-[#B3261E]'
                      )}>
                        {r.nilai}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <p className="text-xs text-[#49454F]">{r.perusahaan || peserta.find(p => p.nik === r.nik)?.perusahaan || '-'}</p>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <span className={clsx(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                        r.status_lulus ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'
                      )}>
                        {r.status_lulus 
                          ? (r.profil_data?.is_remedial ? 'Lulus Remedial' : 'Lulus') 
                          : (r.profil_data?.is_remedial ? 'Tidak Lulus Remedial' : 'Tidak Lulus')
                        }
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <button 
                        onClick={() => {
                          setSelectedResultForCheating(r);
                          setShowCheatingModal(true);
                        }}
                        className="p-1.5 text-[#49454F] hover:text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all"
                        title="Lihat Upaya Kecurangan"
                      >
                        <FileQuestion size={16} />
                      </button>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <button
                        onClick={() => deleteHasil(r.id)}
                        className="p-1.5 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg transition-all"
                        title="Hapus Hasil Ujian"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
