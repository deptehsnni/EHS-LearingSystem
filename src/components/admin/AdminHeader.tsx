import React from 'react';
import { 
  Menu, 
  HelpCircle, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  Table2 
} from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminHeaderProps {
  activeTab: string;
  admin: AdminUser;
  setIsSidebarOpen: (open: boolean) => void;
  selectedJenis: string[];
  selectedPeserta: string[];
  selectedSoal: string[];
  bulkDeleteJenis: () => void;
  bulkDeletePeserta: () => void;
  bulkDeleteSoal: () => void;
  setShowGuideModal: (show: boolean) => void;
  setShowAddJenisModal: (show: boolean) => void;
  downloadTemplatePeserta: () => void;
  setShowUploadPesertaModal: (show: boolean) => void;
  setShowAddPesertaModal: (show: boolean) => void;
  setSelectJenisMode: (mode: 'peserta' | 'soal') => void;
  setShowSelectJenisModal: (show: boolean) => void;
  downloadTemplateSoal: () => void;
  handleFileUploadSoal: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowAddSoalModal: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  admin,
  setIsSidebarOpen,
  selectedJenis,
  selectedPeserta,
  selectedSoal,
  bulkDeleteJenis,
  bulkDeletePeserta,
  bulkDeleteSoal,
  setShowGuideModal,
  setShowAddJenisModal,
  downloadTemplatePeserta,
  setShowUploadPesertaModal,
  setShowAddPesertaModal,
  setSelectJenisMode,
  setShowSelectJenisModal,
  downloadTemplateSoal,
  handleFileUploadSoal,
  setShowAddSoalModal,
  setShowExportModal,
}) => {
  const getTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Dashboard Analytics';
      case 'jenis_ujian': return 'Master Jenis Ujian';
      case 'peserta': return 'Manajemen Peserta';
      case 'soal': return 'Bank Soal';
      case 'hasil': return 'Laporan Hasil Ujian';
      case 'requests': return 'Request Remedial';
      case 'settings': return 'Pengaturan Sistem';
      default: return 'Admin Dashboard';
    }
  };

  return (
    <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 hover:bg-[#F3F0F5] rounded-xl text-[#49454F] transition-colors"
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1C1B1F]">
            {getTitle()}
          </h2>
          <p className="text-sm text-[#49454F]">Selamat datang kembali, {admin.username}.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeTab === 'jenis_ujian' && selectedJenis.length > 0 && (
          <button 
            onClick={bulkDeleteJenis}
            className="bg-[#B3261E] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#8C1D18]"
          >
            <Trash2 size={18} /> Hapus ({selectedJenis.length})
          </button>
        )}
        {activeTab === 'peserta' && selectedPeserta.length > 0 && (
          <button 
            onClick={bulkDeletePeserta}
            className="bg-[#B3261E] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#8C1D18]"
          >
            <Trash2 size={18} /> Hapus ({selectedPeserta.length})
          </button>
        )}
        {activeTab === 'soal' && selectedSoal.length > 0 && (
          <button 
            onClick={bulkDeleteSoal}
            className="bg-[#B3261E] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#8C1D18]"
          >
            <Trash2 size={18} /> Hapus ({selectedSoal.length})
          </button>
        )}

        <button 
          onClick={() => setShowGuideModal(true)}
          className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5]"
        >
          <HelpCircle size={18} /> Panduan
        </button>

        {activeTab === 'jenis_ujian' && (
          <button 
            onClick={() => setShowAddJenisModal(true)}
            className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]"
          >
            <Plus size={18} /> Tambah Jenis
          </button>
        )}

        {activeTab === 'peserta' && (
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={downloadTemplatePeserta}
              className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5]"
            >
              <Download size={18} /> Template
            </button>
            <button 
              onClick={() => setShowUploadPesertaModal(true)}
              className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5]"
            >
              <Upload size={18} /> Upload Excel
            </button>
            <button 
              onClick={() => setShowAddPesertaModal(true)}
              className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]"
            >
              <Plus size={18} /> Tambah Peserta
            </button>
            <button
              onClick={() => { setSelectJenisMode('peserta'); setShowSelectJenisModal(true); }}
              className="bg-[#006A6A] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#004D40]"
            >
              <Table2 size={18} /> Input via Spreadsheet
            </button>
          </div>
        )}

        {activeTab === 'soal' && (
          <div className="flex gap-2 flex-wrap">
            <button 
              onClick={downloadTemplateSoal}
              className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5]"
            >
              <Download size={18} /> Template
            </button>
            <label className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5] cursor-pointer">
              <Upload size={18} /> Upload Excel
              <input 
                type="file" 
                className="hidden" 
                accept=".xlsx, .xls"
                onChange={handleFileUploadSoal}
              />
            </label>
            <button 
              onClick={() => setShowAddSoalModal(true)}
              className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]"
            >
              <Plus size={18} /> Tambah Soal
            </button>
            <button
              onClick={() => { setSelectJenisMode('soal'); setShowSelectJenisModal(true); }}
              className="bg-[#006A6A] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#004D40]"
            >
              <Table2 size={18} /> Input via Spreadsheet
            </button>
          </div>
        )}

        {activeTab === 'hasil' && (
          <button 
            onClick={() => setShowExportModal(true)}
            className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]"
          >
            <Download size={18} /> Export Excel
          </button>
        )}
      </div>
    </header>
  );
};
