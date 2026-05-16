import React from 'react';
import { 
  FileQuestion, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Trash2 
} from 'lucide-react';
import { Soal, JenisUjian } from '../../types';

interface SoalManagementProps {
  soal: Soal[];
  jenisUjian: JenisUjian[];
  selectedSoalGroupJenis: string;
  setSelectedSoalGroupJenis: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedSoal: string[];
  setSelectedSoal: (ids: string[] | ((prev: string[]) => string[])) => void;
  deleteSoal: (id: string) => void;
}

export const SoalManagement: React.FC<SoalManagementProps> = ({
  soal,
  jenisUjian,
  selectedSoalGroupJenis,
  setSelectedSoalGroupJenis,
  searchTerm,
  setSearchTerm,
  selectedSoal,
  setSelectedSoal,
  deleteSoal,
}) => {
  const filteredSoal = soal
    .filter(s => selectedSoalGroupJenis === 'all_list' || s.jenis_ujian_id === selectedSoalGroupJenis)
    .filter(s => s.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredIds = filteredSoal.map(s => s.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedSoal.includes(id));

  return (
    <div className="space-y-4">
      {selectedSoalGroupJenis === 'all' ? (
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setSelectedSoalGroupJenis('all_list')}
            className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all text-left group flex items-center gap-4"
          >
            <div className="p-3 bg-[#EADDFF] text-[#21005D] rounded-xl group-hover:scale-110 transition-transform">
              <FileQuestion size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#1C1B1F]">Semua Soal</h3>
              <p className="text-xs text-[#49454F]">{soal.length} Soal Tersedia</p>
            </div>
            <ChevronRight size={20} className="text-[#CAC4D0]" />
          </button>

          {jenisUjian.map(j => (
            <button 
              key={j.id}
              onClick={() => setSelectedSoalGroupJenis(j.id)}
              className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all text-left group flex items-center gap-4"
            >
              <div className="p-3 bg-[#D1E1FF] text-[#001D35] rounded-xl group-hover:scale-110 transition-transform">
                <BookOpen size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#1C1B1F]">{j.nama}</h3>
                <p className="text-xs text-[#49454F]">
                  {soal.filter(s => s.jenis_ujian_id === j.id).length} Soal
                </p>
              </div>
              <ChevronRight size={20} className="text-[#CAC4D0]" />
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => setSelectedSoalGroupJenis('all')}
              className="text-sm font-bold text-[#6750A4] hover:underline flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Kembali ke Grup
            </button>
            <span className="text-[#49454F]">/</span>
            <span className="text-sm font-bold">
              {selectedSoalGroupJenis === 'all_list' ? 'Semua Soal' : jenisUjian.find(j => j.id === selectedSoalGroupJenis)?.nama}
            </span>
          </div>

          <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#E6E1E5] flex flex-col md:flex-row md:justify-between md:items-center bg-[#FDFCFB] gap-4">
              <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#49454F]">
                  <Search size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="Cari Pertanyaan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                <input
                  type="checkbox"
                  className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                  checked={allSelected}
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedSoal(prev => [...new Set([...prev, ...filteredIds])]);
                    } else {
                      setSelectedSoal(prev => prev.filter(id => !filteredIds.includes(id)));
                    }
                  }}
                />
                <span className="text-sm font-medium text-[#49454F]">
                  Pilih Semua ({filteredIds.length})
                </span>
              </label>
            </div>

            <div className="p-6 space-y-3">
              {filteredSoal.length === 0 && (
                <div className="text-center py-10 text-[#49454F]">
                  <p>Tidak ada soal ditemukan.</p>
                </div>
              )}
              {filteredSoal.map((s) => (
                <div key={s.id} className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                    checked={selectedSoal.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSoal(prev => [...prev, s.id]);
                      } else {
                        setSelectedSoal(prev => prev.filter(id => id !== s.id));
                      }
                    }}
                  />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#49454F] uppercase font-bold">Jenis Ujian</span>
                      <span className="text-xs font-bold text-[#6750A4]">
                        {jenisUjian.find(j => j.id === s.jenis_ujian_id)?.nama || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex flex-col md:col-span-1">
                      <span className="text-[10px] text-[#49454F] uppercase font-bold">Pertanyaan</span>
                      <span className="text-sm line-clamp-2">{s.pertanyaan}</span>
                    </div>
                    <div className="flex flex-col items-start md:items-center">
                      <span className="text-[10px] text-[#49454F] uppercase font-bold">Jawaban</span>
                      <span className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold text-sm">
                        {s.jawaban_benar}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteSoal(s.id)}
                    className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
