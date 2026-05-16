import React from 'react';
import { AdminUser, JenisUjian } from '../../types';

interface ManagementModalsProps {
  // Jenis Ujian
  showAddJenisModal: boolean;
  setShowAddJenisModal: (val: boolean) => void;
  showEditJenisModal: boolean;
  setShowEditJenisModal: (val: boolean) => void;
  editingJenis: any;
  setEditingJenis: (val: any) => void;
  newJenis: any;
  setNewJenis: (val: any) => void;
  handleSaveJenis: (e: React.FormEvent) => void;
  handleUpdateJenis: (e: React.FormEvent) => void;

  // Soal
  showAddSoalModal: boolean;
  setShowAddSoalModal: (val: boolean) => void;
  newSoal: any;
  setNewSoal: (val: any) => void;
  handleSaveSoal: (e: React.FormEvent) => void;
  jenisUjian: JenisUjian[];

  // Peserta
  showAddPesertaModal: boolean;
  setShowAddPesertaModal: (val: boolean) => void;
  newPeserta: any;
  setNewPeserta: (val: any) => void;
  handleSavePeserta: (e: React.FormEvent) => void;
  showUploadPesertaModal: boolean;
  setShowUploadPesertaModal: (val: boolean) => void;
  targetJenisId: string;
  setTargetJenisId: (val: string) => void;
  handleFileUploadPeserta: (file: File) => void;

  // Admin
  showAddAdminModal: boolean;
  setShowAddAdminModal: (val: boolean) => void;
  newAdmin: any;
  setNewAdmin: (val: any) => void;
  handleSaveAdmin: (e: React.FormEvent) => void;
  
  loading: boolean;
}

export const ManagementModals: React.FC<ManagementModalsProps> = (props) => {
  const {
    showAddJenisModal, setShowAddJenisModal,
    showEditJenisModal, setShowEditJenisModal,
    editingJenis, setEditingJenis,
    newJenis, setNewJenis,
    handleSaveJenis, handleUpdateJenis,
    showAddSoalModal, setShowAddSoalModal,
    newSoal, setNewSoal,
    handleSaveSoal, jenisUjian,
    showAddPesertaModal, setShowAddPesertaModal,
    newPeserta, setNewPeserta,
    handleSavePeserta,
    showUploadPesertaModal, setShowUploadPesertaModal,
    targetJenisId, setTargetJenisId,
    handleFileUploadPeserta,
    showAddAdminModal, setShowAddAdminModal,
    newAdmin, setNewAdmin,
    handleSaveAdmin,
    loading
  } = props;

  return (
    <>
      {/* Add Jenis Modal */}
      {showAddJenisModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5] my-auto">
            <h3 className="text-2xl font-bold mb-6">Tambah Jenis Ujian</h3>
            <form onSubmit={handleSaveJenis} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Nama Ujian / Training</label>
                <input 
                  type="text" required
                  value={newJenis.nama}
                  onChange={e => setNewJenis({...newJenis, nama: e.target.value})}
                  placeholder="Contoh: Induksi Karyawan Baru"
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Durasi (Menit)</label>
                <input 
                  type="number" required
                  value={newJenis.timer_minutes}
                  onChange={e => setNewJenis({...newJenis, timer_minutes: parseInt(e.target.value)})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <span className="text-sm font-medium text-[#49454F]">Wajib Pakta Integritas</span>
                <input 
                  type="checkbox" 
                  checked={newJenis.has_commitment}
                  onChange={e => setNewJenis({...newJenis, has_commitment: e.target.checked})}
                  className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]"
                />
              </div>
              {newJenis.has_commitment && (
                <div className="space-y-4 p-4 bg-[#F3F0F5] rounded-2xl">
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Judul Komitmen</label>
                    <input 
                      type="text"
                      value={newJenis.commitment_title}
                      onChange={e => setNewJenis({...newJenis, commitment_title: e.target.value})}
                      className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Isi Komitmen</label>
                    <textarea 
                      value={newJenis.commitment_content}
                      onChange={e => setNewJenis({...newJenis, commitment_content: e.target.value})}
                      rows={3}
                      className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Teks Checkbox Persetujuan</label>
                    <input
                      type="text"
                      value={newJenis.commitment_checkbox_text}
                      onChange={e => setNewJenis({...newJenis, commitment_checkbox_text: e.target.value})}
                      className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Tipe Ujian</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewJenis({...newJenis, tipe_ujian: 'khusus'})}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${newJenis.tipe_ujian === 'khusus' ? 'border-[#6750A4] bg-[#EADDFF]' : 'border-[#E6E1E5] bg-[#F3F0F5]'}`}
                  >
                    <div className="font-bold text-sm text-[#1C1B1F]">🔒 Khusus</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewJenis({...newJenis, tipe_ujian: 'umum'})}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${newJenis.tipe_ujian === 'umum' ? 'border-[#E65100] bg-[#FFF3E0]' : 'border-[#E6E1E5] bg-[#F3F0F5]'}`}
                  >
                    <div className="font-bold text-sm text-[#1C1B1F]">🌐 Umum</div>
                  </button>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddJenisModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]">Batal</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan Jenis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Jenis Modal */}
      {showEditJenisModal && editingJenis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5] my-auto">
            <h3 className="text-2xl font-bold mb-6">Edit Jenis Ujian</h3>
            <form onSubmit={handleUpdateJenis} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Nama Ujian</label>
                <input 
                  type="text" required
                  value={editingJenis.nama}
                  onChange={e => setEditingJenis({...editingJenis, nama: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Durasi (Menit)</label>
                <input 
                  type="number" required
                  value={editingJenis.timer_minutes}
                  onChange={e => setEditingJenis({...editingJenis, timer_minutes: parseInt(e.target.value)})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <span className="text-sm font-medium text-[#49454F]">Wajib Pakta Integritas</span>
                <input 
                  type="checkbox" 
                  checked={editingJenis.has_commitment}
                  onChange={e => setEditingJenis({...editingJenis, has_commitment: e.target.checked})}
                  className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]"
                />
              </div>
              {editingJenis.has_commitment && (
                <div className="space-y-4 p-4 bg-[#F3F0F5] rounded-2xl">
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Judul Komitmen</label>
                    <input 
                      type="text"
                      value={editingJenis.commitment_title}
                      onChange={e => setEditingJenis({...editingJenis, commitment_title: e.target.value})}
                      className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Isi Komitmen</label>
                    <textarea 
                      value={editingJenis.commitment_content}
                      onChange={e => setEditingJenis({...editingJenis, commitment_content: e.target.value})}
                      rows={3}
                      className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Teks Checkbox Persetujuan</label>
                    <input
                      type="text"
                      value={editingJenis.commitment_checkbox_text || ''}
                      onChange={e => setEditingJenis({...editingJenis, commitment_checkbox_text: e.target.value})}
                      className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditJenisModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]">Batal</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Update Jenis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Soal Modal */}
      {showAddSoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl border border-[#E6E1E5] max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Tambah Soal Baru</h3>
            <form onSubmit={handleSaveSoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Jenis Ujian</label>
                <select 
                  required
                  value={newSoal.jenis_ujian_id}
                  onChange={e => setNewSoal({...newSoal, jenis_ujian_id: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                >
                  <option value="">Pilih Jenis Ujian...</option>
                  {jenisUjian.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Pertanyaan</label>
                <textarea 
                  required
                  value={newSoal.pertanyaan}
                  onChange={e => setNewSoal({...newSoal, pertanyaan: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4] h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {['a', 'b', 'c', 'd'].map(opt => (
                  <div key={opt}>
                    <label className="block text-sm font-medium text-[#49454F] mb-1">Pilihan {opt.toUpperCase()}</label>
                    <input type="text" required value={newSoal[`pilihan_${opt}`]} onChange={e => setNewSoal({...newSoal, [`pilihan_${opt}`]: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Jawaban Benar</label>
                <select 
                  value={newSoal.jawaban_benar}
                  onChange={e => setNewSoal({...newSoal, jawaban_benar: e.target.value as any})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                >
                  {['A', 'B', 'C', 'D'].map(opt => <option key={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddSoalModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold">Batal</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold disabled:opacity-50">Simpan Soal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Peserta Modal */}
      {showAddPesertaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-2xl font-bold mb-6">Tambah Peserta Baru</h3>
            <form onSubmit={handleSavePeserta} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">NIK</label>
                <input 
                  type="text" required
                  value={newPeserta.nik}
                  onChange={e => setNewPeserta({...newPeserta, nik: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Nama Lengkap</label>
                <input 
                  type="text" required
                  value={newPeserta.nama}
                  onChange={e => setNewPeserta({...newPeserta, nama: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Perusahaan</label>
                <input 
                  type="text" required
                  value={newPeserta.perusahaan}
                  onChange={e => setNewPeserta({...newPeserta, perusahaan: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddPesertaModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold">Batal</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold disabled:opacity-50">Simpan Peserta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Peserta Modal */}
      {showUploadPesertaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-2xl font-bold mb-6">Upload Peserta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Pilih Jenis Ujian untuk Peserta ini:</label>
                <select 
                  value={targetJenisId}
                  onChange={e => setTargetJenisId(e.target.value)}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                >
                  <option value="">-- Pilih Jenis Ujian --</option>
                  {jenisUjian.map(j => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowUploadPesertaModal(false)}
                  className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    if (!targetJenisId) {
                      alert('Pilih jenis ujian terlebih dahulu');
                      return;
                    }
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.xlsx, .xls';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleFileUploadPeserta(file);
                    };
                    input.click();
                  }}
                  className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B]"
                >
                  Pilih File & Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-2xl font-bold mb-6">Tambah Administrator</h3>
            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Username</label>
                <input 
                  type="text" required
                  value={newAdmin.username}
                  onChange={e => setNewAdmin({...newAdmin, username: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Password</label>
                <input 
                  type="password" required
                  value={newAdmin.password}
                  onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddAdminModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold">Batal</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold disabled:opacity-50">Simpan Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
