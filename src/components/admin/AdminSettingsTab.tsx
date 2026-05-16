import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { AdminUser } from '../../types';
import { LandingConfigEditor } from './LandingConfigEditor';

interface AdminSettingsTabProps {
  admins: AdminUser[];
  admin: AdminUser | null;
  setShowAddAdminModal: (val: boolean) => void;
  setShowSecurityModal: (val: boolean) => void;
  handleExportDatabase: () => void;
  fetchData: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  admins,
  admin,
  setShowAddAdminModal,
  setShowSecurityModal,
  handleExportDatabase,
  fetchData,
}) => {
  const handleDeleteAdmin = async (a: AdminUser) => {
    if (confirm(`Hapus admin ${a.username}?`)) {
      const { error } = await supabase.from('users_admin').delete().eq('id', a.id);
      if (error) {
        alert('Gagal menghapus admin');
      } else {
        fetchData();
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin List */}
      <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#E6E1E5] flex justify-between items-center">
          <h3 className="text-xl font-bold">Daftar Administrator</h3>
          <button 
            onClick={() => setShowAddAdminModal(true)}
            className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]"
          >
            <Plus size={18} /> Tambah Admin
          </button>
        </div>
        <div className="p-8 space-y-4">
          {admins.map(a => (
            <div key={a.id} className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold text-xl">
                  {a.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{a.username}</p>
                  <p className="text-xs text-[#49454F] uppercase tracking-widest">{a.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {a.is_approved ? (
                    <span className="px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-full text-[10px] font-bold">TERVERIFIKASI</span>
                  ) : (
                    <span className="px-3 py-1 bg-[#FFF8E1] text-[#F57F17] rounded-full text-[10px] font-bold">PENDING</span>
                  )}
                </div>
                {admin?.role === 'super_admin' && a.username !== admin.username && (
                  <button 
                    onClick={() => handleDeleteAdmin(a)}
                    className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg transition-all"
                    title="Hapus Admin"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* System Configuration */}
      <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm p-8">
        <h3 className="text-xl font-bold mb-4">Konfigurasi Sistem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-[#E6E1E5] rounded-3xl">
            <h4 className="font-bold mb-2">Backup Data</h4>
            <p className="text-sm text-[#49454F] mb-4">Ekspor seluruh database ke format JSON untuk cadangan.</p>
            <button 
              onClick={handleExportDatabase}
              className="w-full py-3 bg-[#F3F0F5] text-[#1C1B1F] rounded-xl font-bold hover:bg-[#EADDFF] transition-all"
            >
              Ekspor Database
            </button>
          </div>
          <div className="p-6 border border-[#E6E1E5] rounded-3xl">
            <h4 className="font-bold mb-2">Keamanan</h4>
            <p className="text-sm text-[#49454F] mb-4">Atur kebijakan password dan sesi login admin.</p>
            <button 
              onClick={() => setShowSecurityModal(true)}
              className="w-full py-3 bg-[#F3F0F5] text-[#1C1B1F] rounded-xl font-bold hover:bg-[#EADDFF] transition-all"
            >
              Pengaturan Keamanan
            </button>
          </div>
        </div>
      </div>

      {/* Landing Page Editor */}
      <LandingConfigEditor />
    </div>
  );
};
