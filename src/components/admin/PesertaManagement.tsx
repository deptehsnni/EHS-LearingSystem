import React from 'react';
import { 
  Users, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Trash2 
} from 'lucide-react';
import { PesertaMaster, JenisUjian } from '../../types';

interface PesertaManagementProps {
  peserta: PesertaMaster[];
  jenisUjian: JenisUjian[];
  selectedGroupJenis: string;
  setSelectedGroupJenis: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedPeserta: string[];
  setSelectedPeserta: (niks: string[] | ((prev: string[]) => string[])) => void;
  deletePeserta: (nik: string) => void;
}

export const PesertaManagement: React.FC<PesertaManagementProps> = ({
  peserta,
  jenisUjian,
  selectedGroupJenis,
  setSelectedGroupJenis,
  searchTerm,
  setSearchTerm,
  selectedPeserta,
  setSelectedPeserta,
  deletePeserta,
}) => {
  const filteredPeserta = peserta
    .filter(p => selectedGroupJenis === 'all_list' || p.allowed_jenis_id === selectedGroupJenis)
    .filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.nik.includes(searchTerm));

  const filteredNiks = filteredPeserta.map(p => p.nik);
  const allSelected = filteredNiks.length > 0 && filteredNiks.every(n => selectedPeserta.includes(n));

  return (
    <div className="space-y-4">
      {selectedGroupJenis === 'all' ? (
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setSelectedGroupJenis('all_list')}
            className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all text-left group flex items-center gap-4"
          >
            <div className="p-3 bg-[#EADDFF] text-[#21005D] rounded-xl group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[#1C1B1F]">Semua Peserta</h3>
              <p className="text-xs text-[#49454F]">{peserta.length} Peserta Terdaftar</p>
            </div>
            <ChevronRight size={20} className="text-[#CAC4D0]" />
          </button>
          
          {jenisUjian.map(j => (
            <button 
              key={j.id}
              onClick={() => setSelectedGroupJenis(j.id)}
              className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all text-left group flex items-center gap-4"
            >
              <div className="p-3 bg-[#D1E1FF] text-[#001D35] rounded-xl group-hover:scale-110 transition-transform">
                <BookOpen size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#1C1B1F]">{j.nama}</h3>
                <p className="text-xs text-[#49454F]">
                  {peserta.filter(p => p.allowed_jenis_id === j.id).length} Peserta
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
              onClick={() => setSelectedGroupJenis('all')}
              className="text-sm font-bold text-[#6750A4] hover:underline flex items-center gap-1"
            >
              <ChevronLeft size={16} /> Kembali ke Grup
            </button>
            <span className="text-[#49454F]">/</span>
            <span className="text-sm font-bold">
              {selectedGroupJenis === 'all_list' ? 'Semua Peserta' : jenisUjian.find(j => j.id === selectedGroupJenis)?.nama}
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
                  placeholder="Cari Nama atau NIK..."
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
                      setSelectedPeserta(prev => [...new Set([...prev, ...filteredNiks])]);
                    } else {
                      setSelectedPeserta(prev => prev.filter(n => !filteredNiks.includes(n)));
                    }
                  }}
                />
                <span className="text-sm font-medium text-[#49454F]">
                  Pilih Semua ({filteredNiks.length})
                </span>
              </label>
            </div>

            <div className="p-6 space-y-3">
              {filteredPeserta.length === 0 && (
                <div className="text-center py-10 text-[#49454F]">
                  <p>Tidak ada peserta ditemukan.</p>
                </div>
              )}
              {filteredPeserta.map((p) => (
                <div key={p.nik} className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                    checked={selectedPeserta.includes(p.nik)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPeserta(prev => [...prev, p.nik]);
                      } else {
                        setSelectedPeserta(prev => prev.filter(nik => nik !== p.nik));
                      }
                    }}
                  />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#49454F] font-mono">{p.nik}</span>
                      <span className="font-bold text-[#1C1B1F]">{p.nama}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#49454F] uppercase font-bold">Perusahaan</span>
                      <span className="text-sm">{p.perusahaan}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#49454F] uppercase font-bold">Kategori</span>
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-[#EADDFF] text-[#21005D] text-[10px] font-bold">
                          {p.kategori}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#49454F] uppercase font-bold">Jenis Training</span>
                      <span className="text-xs font-bold text-[#6750A4]">
                        {jenisUjian.find(j => j.id === p.allowed_jenis_id)?.nama || '-'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deletePeserta(p.nik)}
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
