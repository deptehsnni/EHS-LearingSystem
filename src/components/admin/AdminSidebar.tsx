import React from 'react';
import { 
  Users, 
  FileQuestion, 
  BarChart3, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare,
  Activity,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { AdminUser } from '../../types';

interface AdminSidebarProps {
  admin: AdminUser;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  requests: any[];
  handleLogout: () => void;
  scrollToTop: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  admin,
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  requests,
  handleLogout,
  scrollToTop,
}) => {
  return (
    <>
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E6E1E5] flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-[#E6E1E5]">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            <span className="font-bold text-[#E6A620] text-lg">EHS Learning System</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-[#F3F0F5] rounded-full">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); scrollToTop(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-[#EADDFF] text-[#21005D] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab('live_monitor'); setIsSidebarOpen(false); scrollToTop(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'live_monitor' ? 'bg-[#E0F2F1] text-[#006A6A] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}
          >
            <Activity size={20} /> Live Monitor
          </button>
          <button 
            onClick={() => { setActiveTab('jenis_ujian'); setIsSidebarOpen(false); scrollToTop(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'jenis_ujian' ? 'bg-[#EADDFF] text-[#21005D] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}
          >
            <BookOpen size={20} /> Jenis Ujian
          </button>
          <button 
            onClick={() => { setActiveTab('peserta'); setIsSidebarOpen(false); scrollToTop(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'peserta' ? 'bg-[#EADDFF] text-[#21005D] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}
          >
            <Users size={20} /> Peserta Master
          </button>
          <button 
            onClick={() => { setActiveTab('soal'); setIsSidebarOpen(false); scrollToTop(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'soal' ? 'bg-[#EADDFF] text-[#21005D] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}
          >
            <FileQuestion size={20} /> Bank Soal
          </button>
          <button 
            onClick={() => { setActiveTab('hasil'); setIsSidebarOpen(false); scrollToTop(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'hasil' ? 'bg-[#EADDFF] text-[#21005D] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}
          >
            <BarChart3 size={20} /> Hasil Ujian
          </button>
          <button 
            onClick={() => { setActiveTab('requests'); setIsSidebarOpen(false); scrollToTop(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'requests' ? 'bg-[#EADDFF] text-[#21005D] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}
          >
            <MessageSquare size={20} /> Request Remedial
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-auto bg-[#B3261E] text-white text-[10px] px-2 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); scrollToTop(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-[#EADDFF] text-[#21005D] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}
          >
            <Settings size={20} /> Pengaturan
          </button>
        </nav>

        <div className="p-4 border-t border-[#E6E1E5]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold">
              {admin.username[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{admin.username}</p>
              <p className="text-[10px] text-[#49454F] uppercase tracking-wider">{admin.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[#B3261E] hover:bg-[#F9DEDC] transition-all"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};
