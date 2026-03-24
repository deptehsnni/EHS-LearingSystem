import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  Users, 
  FileQuestion, 
  BarChart3, 
  Settings, 
  LogOut, 
  Plus, 
  Download, 
  Trash2, 
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  HelpCircle,
  ClipboardCheck,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Check,
  X,
  Menu,
  Upload,
  Link as LinkIcon,
  Copy,
  QrCode,
  Shield,
  AlertTriangle,
  Table2,
  Save
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { AdminUser, HasilUjian, PesertaMaster } from '../types';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const LandingConfigEditor: React.FC = () => {
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('landing_config').select('*').eq('id', 'main').single()
      .then(({ data }) => {
        if (data) { setJudul(data.judul || ''); setDeskripsi(data.deskripsi || ''); }
        else { setJudul('Induksi & Keselamatan Kerja'); setDeskripsi('Platform ujian induksi keselamatan kerja profesional. Pastikan setiap pekerja memahami standar K3 sebelum memasuki area kerja.'); }
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await supabase.from('landing_config').upsert([{ id: 'main', judul, deskripsi }], { onConflict: 'id' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold">Tampilan Landing Page</h3>
          <p className="text-sm text-[#49454F] mt-1">Edit judul & deskripsi yang tampil di halaman utama peserta</p>
        </div>
        {saved && <span className="text-xs font-bold text-[#2E7D32] bg-[#E8F5E9] px-3 py-1.5 rounded-full">✓ Tersimpan</span>}
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#49454F] mb-2">
            Judul Halaman <span className="text-[#9CA3AF] text-xs">(gunakan & untuk bagian yang diwarnai kuning)</span>
          </label>
          <input
            type="text"
            value={judul}
            onChange={e => setJudul(e.target.value)}
            placeholder="Contoh: Induksi & Keselamatan Kerja"
            className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4] text-sm"
          />
          {judul && (
            <div className="mt-2 p-3 bg-[#0F0F0F] rounded-xl">
              <p className="text-xs text-[#6B7280] mb-1 uppercase tracking-wider">Preview:</p>
              <p className="text-white font-black text-lg leading-tight">
                {judul.includes('&') ? (
                  <>{judul.split('&')[0].trim()} & <span className="text-[#E6A620]">{judul.split('&')[1]?.trim()}</span></>
                ) : (
                  <span className="text-[#E6A620]">{judul}</span>
                )}
              </p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#49454F] mb-2">Deskripsi</label>
          <textarea
            value={deskripsi}
            onChange={e => setDeskripsi(e.target.value)}
            rows={3}
            placeholder="Deskripsi singkat sistem..."
            className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4] text-sm resize-none"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={loading || !judul || !deskripsi}
          className="w-full py-3 bg-[#6750A4] text-white rounded-xl font-bold hover:bg-[#4F378B] transition-all disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'peserta' | 'soal' | 'hasil' | 'settings' | 'jenis_ujian' | 'requests'>('overview');
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [results, setResults] = useState<HasilUjian[]>([]);
  const [peserta, setPeserta] = useState<PesertaMaster[]>([]);
  const [jenisUjian, setJenisUjian] = useState<any[]>([]);
  const [soal, setSoal] = useState<any[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [persistentStats, setPersistentStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [dashboardFilterJenis, setDashboardFilterJenis] = useState<string | 'all'>('all');
  const [showDashboardSettings, setShowDashboardSettings] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [dashboardConfig, setDashboardConfig] = useState({
    showPieChart: true,
    showBarChartMonth: true,
    showBarChartYear: true,
    compactMode: false
  });

  const [showQRModal, setShowQRModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [qrData, setQrData] = useState<{url: string, name: string} | null>(null);
  const [viewingQuestionsJenis, setViewingQuestionsJenis] = useState<any>(null);
  const [selectedGroupJenis, setSelectedGroupJenis] = useState<string | 'all'>('all');
  const [selectedSoalGroupJenis, setSelectedSoalGroupJenis] = useState<string | 'all'>('all');

  const [selectedJenis, setSelectedJenis] = useState<string[]>([]);
  const [selectedPeserta, setSelectedPeserta] = useState<string[]>([]);
  const [selectedSoal, setSelectedSoal] = useState<string[]>([]);

  const [showHasilDetail, setShowHasilDetail] = useState(false);
  const [selectedHasilJenis, setSelectedHasilJenis] = useState<string | null>(null);
  const [selectedHasilDate, setSelectedHasilDate] = useState<string | null>(null);
  const [showCheatingModal, setShowCheatingModal] = useState(false);
  const [selectedResultForCheating, setSelectedResultForCheating] = useState<HasilUjian | null>(null);
  const [notification, setNotification] = useState<{
    id: string;
    nama: string;
    nik: string;
    jenis: string;
    show: boolean;
  } | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    jenis_id: 'all',
    period: 'all' as 'all' | 'daily' | 'monthly' | 'yearly',
    value: ''
  });

  const [showConfirmModal, setShowConfirmModal] = useState<{show: boolean, title: string, message: string, onConfirm: () => void}>({
    show: false, title: '', message: '', onConfirm: () => {}
  });
  const [showEditJenisModal, setShowEditJenisModal] = useState(false);
  const [showAddJenisModal, setShowAddJenisModal] = useState(false);
  const [editingJenis, setEditingJenis] = useState<any>(null);
  const [newJenis, setNewJenis] = useState({
    nama: '',
    timer_minutes: 30,
    has_commitment: true,
    is_active: true,
    limit_one_per_day: false,
    soal_display_count: 20,
    passing_score: 70,
    commitment_title: 'Pakta Integritas',
    commitment_content: 'Dengan ini saya menyatakan bahwa saya akan mengerjakan ujian ini dengan jujur dan tidak akan melakukan kecurangan dalam bentuk apapun.',
    commitment_checkbox_text: 'Saya telah mengisi data dengan benar dan menyetujui pakta integritas.'
  });

  const [showUploadPesertaModal, setShowUploadPesertaModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [targetJenisId, setTargetJenisId] = useState('');

  const copyExamLink = (id: string) => {
    const url = `${window.location.origin}/?exam=${id}`;
    navigator.clipboard.writeText(url);
    alert('Link ujian berhasil disalin!');
  };

  const handleShowQR = (j: any) => {
    const url = `${window.location.origin}/?exam=${j.id}`;
    setQrData({ url, name: j.nama });
    setShowQRModal(true);
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR_Ujian_${qrData?.name.replace(/\s+/g, '_')}.png`;
      link.href = url;
      link.click();
    }
  };

  const [showAddPesertaModal, setShowAddPesertaModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guidePage, setGuidePage] = useState<string>('alur');
  const [showSpreadsheetPeserta, setShowSpreadsheetPeserta] = useState(false);
  const [showSpreadsheetSoal, setShowSpreadsheetSoal] = useState(false);
  const [spreadsheetJenisId, setSpreadsheetJenisId] = useState('');
  const [showSelectJenisModal, setShowSelectJenisModal] = useState(false);
  const [selectJenisMode, setSelectJenisMode] = useState<'peserta' | 'soal'>('peserta');
  const emptyPesertaRow = () => ({ nik: '', nama: '', perusahaan: '', kategori: 'Karyawan' });
  const emptySoalRow = () => ({ pertanyaan: '', pilihan_a: '', pilihan_b: '', pilihan_c: '', pilihan_d: '', jawaban_benar: 'A' });
  const [spreadsheetPesertaRows, setSpreadsheetPesertaRows] = useState<any[]>(Array.from({length: 10}, emptyPesertaRow));
  const [spreadsheetSoalRows, setSpreadsheetSoalRows] = useState<any[]>(Array.from({length: 10}, emptySoalRow));
  const [savingSpreadsheet, setSavingSpreadsheet] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkKategori, setBulkKategori] = useState('');
  const [anchorRow, setAnchorRow] = useState<number|null>(null);
  const isDraggingRef = React.useRef(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'admin' as any });
  const [newPeserta, setNewPeserta] = useState({
    nik: '', nama: '', perusahaan: '', kategori: 'Karyawan' as any, allowed_jenis_id: ''
  });
  const [showAddSoalModal, setShowAddSoalModal] = useState(false);
  const [newSoal, setNewSoal] = useState({
    jenis_ujian_id: '', pertanyaan: '', pilihan_a: '', pilihan_b: '', pilihan_c: '', pilihan_d: '', jawaban_benar: 'A' as any
  });

  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('ehs_admin');
    if (!stored) { navigate('/admin/login'); return; }
    setAdmin(JSON.parse(stored));
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const channel = supabase
      .channel('remedial_requests_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'remedial_requests' }, (payload) => {
        const newReq = payload.new;
        const jenisName = jenisUjian.find(j => j.id === newReq.jenis_ujian_id)?.nama || 'Ujian';
        setNotification({ id: newReq.id, nama: newReq.nama, nik: newReq.nik, jenis: jenisName, show: true });
        fetchData();
        setTimeout(() => setNotification(null), 5000);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [jenisUjian]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: resData } = await supabase.from('hasil_ujian').select('*').order('waktu_selesai', { ascending: false });
      const { data: pesData } = await supabase.from('peserta_master').select('*');
      const { data: jenisData } = await supabase.from('jenis_ujian').select('*');
      const { data: soalData } = await supabase.from('soal').select('*');
      const { data: adminData } = await supabase.from('users_admin').select('*');
      const { data: reqData } = await supabase.from('remedial_requests').select('*').order('created_at', { ascending: false });
      const { data: statData } = await supabase.from('persistent_stats').select('*');
      if (resData) setResults(resData);
      if (pesData) setPeserta(pesData);
      if (jenisData) setJenisUjian(jenisData);
      if (soalData) setSoal(soalData);
      if (adminData) setAdmins(adminData);
      if (reqData) setRequests(reqData);
      if (statData) setPersistentStats(statData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleSaveJenis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('jenis_ujian').insert([{
        ...newJenis,
        timer_minutes: newJenis.limit_one_per_day ? -Math.abs(newJenis.timer_minutes) : Math.abs(newJenis.timer_minutes),
        soal_display_count: newJenis.soal_display_count,
        passing_score: newJenis.passing_score,
        created_by: admin?.username
      }]);
      if (error) throw error;
      setShowAddJenisModal(false);
      setNewJenis({ nama: '', timer_minutes: 30, has_commitment: true, is_active: true, limit_one_per_day: false, soal_display_count: 20, passing_score: 70, commitment_title: 'Pakta Integritas', commitment_content: 'Dengan ini saya menyatakan bahwa saya akan mengerjakan ujian ini dengan jujur dan tidak akan melakukan kecurangan dalam bentuk apapun.', commitment_checkbox_text: 'Saya telah mengisi data dengan benar dan menyetujui pakta integritas.' });
      fetchData();
    } catch (err) { console.error(err); alert('Gagal menyimpan jenis ujian'); }
    finally { setLoading(false); }
  };

  const handleSavePeserta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (peserta.some(p => p.nik === newPeserta.nik)) {
      alert(`Gagal menyimpan: NIK ${newPeserta.nik} sudah terdaftar di database.`);
      return;
    }
    setLoading(true);
    try {
      const dataToSave = { ...newPeserta, allowed_jenis_id: newPeserta.allowed_jenis_id || null };
      const { error } = await supabase.from('peserta_master').insert([dataToSave]);
      if (error) throw error;
      await supabase.rpc('increment_stat', { stat_id: 'total_peserta' });
      setShowAddPesertaModal(false);
      setNewPeserta({ nik: '', nama: '', perusahaan: '', kategori: 'Karyawan', allowed_jenis_id: '' });
      fetchData();
      scrollToTop();
      alert('Peserta berhasil disimpan!');
    } catch (err: any) {
      alert(`Gagal menyimpan peserta: ${err.message || 'Terjadi kesalahan.'}`);
    } finally { setLoading(false); }
  };

  const handleSaveSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('soal').insert([newSoal]);
      if (error) throw error;
      setShowAddSoalModal(false);
      scrollToTop();
      setNewSoal({ jenis_ujian_id: '', pertanyaan: '', pilihan_a: '', pilihan_b: '', pilihan_c: '', pilihan_d: '', jawaban_benar: 'A' });
      fetchData();
    } catch (err) { console.error(err); alert('Gagal menyimpan soal.'); }
    finally { setLoading(false); }
  };

  const deletePeserta = async (nik: string) => {
    setShowConfirmModal({
      show: true,
      title: 'Hapus Peserta',
      message: 'Apakah Anda yakin ingin menghapus peserta ini? Data hasil ujian akan tetap tersimpan.',
      onConfirm: async () => {
        try {
          await supabase.from('remedial_requests').delete().eq('nik', nik);
          const { error } = await supabase.from('peserta_master').delete().eq('nik', nik);
          if (error) {
            alert('Gagal menghapus peserta: ' + error.message);
          } else {
            fetchData();
          }
        } catch (err: any) {
          alert('Terjadi kesalahan: ' + (err.message || 'Gagal menghapus peserta'));
        } finally {
          setShowConfirmModal(prev => ({ ...prev, show: false }));
        }
      }
    });
  };

  const deleteSoal = async (id: string) => {
    setShowConfirmModal({
      show: true,
      title: 'Hapus Soal',
      message: 'Apakah Anda yakin ingin menghapus soal ini?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('soal').delete().eq('id', id);
          if (error) { alert('Gagal menghapus soal: ' + error.message); } else { fetchData(); }
        } catch (err: any) {
          alert('Terjadi kesalahan: ' + (err.message || 'Gagal menghapus soal'));
        } finally { setShowConfirmModal(prev => ({ ...prev, show: false })); }
      }
    });
  };

  const deleteHasil = async (hasilId: string) => {
    setShowConfirmModal({
      show: true,
      title: 'Hapus Hasil Ujian',
      message: 'Apakah Anda yakin ingin menghapus data hasil ujian ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('hasil_ujian').delete().eq('id', hasilId);
          if (error) { alert('Gagal menghapus hasil ujian: ' + error.message); } else { fetchData(); }
        } catch (err: any) {
          alert('Terjadi kesalahan: ' + (err.message || 'Gagal menghapus hasil ujian'));
        } finally { setShowConfirmModal(prev => ({ ...prev, show: false })); }
      }
    });
  };

  const toggleJenisStatus = async (id: string, currentStatus: boolean) => {
    setJenisUjian(prev => prev.map(j => j.id === id ? { ...j, is_active: !currentStatus } : j));
    try {
      const { error } = await supabase.from('jenis_ujian').update({ is_active: !currentStatus }).eq('id', id);
      if (error) {
        setJenisUjian(prev => prev.map(j => j.id === id ? { ...j, is_active: currentStatus } : j));
        console.error(error);
      } else { fetchData(); }
    } catch (err) {
      setJenisUjian(prev => prev.map(j => j.id === id ? { ...j, is_active: currentStatus } : j));
      console.error(err);
    }
  };

  const handleEditJenis = (jenis: any) => {
    setEditingJenis({
      ...jenis,
      timer_minutes: Math.abs(jenis.timer_minutes),
      limit_one_per_day: jenis.timer_minutes < 0,
      soal_display_count: jenis.soal_display_count || 20,
      passing_score: jenis.passing_score || 70,
      commitment_title: jenis.commitment_title || 'Pakta Integritas',
      commitment_content: jenis.commitment_content || 'Dengan ini saya menyatakan bahwa saya akan mengerjakan ujian ini dengan jujur dan tidak akan melakukan kecurangan dalam bentuk apapun.',
      commitment_checkbox_text: jenis.commitment_checkbox_text || 'Saya telah mengisi data dengan benar dan menyetujui pakta integritas.'
    });
    setShowEditJenisModal(true);
  };

  const handleResetData = () => { setResetPasswordInput(''); setResetPasswordError(''); setShowResetConfirmModal(true); };

  const handleConfirmReset = async () => {
    const { data: adminData } = await supabase.from('users_admin').select('password_hash').eq('id', admin?.id).single();
    if (!adminData || adminData.password_hash !== resetPasswordInput) {
      setResetPasswordError('Password salah. Reset dibatalkan.');
      return;
    }
    setShowResetConfirmModal(false);
    setLoading(true);
    try {
      await supabase.from('remedial_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('hasil_ujian').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('soal').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('jenis_ujian').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('peserta_master').delete().neq('nik', '0');
      await supabase.from('persistent_stats').update({ count: 0 }).neq('id', '');
      alert('Seluruh data berhasil direset.');
      fetchData();
      setShowDashboardSettings(false);
    } catch (err) { console.error(err); alert('Gagal mereset data.'); }
    finally { setLoading(false); }
  };

  const handleExportDatabase = async () => {
    setLoading(true);
    try {
      const tables = ['users_admin', 'peserta_master', 'jenis_ujian', 'soal', 'hasil_ujian', 'remedial_requests', 'persistent_stats'];
      const backup: Record<string, any> = {};
      for (const table of tables) {
        const { data } = await supabase.from(table).select('*');
        backup[table] = data;
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_database_${format(new Date(), 'yyyyMMdd_HHmm')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('Gagal melakukan backup database'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('users_admin').update({ password_hash: newPassword }).eq('id', admin?.id);
      if (error) throw error;
      alert('Password berhasil diperbarui');
      setShowSecurityModal(false);
      setNewPassword('');
    } catch (err) { console.error(err); alert('Gagal memperbarui password'); }
    finally { setLoading(false); }
  };

  const handleUpdateJenis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('jenis_ujian').update({
        nama: editingJenis.nama,
        timer_minutes: editingJenis.limit_one_per_day ? -Math.abs(editingJenis.timer_minutes) : Math.abs(editingJenis.timer_minutes),
        has_commitment: editingJenis.has_commitment,
        is_active: editingJenis.is_active,
        limit_one_per_day: editingJenis.limit_one_per_day,
        soal_display_count: editingJenis.soal_display_count,
        passing_score: editingJenis.passing_score,
        commitment_title: editingJenis.commitment_title,
        commitment_content: editingJenis.commitment_content,
        commitment_checkbox_text: editingJenis.commitment_checkbox_text
      }).eq('id', editingJenis.id);
      if (error) throw error;
      setShowEditJenisModal(false);
      fetchData();
    } catch (err) { console.error(err); alert('Gagal memperbarui jenis ujian'); }
    finally { setLoading(false); }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from('remedial_requests').update({ status: 'approved' }).eq('id', requestId);
      if (error) throw error;
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from('remedial_requests').update({ status: 'rejected' }).eq('id', requestId);
      if (error) throw error;
      fetchData();
    } catch (err) { console.error(err); }
  };

  const bulkDeleteJenis = async () => {
    setShowConfirmModal({
      show: true,
      title: 'Hapus Jenis Ujian',
      message: `Apakah Anda yakin ingin menghapus ${selectedJenis.length} jenis ujian terpilih?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('jenis_ujian').delete().in('id', selectedJenis);
          if (error) throw error;
          setSelectedJenis([]);
          fetchData();
          setShowConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err) { console.error(err); }
      }
    });
  };

  const bulkDeletePeserta = async () => {
    setShowConfirmModal({
      show: true,
      title: 'Hapus Peserta',
      message: `Apakah Anda yakin ingin menghapus ${selectedPeserta.length} peserta terpilih? Data hasil ujian akan tetap tersimpan.`,
      onConfirm: async () => {
        try {
          await supabase.from('remedial_requests').delete().in('nik', selectedPeserta);
          const { error } = await supabase.from('peserta_master').delete().in('nik', selectedPeserta);
          if (error) throw error;
          setSelectedPeserta([]);
          fetchData();
          setShowConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err: any) {
          console.error(err);
          alert('Gagal menghapus peserta: ' + err.message);
        }
      }
    });
  };

  const bulkDeleteSoal = async () => {
    setShowConfirmModal({
      show: true,
      title: 'Hapus Soal',
      message: `Apakah Anda yakin ingin menghapus ${selectedSoal.length} soal terpilih?`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('soal').delete().in('id', selectedSoal);
          if (error) throw error;
          setSelectedSoal([]);
          fetchData();
          setShowConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err) { console.error(err); }
      }
    });
  };

  const downloadTemplatePeserta = () => {
    const template = [
      { NIK: '1234567890', Nama: 'Budi Santoso', Perusahaan: 'PT Maju Jaya', Kategori: 'Karyawan', 'Jenis Ujian': jenisUjian[0]?.nama || 'Induksi Karyawan' },
      { NIK: '0987654321', Nama: 'Siti Aminah', Perusahaan: 'PT Sejahtera', Kategori: 'Magang', 'Jenis Ujian': jenisUjian[0]?.nama || 'Induksi Karyawan' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Peserta');
    XLSX.writeFile(wb, 'Template_Upload_Peserta.xlsx');
  };

  const downloadTemplateSoal = () => {
    const template = [{ 'Nama Jenis Ujian': jenisUjian[0]?.nama || 'CONTOH: Karyawan Baru', Pertanyaan: 'Apa kepanjangan dari K3?', 'Pilihan A': 'Keselamatan dan Kesehatan Kerja', 'Pilihan B': 'Kesehatan dan Keselamatan Kerja', 'Pilihan C': 'Keamanan dan Kesehatan Kerja', 'Pilihan D': 'Kerapihan dan Kebersihan Kerja', 'Jawaban Benar (A/B/C/D)': 'A' }];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');
    XLSX.writeFile(wb, 'Template_Upload_Soal.xlsx');
  };

  const handleFileUploadPeserta = async (file?: File) => {
    const fileToUpload = file || uploadFile;
    if (!fileToUpload) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        const formattedData = data.map(row => {
          const namaJenis = row['Jenis Ujian'] || row.jenis_ujian;
          const jenis = jenisUjian.find(j => j.nama.toLowerCase() === String(namaJenis).toLowerCase());
          return { nik: String(row.NIK || row.nik), nama: row.Nama || row.nama, perusahaan: row.Perusahaan || row.perusahaan, kategori: row.Kategori || row.kategori || 'Karyawan', allowed_jenis_id: targetJenisId || jenis?.id || null };
        });
        const { error } = await supabase.from('peserta_master').upsert(formattedData, { onConflict: 'nik' });
        if (error) throw error;
        alert(`${formattedData.length} data peserta berhasil diunggah/diperbarui!`);
        setShowUploadPesertaModal(false);
        setUploadFile(null);
        setTargetJenisId('');
        fetchData();
      } catch (err: any) {
        const msg = err?.message || '';
        if (msg.includes('duplicate') || msg.includes('unique')) {
          alert('Gagal: Terdapat NIK duplikat di file.');
        } else {
          alert('Gagal mengunggah data. Detail: ' + msg);
        }
      } finally { setLoading(false); }
    };
    reader.readAsBinaryString(fileToUpload);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('users_admin').insert([{ username: newAdmin.username, password_hash: newAdmin.password, role: newAdmin.role, is_approved: true }]);
      if (error) throw error;
      setShowAddAdminModal(false);
      setNewAdmin({ username: '', password: '', role: 'admin' });
      fetchData();
    } catch (err) { console.error(err); alert('Gagal menyimpan admin.'); }
    finally { setLoading(false); }
  };

  const handleSaveSpreadsheetPeserta = async () => {
    const validRows = spreadsheetPesertaRows.filter(r => r.nik && r.nama && r.perusahaan);
    if (validRows.length === 0) { alert('Tidak ada data valid.'); return; }
    setSavingSpreadsheet(true);
    try {
      const data = validRows.map(r => ({ nik: String(r.nik).trim(), nama: String(r.nama).trim(), perusahaan: String(r.perusahaan).trim(), kategori: r.kategori || 'Karyawan', allowed_jenis_id: spreadsheetJenisId || null }));
      const { error } = await supabase.from('peserta_master').upsert(data, { onConflict: 'nik' });
      if (error) throw error;
      alert(`${validRows.length} peserta berhasil disimpan!`);
      setShowSpreadsheetPeserta(false);
      scrollToTop();
      setSpreadsheetPesertaRows(Array.from({length: 10}, emptyPesertaRow));
      setSpreadsheetJenisId('');
      fetchData();
    } catch (err: any) { alert('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan')); }
    finally { setSavingSpreadsheet(false); }
  };

  const handleSaveSpreadsheetSoal = async () => {
    const validRows = spreadsheetSoalRows.filter(r => r.pertanyaan && r.pilihan_a && r.pilihan_b && r.pilihan_c && r.pilihan_d && r.jawaban_benar);
    if (validRows.length === 0) { alert('Tidak ada data valid.'); return; }
    if (!spreadsheetJenisId) { alert('Pilih jenis ujian terlebih dahulu.'); return; }
    setSavingSpreadsheet(true);
    try {
      const data = validRows.map(r => ({ jenis_ujian_id: spreadsheetJenisId, pertanyaan: String(r.pertanyaan).trim(), pilihan_a: String(r.pilihan_a).trim(), pilihan_b: String(r.pilihan_b).trim(), pilihan_c: String(r.pilihan_c).trim(), pilihan_d: String(r.pilihan_d).trim(), jawaban_benar: String(r.jawaban_benar).toUpperCase().trim() }));
      const { error } = await supabase.from('soal').insert(data);
      if (error) throw error;
      alert(`${validRows.length} soal berhasil disimpan!`);
      setShowSpreadsheetSoal(false);
      scrollToTop();
      setSpreadsheetSoalRows(Array.from({length: 10}, emptySoalRow));
      setSpreadsheetJenisId('');
      fetchData();
    } catch (err: any) { alert('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan')); }
    finally { setSavingSpreadsheet(false); }
  };

  const handleLogout = () => { localStorage.removeItem('ehs_admin'); navigate('/admin/login'); };

  const handleFileUploadSoal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        const formattedData = data.map(row => {
          const namaJenis = row['Nama Jenis Ujian'] || row.nama_jenis;
          const jenis = jenisUjian.find(j => j.nama.toLowerCase() === String(namaJenis).toLowerCase());
          return { jenis_ujian_id: jenis?.id || row.jenis_ujian_id, pertanyaan: row.Pertanyaan || row.pertanyaan, pilihan_a: row['Pilihan A'] || row.pilihan_a, pilihan_b: row['Pilihan B'] || row.pilihan_b, pilihan_c: row['Pilihan C'] || row.pilihan_c, pilihan_d: row['Pilihan D'] || row.pilihan_d, jawaban_benar: row['Jawaban Benar (A/B/C/D)'] || row.jawaban_benar };
        }).filter(item => item.jenis_ujian_id);
        if (formattedData.length === 0) throw new Error('Tidak ada data valid atau Nama Jenis Ujian tidak ditemukan.');
        const { error } = await supabase.from('soal').insert(formattedData);
        if (error) throw error;
        alert('Data soal berhasil diunggah!');
        fetchData();
      } catch (err) { alert('Gagal mengunggah data. ' + (err instanceof Error ? err.message : '')); }
    };
    reader.readAsBinaryString(file);
  };

  const performExport = () => {
    let filtered = [...results];
    if (exportFilters.jenis_id !== 'all') filtered = filtered.filter(r => r.jenis_ujian_id === exportFilters.jenis_id);
    if (exportFilters.period !== 'all') {
      if (!exportFilters.value) { alert('Silakan pilih periode terlebih dahulu'); return; }
      filtered = filtered.filter(r => {
        const d = new Date(r.waktu_selesai);
        if (exportFilters.period === 'daily') return format(d, 'yyyy-MM-dd') === exportFilters.value;
        else if (exportFilters.period === 'monthly') return format(d, 'yyyy-MM') === exportFilters.value;
        else if (exportFilters.period === 'yearly') return format(d, 'yyyy') === exportFilters.value;
        return true;
      });
    }
    if (filtered.length === 0) { alert('Data tidak ditemukan.'); return; }
    const exportData = filtered.map(r => ({
      'Waktu Selesai': format(new Date(r.waktu_selesai), 'dd/MM/yyyy HH:mm'),
      'Jenis Ujian': jenisUjian.find(j => j.id === r.jenis_ujian_id)?.nama || '-',
      'Nilai': r.nilai, 'Status Lulus': r.status_lulus ? 'LULUS' : 'TIDAK LULUS',
      'Nama': r.nama, 'NIK': r.nik,
      'Perusahaan': r.perusahaan || peserta.find(p => p.nik === r.nik)?.perusahaan || '-',
      'Status Perkawinan': r.profil_data.status || '-', 'Agama': r.profil_data.agama || '-',
      'Tanggal Lahir': r.profil_data.tanggalLahir || '-', 'Pendidikan': r.profil_data.pendidikan || '-',
      'Kontak Darurat': r.profil_data.kontakDarurat || '-',
      'Pindah Tab': r.profil_data.tab_violations || 0,
      'Upaya Screenshot': r.profil_data.screenshot_violations || 0,
      'Upaya Copy': r.profil_data.copy_violations || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Ujian');
    let filename = 'EHS_Results';
    if (exportFilters.period !== 'all') filename += `_${exportFilters.value}`;
    XLSX.writeFile(wb, `${filename}.xlsx`);
    setShowExportModal(false);
  };

  const stats = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    const totalAttempts = filteredResults.length;
    const totalLulus = filteredResults.filter(r => r.status_lulus).length;
    const lulusRate = totalAttempts > 0 ? Math.round((totalLulus / totalAttempts) * 100) : 0;
    const avgNilai = totalAttempts > 0 ? Math.round(filteredResults.reduce((sum, r) => sum + r.nilai, 0) / totalAttempts) : 0;
    const now = new Date();
    const thisMonth = filteredResults.filter(r => { const d = new Date(r.waktu_selesai); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const lastMonth = filteredResults.filter(r => { const d = new Date(r.waktu_selesai); const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); });
    const thisMonthLulusRate = thisMonth.length > 0 ? Math.round((thisMonth.filter(r => r.status_lulus).length / thisMonth.length) * 100) : 0;
    const lastMonthLulusRate = lastMonth.length > 0 ? Math.round((lastMonth.filter(r => r.status_lulus).length / lastMonth.length) * 100) : 0;
    return { totalUjianSistem: jenisUjian.length, lulusRate, totalAttempts, avgNilai, trendLulus: thisMonthLulusRate - lastMonthLulusRate, thisMonthCount: thisMonth.length };
  }, [results, jenisUjian, dashboardFilterJenis]);

  const pieData = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    const kategoriBucket: Record<string, number> = { Karyawan: 0, Magang: 0, Visitor: 0, Kontraktor: 0 };
    filteredResults.forEach(r => {
      const kat = peserta.find(p => p.nik === r.nik)?.kategori || (r.profil_data as any)?.kategori;
      if (kat && kategoriBucket[kat] !== undefined) kategoriBucket[kat]++;
      else if (kat) kategoriBucket[kat] = (kategoriBucket[kat] || 0) + 1;
    });
    return Object.entries(kategoriBucket).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [results, peserta, dashboardFilterJenis]);

  const barChartMonthData = useMemo(() => {
    const now = new Date();
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    return ['Minggu 1','Minggu 2','Minggu 3','Minggu 4'].map((name, i) => ({
      name, val: filteredResults.filter(r => {
        const d = new Date(r.waktu_selesai);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        const day = d.getDate();
        if (i === 0) return day <= 7; if (i === 1) return day > 7 && day <= 14;
        if (i === 2) return day > 14 && day <= 21; return day > 21;
      }).length
    }));
  }, [results, dashboardFilterJenis]);

  const barChartYearData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    return ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'].map((name, i) => ({
      name, val: filteredResults.filter(r => { const d = new Date(r.waktu_selesai); return d.getFullYear() === currentYear && d.getMonth() === i; }).length
    }));
  }, [results, dashboardFilterJenis]);

  const COLORS = ['#6750A4', '#006A6A', '#B3261E', '#F57F17'];

  if (!admin) return null;
  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      {/* Sidebar */}
      <aside className={clsx(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E6E1E5] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen shadow-xl lg:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-[#E6E1E5]">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            <span className="font-bold text-[#E6A620] text-lg">EHS Learning System</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-[#F3F0F5] rounded-full"><X size={20} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { tab: 'overview', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
            { tab: 'jenis_ujian', icon: <BookOpen size={20} />, label: 'Jenis Ujian' },
            { tab: 'peserta', icon: <Users size={20} />, label: 'Peserta Master' },
            { tab: 'soal', icon: <FileQuestion size={20} />, label: 'Bank Soal' },
            { tab: 'hasil', icon: <BarChart3 size={20} />, label: 'Hasil Ujian' },
            { tab: 'settings', icon: <Settings size={20} />, label: 'Pengaturan' },
          ].map(item => (
            <button key={item.tab}
              onClick={() => { setActiveTab(item.tab as any); setIsSidebarOpen(false); scrollToTop(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.tab ? 'bg-[#EADDFF] text-[#21005D] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}>
              {item.icon} {item.label}
            </button>
          ))}
          <button
            onClick={() => { setActiveTab('requests'); setIsSidebarOpen(false); scrollToTop(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'requests' ? 'bg-[#EADDFF] text-[#21005D] font-bold' : 'text-[#49454F] hover:bg-[#F3F0F5]'}`}>
            <MessageSquare size={20} /> Request Remedial
            {requests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-auto bg-[#B3261E] text-white text-[10px] px-2 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
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
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-[#B3261E] hover:bg-[#F9DEDC] transition-all">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div
        className={clsx("fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300", isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-[#F3F0F5] rounded-xl text-[#49454F]"><Menu size={24} /></button>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1C1B1F]">
                {activeTab === 'overview' && 'Dashboard Analytics'}
                {activeTab === 'jenis_ujian' && 'Master Jenis Ujian'}
                {activeTab === 'peserta' && 'Manajemen Peserta'}
                {activeTab === 'soal' && 'Bank Soal'}
                {activeTab === 'hasil' && 'Laporan Hasil Ujian'}
                {activeTab === 'requests' && 'Request Remedial'}
                {activeTab === 'settings' && 'Pengaturan Sistem'}
              </h2>
              <p className="text-sm text-[#49454F]">Selamat datang kembali, {admin.username}.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab === 'jenis_ujian' && selectedJenis.length > 0 && (
              <button onClick={bulkDeleteJenis} className="bg-[#B3261E] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#8C1D18]">
                <Trash2 size={18} /> Hapus ({selectedJenis.length})
              </button>
            )}
            {activeTab === 'peserta' && selectedPeserta.length > 0 && (
              <button onClick={bulkDeletePeserta} className="bg-[#B3261E] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#8C1D18]">
                <Trash2 size={18} /> Hapus ({selectedPeserta.length})
              </button>
            )}
            {activeTab === 'soal' && selectedSoal.length > 0 && (
              <button onClick={bulkDeleteSoal} className="bg-[#B3261E] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#8C1D18]">
                <Trash2 size={18} /> Hapus ({selectedSoal.length})
              </button>
            )}
            <button onClick={() => setShowGuideModal(true)} className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5]">
              <HelpCircle size={18} /> Panduan
            </button>
            {activeTab === 'jenis_ujian' && (
              <button onClick={() => setShowAddJenisModal(true)} className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]">
                <Plus size={18} /> Tambah Jenis
              </button>
            )}
            {activeTab === 'peserta' && (
              <div className="flex gap-2">
                <button onClick={downloadTemplatePeserta} className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5]"><Download size={18} /> Template</button>
                <button onClick={() => setShowUploadPesertaModal(true)} className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5]"><Upload size={18} /> Upload Excel</button>
                <button onClick={() => setShowAddPesertaModal(true)} className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]"><Plus size={18} /> Tambah Peserta</button>
                <button onClick={() => { setSelectJenisMode('peserta'); setShowSelectJenisModal(true); }} className="bg-[#006A6A] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#004D40]"><Table2 size={18} /> Input via Spreadsheet</button>
              </div>
            )}
            {activeTab === 'soal' && (
              <div className="flex gap-2">
                <button onClick={downloadTemplateSoal} className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5]"><Download size={18} /> Template</button>
                <label className="bg-white border border-[#E6E1E5] px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-[#F3F0F5] cursor-pointer">
                  <Upload size={18} /> Upload Excel
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUploadSoal} />
                </label>
                <button onClick={() => setShowAddSoalModal(true)} className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]"><Plus size={18} /> Tambah Soal</button>
                <button onClick={() => { setSelectJenisMode('soal'); setShowSelectJenisModal(true); }} className="bg-[#006A6A] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#004D40]"><Table2 size={18} /> Input via Spreadsheet</button>
              </div>
            )}
            {activeTab === 'hasil' && (
              <button onClick={() => setShowExportModal(true)} className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]">
                <Download size={18} /> Export Excel
              </button>
            )}
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-[28px] p-6 md:p-8"
              style={{ background: 'linear-gradient(135deg, #1A0533 0%, #2D1254 40%, #0F2A2A 100%)' }}>
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #E6A620 0%, transparent 70%)' }} />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#E6A620' }}>EHS Learning System</p>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">Dashboard Analitik</h2>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {dashboardFilterJenis === 'all' ? 'Menampilkan data seluruh jenis ujian' : `Filter aktif: ${jenisUjian.find(j => j.id === dashboardFilterJenis)?.nama || ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#E6A620' }}>Filter Jenis Ujian</label>
                    <select value={dashboardFilterJenis} onChange={(e) => setDashboardFilterJenis(e.target.value)}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium border-0 focus:ring-2 focus:ring-[#E6A620] outline-none"
                      style={{ background: 'rgba(255,255,255,0.12)', color: 'white', backdropFilter: 'blur(8px)', minWidth: '180px' }}>
                      <option value="all" style={{ background: '#2D1254', color: 'white' }}>Semua Jenis Ujian</option>
                      {jenisUjian.map(j => <option key={j.id} value={j.id} style={{ background: '#2D1254', color: 'white' }}>{j.nama}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setShowDashboardSettings(true)} className="p-2.5 rounded-xl transition-all mt-5"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    <Settings size={18} />
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="relative overflow-hidden rounded-[24px] p-6 flex flex-col justify-between min-h-[160px]"
                style={{ background: 'linear-gradient(135deg, #6750A4 0%, #4F378B 100%)' }}>
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full opacity-15" style={{ background: 'white' }} />
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-white/20"><Users size={18} className="text-white" /></div>
                  <span className="text-[10px] font-bold bg-white/20 text-white/80 px-2 py-0.5 rounded-full uppercase tracking-wider">Kumulatif</span>
                </div>
                <div className="mt-3">
                  <h3 className="text-4xl font-black text-white">{stats.totalAttempts}</h3>
                  <p className="text-sm font-bold text-white mt-1">Total Peserta Training</p>
                  <p className="text-xs text-white/60 mt-1 leading-relaxed">Jumlah seluruh peserta yang telah menyelesaikan ujian.</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-[24px] p-6 flex flex-col justify-between min-h-[160px]"
                style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' }}>
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full opacity-15" style={{ background: 'white' }} />
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-white/20"><CheckCircle2 size={18} className="text-white" /></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${stats.lulusRate >= 70 ? 'bg-white/20 text-white/80' : 'bg-[#B71C1C]/40 text-white'}`}>
                    {stats.lulusRate >= 70 ? 'Baik' : 'Perlu Perhatian'}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-end gap-1">
                    <h3 className="text-4xl font-black text-white">{stats.lulusRate}</h3>
                    <span className="text-xl font-black text-white/70 mb-1">%</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">Tingkat Kelulusan</p>
                  <div className="mt-2 bg-white/20 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-white transition-all duration-700" style={{ width: `${stats.lulusRate}%` }} />
                  </div>
                  <p className="text-xs text-white/60 mt-1">Target minimum: 70%</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="rounded-[24px] p-6 flex flex-col justify-between bg-white border border-[#E6E1E5] shadow-sm min-h-[160px]">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-[#EADDFF]"><BarChart3 size={18} className="text-[#6750A4]" /></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stats.avgNilai >= 70 ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF8E1] text-[#F57F17]'}`}>
                    {stats.avgNilai >= 70 ? '✓ Di atas KKM' : '⚠ Di bawah KKM'}
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="text-4xl font-black text-[#1C1B1F]">{stats.avgNilai}</h3>
                  <p className="text-sm font-bold text-[#1C1B1F] mt-1">Rata-rata Nilai Ujian</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">KKM = 70</p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-[24px] p-6 flex flex-col justify-between bg-white border border-[#E6E1E5] shadow-sm min-h-[160px]">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 rounded-xl bg-[#FFF8E1]"><Clock size={18} className="text-[#F57F17]" /></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stats.trendLulus > 0 ? 'bg-[#E8F5E9] text-[#2E7D32]' : stats.trendLulus < 0 ? 'bg-[#F9DEDC] text-[#B3261E]' : 'bg-[#F3F0F5] text-[#49454F]'}`}>
                    {stats.trendLulus > 0 ? `↑ +${stats.trendLulus}%` : stats.trendLulus < 0 ? `↓ ${stats.trendLulus}%` : '→ Stabil'}
                  </span>
                </div>
                <div className="mt-3">
                  <h3 className="text-4xl font-black text-[#1C1B1F]">{stats.thisMonthCount}</h3>
                  <p className="text-sm font-bold text-[#1C1B1F] mt-1">Ujian Bulan Ini</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Tren dibanding bulan lalu.</p>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {dashboardConfig.showPieChart && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                  className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 rounded-full bg-[#6750A4]" />
                    <h4 className="text-sm font-bold text-[#1C1B1F]">Distribusi Kategori Peserta</h4>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mb-4 ml-3">Berdasarkan data hasil ujian</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={75} paddingAngle={4} dataKey="value">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} peserta`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-[10px] text-[#49454F] truncate">{d.name} <span className="font-bold">({d.value})</span></span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {dashboardConfig.showBarChartMonth && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className={clsx("bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6", dashboardConfig.showPieChart ? "lg:col-span-2" : "lg:col-span-3")}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 rounded-full bg-[#6750A4]" />
                    <h4 className="text-sm font-bold text-[#1C1B1F]">Aktivitas Ujian — Bulan Ini</h4>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mb-4 ml-3">Jumlah ujian per minggu di bulan berjalan</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartMonthData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F0F5" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} allowDecimals={false} />
                        <Tooltip cursor={{ fill: '#F3F0F5' }} formatter={(value) => [`${value} ujian`, 'Selesai']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="val" fill="#6750A4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </div>

            {dashboardConfig.showBarChartYear && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 rounded-full bg-[#006A6A]" />
                    <h4 className="text-sm font-bold text-[#1C1B1F]">Tren Ujian Sepanjang {new Date().getFullYear()}</h4>
                  </div>
                  <span className="text-[10px] font-bold text-[#49454F] bg-[#F3F0F5] px-3 py-1 rounded-full">Per Bulan</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-4 ml-3">Total ujian yang diselesaikan setiap bulan</p>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartYearData} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F0F5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip cursor={{ fill: '#F0FAFA' }} formatter={(value) => [`${value} ujian`, 'Selesai']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="val" fill="#006A6A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* JENIS UJIAN TAB */}
        {activeTab === 'jenis_ujian' && (
          <div>
            <div className="hidden md:block bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F3F0F5] text-[#49454F] text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4"><input type="checkbox" className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                      onChange={(e) => { if (e.target.checked) setSelectedJenis(jenisUjian.map(j => j.id)); else setSelectedJenis([]); }}
                      checked={selectedJenis.length === jenisUjian.length && jenisUjian.length > 0} /></th>
                    <th className="px-6 py-4 font-bold">Nama Ujian</th>
                    <th className="px-6 py-4 font-bold">Durasi</th>
                    <th className="px-6 py-4 font-bold">Limit 1x/Hari</th>
                    <th className="px-6 py-4 font-bold">Komitmen</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1E5]">
                  {jenisUjian.map((j) => (
                    <tr key={j.id} className="hover:bg-[#FDFCFB] transition-colors">
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                        checked={selectedJenis.includes(j.id)}
                        onChange={(e) => { if (e.target.checked) setSelectedJenis([...selectedJenis, j.id]); else setSelectedJenis(selectedJenis.filter(id => id !== j.id)); }} /></td>
                      <td className="px-6 py-4"><button onClick={() => setViewingQuestionsJenis(j)} className="font-bold text-[#6750A4] hover:underline text-left">{j.nama}</button></td>
                      <td className="px-6 py-4">{Math.abs(j.timer_minutes)} Menit</td>
                      <td className="px-6 py-4"><span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", j.timer_minutes < 0 ? "bg-[#E3F2FD] text-[#1565C0]" : "bg-[#F5F5F5] text-[#757575]")}>{j.timer_minutes < 0 ? 'Ya' : 'Tidak'}</span></td>
                      <td className="px-6 py-4">{j.has_commitment ? <span className="text-[#2E7D32] flex items-center gap-1 text-xs font-medium"><CheckCircle2 size={14} /> Aktif</span> : <span className="text-[#49454F] text-xs">Tidak Ada</span>}</td>
                      <td className="px-6 py-4"><button onClick={() => toggleJenisStatus(j.id, j.is_active)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase cursor-pointer transition-all hover:opacity-80 ${j.is_active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}>{j.is_active ? '🟢 ON' : '🔴 OFF'}</button></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => copyExamLink(j.id)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg" title="Salin Link"><Copy size={18} /></button>
                          <button onClick={() => handleShowQR(j)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg" title="QR Code"><QrCode size={18} /></button>
                          <button onClick={() => handleEditJenis(j)} className="p-2 text-[#49454F] hover:bg-[#EADDFF] rounded-lg" title="Edit"><Settings size={18} /></button>
                          <button onClick={() => { if (confirm('Hapus jenis ujian ini?')) { supabase.from('jenis_ujian').delete().eq('id', j.id).then(() => fetchData()); } }} className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg" title="Hapus"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jenisUjian.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-[#49454F]">Belum ada data jenis ujian.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {jenisUjian.map((j) => (
                <div key={j.id} className="bg-white rounded-2xl border border-[#E6E1E5] shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4] mt-1 flex-shrink-0"
                      checked={selectedJenis.includes(j.id)}
                      onChange={(e) => { if (e.target.checked) setSelectedJenis([...selectedJenis, j.id]); else setSelectedJenis(selectedJenis.filter(id => id !== j.id)); }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <button onClick={() => setViewingQuestionsJenis(j)} className="font-bold text-[#6750A4] hover:underline text-left text-sm">{j.nama}</button>
                        <button onClick={() => toggleJenisStatus(j.id, j.is_active)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${j.is_active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}>{j.is_active ? '🟢 ON' : '🔴 OFF'}</button>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => copyExamLink(j.id)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg"><Copy size={16} /></button>
                        <button onClick={() => handleShowQR(j)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg"><QrCode size={16} /></button>
                        <button onClick={() => handleEditJenis(j)} className="p-2 text-[#49454F] hover:bg-[#EADDFF] rounded-lg"><Settings size={16} /></button>
                        <button onClick={() => { if (confirm('Hapus?')) { supabase.from('jenis_ujian').delete().eq('id', j.id).then(() => fetchData()); } }} className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESERTA TAB */}
        {activeTab === 'peserta' && (
          <div className="space-y-4">
            {selectedGroupJenis === 'all' ? (
              <div className="flex flex-col gap-3">
                <button onClick={() => setSelectedGroupJenis('all_list')}
                  className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all text-left group flex items-center gap-4">
                  <div className="p-3 bg-[#EADDFF] text-[#21005D] rounded-xl group-hover:scale-110 transition-transform"><Users size={20} /></div>
                  <div className="flex-1"><h3 className="font-bold text-[#1C1B1F]">Semua Peserta</h3><p className="text-xs text-[#49454F]">{peserta.length} Peserta Terdaftar</p></div>
                  <ChevronRight size={20} className="text-[#CAC4D0]" />
                </button>
                {jenisUjian.map(j => (
                  <button key={j.id} onClick={() => setSelectedGroupJenis(j.id)}
                    className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all text-left group flex items-center gap-4">
                    <div className="p-3 bg-[#D1E1FF] text-[#001D35] rounded-xl group-hover:scale-110 transition-transform"><BookOpen size={20} /></div>
                    <div className="flex-1"><h3 className="font-bold text-[#1C1B1F]">{j.nama}</h3><p className="text-xs text-[#49454F]">{peserta.filter(p => p.allowed_jenis_id === j.id).length} Peserta</p></div>
                    <ChevronRight size={20} className="text-[#CAC4D0]" />
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setSelectedGroupJenis('all')} className="text-sm font-bold text-[#6750A4] hover:underline flex items-center gap-1">
                    <ChevronLeft size={16} /> Kembali ke Grup
                  </button>
                  <span className="text-[#49454F]">/</span>
                  <span className="text-sm font-bold">{selectedGroupJenis === 'all_list' ? 'Semua Peserta' : jenisUjian.find(j => j.id === selectedGroupJenis)?.nama}</span>
                </div>
                <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#E6E1E5] bg-[#FDFCFB]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-sm font-medium text-[#49454F] cursor-pointer">
                        <input type="checkbox"
                          className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                          checked={selectedPeserta.length > 0 && selectedPeserta.length === peserta.filter(p => selectedGroupJenis === 'all_list' || p.allowed_jenis_id === selectedGroupJenis).length}
                          onChange={(e) => {
                            const filtered = peserta.filter(p => selectedGroupJenis === 'all_list' || p.allowed_jenis_id === selectedGroupJenis);
                            if (e.target.checked) setSelectedPeserta(filtered.map(p => p.nik));
                            else setSelectedPeserta([]);
                          }}
                        />
                        Pilih Semua
                      </label>
                      <div className="relative w-full md:w-96 ml-4">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#49454F]"><Search size={18} /></div>
                        <input type="text" placeholder="Cari Nama atau NIK..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-11 pr-4 py-2 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4]" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    {peserta
                      .filter(p => selectedGroupJenis === 'all_list' || p.allowed_jenis_id === selectedGroupJenis)
                      .filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.nik.includes(searchTerm))
                      .map((p) => (
                        <div key={p.nik} className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all flex items-center gap-4">
                          <input type="checkbox" className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                            checked={selectedPeserta.includes(p.nik)}
                            onChange={(e) => { if (e.target.checked) setSelectedPeserta([...selectedPeserta, p.nik]); else setSelectedPeserta(selectedPeserta.filter(nik => nik !== p.nik)); }} />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div className="flex flex-col"><span className="text-xs text-[#49454F] font-mono">{p.nik}</span><span className="font-bold text-[#1C1B1F]">{p.nama}</span></div>
                            <div className="flex flex-col"><span className="text-[10px] text-[#49454F] uppercase font-bold">Perusahaan</span><span className="text-sm">{p.perusahaan}</span></div>
                            <div className="flex flex-col"><span className="text-[10px] text-[#49454F] uppercase font-bold">Kategori</span><span className="px-2 py-0.5 rounded-full bg-[#EADDFF] text-[#21005D] text-[10px] font-bold w-fit">{p.kategori}</span></div>
                            <div className="flex flex-col"><span className="text-[10px] text-[#49454F] uppercase font-bold">Jenis Training</span><span className="text-xs font-bold text-[#6750A4]">{jenisUjian.find(j => j.id === p.allowed_jenis_id)?.nama || '-'}</span></div>
                          </div>
                          <button onClick={() => deletePeserta(p.nik)} className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg transition-all"><Trash2 size={18} /></button>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* SOAL TAB */}
        {activeTab === 'soal' && (
          <div className="space-y-4">
            {selectedSoalGroupJenis === 'all' ? (
              <div className="flex flex-col gap-3">
                <button onClick={() => setSelectedSoalGroupJenis('all_list')}
                  className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all text-left group flex items-center gap-4">
                  <div className="p-3 bg-[#EADDFF] text-[#21005D] rounded-xl"><FileQuestion size={20} /></div>
                  <div className="flex-1"><h3 className="font-bold text-[#1C1B1F]">Semua Soal</h3><p className="text-xs text-[#49454F]">{soal.length} Soal Tersedia</p></div>
                  <ChevronRight size={20} className="text-[#CAC4D0]" />
                </button>
                {jenisUjian.map(j => (
                  <button key={j.id} onClick={() => setSelectedSoalGroupJenis(j.id)}
                    className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all text-left group flex items-center gap-4">
                    <div className="p-3 bg-[#D1E1FF] text-[#001D35] rounded-xl"><BookOpen size={20} /></div>
                    <div className="flex-1"><h3 className="font-bold text-[#1C1B1F]">{j.nama}</h3><p className="text-xs text-[#49454F]">{soal.filter(s => s.jenis_ujian_id === j.id).length} Soal</p></div>
                    <ChevronRight size={20} className="text-[#CAC4D0]" />
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setSelectedSoalGroupJenis('all')} className="text-sm font-bold text-[#6750A4] hover:underline flex items-center gap-1">
                    <ChevronLeft size={16} /> Kembali ke Grup
                  </button>
                  <span className="text-[#49454F]">/</span>
                  <span className="text-sm font-bold">{selectedSoalGroupJenis === 'all_list' ? 'Semua Soal' : jenisUjian.find(j => j.id === selectedSoalGroupJenis)?.nama}</span>
                </div>
                <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#E6E1E5] bg-[#FDFCFB]">
                    <div className="relative w-full md:w-96">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#49454F]"><Search size={18} /></div>
                      <input type="text" placeholder="Cari Pertanyaan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4]" />
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    {soal.filter(s => selectedSoalGroupJenis === 'all_list' || s.jenis_ujian_id === selectedSoalGroupJenis)
                      .filter(s => s.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((s) => (
                        <div key={s.id} className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm flex items-center gap-4">
                          <input type="checkbox" className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                            checked={selectedSoal.includes(s.id)}
                            onChange={(e) => { if (e.target.checked) setSelectedSoal([...selectedSoal, s.id]); else setSelectedSoal(selectedSoal.filter(id => id !== s.id)); }} />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div className="flex flex-col"><span className="text-[10px] text-[#49454F] uppercase font-bold">Jenis Ujian</span><span className="text-xs font-bold text-[#6750A4]">{jenisUjian.find(j => j.id === s.jenis_ujian_id)?.nama || 'Unknown'}</span></div>
                            <div className="flex flex-col"><span className="text-[10px] text-[#49454F] uppercase font-bold">Pertanyaan</span><span className="text-sm line-clamp-2">{s.pertanyaan}</span></div>
                            <div className="flex flex-col items-start md:items-center"><span className="text-[10px] text-[#49454F] uppercase font-bold">Jawaban</span><span className="w-8 h-8 rounded-full bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center font-bold text-sm">{s.jawaban_benar}</span></div>
                          </div>
                          <button onClick={() => deleteSoal(s.id)} className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg"><Trash2 size={18} /></button>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div>
            <div className="hidden md:block bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F3F0F5] text-[#49454F] text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Waktu Request</th>
                    <th className="px-6 py-4 font-bold">Peserta</th>
                    <th className="px-6 py-4 font-bold">Perusahaan</th>
                    <th className="px-6 py-4 font-bold">Jenis Ujian</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E1E5]">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-[#FDFCFB]">
                      <td className="px-6 py-4 text-sm">{format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="px-6 py-4"><p className="font-bold">{r.nama}</p><p className="text-xs font-mono text-[#49454F]">{r.nik}</p></td>
                      <td className="px-6 py-4 text-sm">{r.perusahaan || '-'}</td>
                      <td className="px-6 py-4 text-sm">{jenisUjian.find(j => j.id === r.jenis_ujian_id)?.nama || 'Unknown'}</td>
                      <td className="px-6 py-4"><span className={clsx("px-3 py-1 rounded-full text-[10px] font-bold uppercase", r.status === 'pending' ? "bg-[#FFF8E1] text-[#F57F17]" : r.status === 'approved' ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#F9DEDC] text-[#B3261E]")}>{r.status}</span></td>
                      <td className="px-6 py-4">{r.status === 'pending' && (<div className="flex gap-2"><button onClick={() => handleApproveRequest(r.id)} className="p-2 text-[#2E7D32] hover:bg-[#E8F5E9] rounded-lg"><Check size={18} /></button><button onClick={() => handleRejectRequest(r.id)} className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg"><X size={18} /></button></div>)}</td>
                    </tr>
                  ))}
                  {requests.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-[#49454F]">Tidak ada request remedial.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-[#E6E1E5] shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-sm">{r.nama}</p>
                        <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", r.status === 'pending' ? "bg-[#FFF8E1] text-[#F57F17]" : r.status === 'approved' ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#F9DEDC] text-[#B3261E]")}>{r.status}</span>
                      </div>
                      <p className="text-[10px] font-mono text-[#49454F]">{r.nik}</p>
                      <p className="text-xs text-[#6750A4] font-medium mt-1">{jenisUjian.find(j => j.id === r.jenis_ujian_id)?.nama || 'Unknown'}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-1">{format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleApproveRequest(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] text-[#2E7D32] rounded-xl text-xs font-bold"><Check size={14} /> Setujui</button>
                        <button onClick={() => handleRejectRequest(r.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9DEDC] text-[#B3261E] rounded-xl text-xs font-bold"><X size={14} /> Tolak</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HASIL TAB */}
        {activeTab === 'hasil' && (
          <div className="space-y-6">
            {!showHasilDetail ? (
              <div>
                {(() => {
                  const grouped = results.reduce((acc, curr) => {
                    const date = format(new Date(curr.waktu_selesai), 'yyyy-MM-dd');
                    const key = `${date}_${curr.jenis_ujian_id}`;
                    if (!acc[key]) acc[key] = { date, jenis_id: curr.jenis_ujian_id, total: 0, lulus: 0, tidakLulus: 0 };
                    acc[key].total++;
                    if (curr.status_lulus) acc[key].lulus++; else acc[key].tidakLulus++;
                    return acc;
                  }, {} as Record<string, any>);
                  const summaries = Object.values(grouped).sort((a: any, b: any) => b.date.localeCompare(a.date));
                  if (summaries.length === 0) return <div className="bg-white rounded-2xl border border-[#E6E1E5] p-8 text-center text-[#49454F]">Belum ada data hasil ujian.</div>;
                  return (
                    <>
                      <div className="hidden md:block bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-[#F3F0F5] text-[#49454F] text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4 font-bold">Tanggal</th>
                              <th className="px-6 py-4 font-bold">Nama Ujian</th>
                              <th className="px-6 py-4 font-bold text-center">Total</th>
                              <th className="px-6 py-4 font-bold text-center">Lulus</th>
                              <th className="px-6 py-4 font-bold text-center">Gagal</th>
                              <th className="px-6 py-4 font-bold"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E6E1E5]">
                            {summaries.map((summary: any) => (
                              <tr key={`${summary.date}_${summary.jenis_id}`} className="hover:bg-[#FDFCFB] cursor-pointer group"
                                onClick={() => { setSelectedHasilJenis(summary.jenis_id); setSelectedHasilDate(summary.date); setShowHasilDetail(true); }}>
                                <td className="px-6 py-4 text-sm font-medium">{format(new Date(summary.date), 'dd MMM yyyy', { locale: id })}</td>
                                <td className="px-6 py-4 text-sm font-bold text-[#6750A4]">{jenisUjian.find(j => j.id === summary.jenis_id)?.nama || 'Ujian Tidak Diketahui'}</td>
                                <td className="px-6 py-4 text-center font-bold">{summary.total}</td>
                                <td className="px-6 py-4 text-center"><span className="px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold">{summary.lulus}</span></td>
                                <td className="px-6 py-4 text-center"><span className="px-2 py-0.5 rounded-full bg-[#F9DEDC] text-[#B3261E] text-[10px] font-bold">{summary.tidakLulus}</span></td>
                                <td className="px-6 py-4 text-right"><ChevronRight size={18} className="text-[#49454F] group-hover:translate-x-1 transition-transform inline" /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="md:hidden space-y-3">
                        {summaries.map((summary: any) => (
                          <button key={`${summary.date}_${summary.jenis_id}`}
                            className="w-full bg-white rounded-2xl border border-[#E6E1E5] shadow-sm p-4 hover:border-[#6750A4] transition-all text-left"
                            onClick={() => { setSelectedHasilJenis(summary.jenis_id); setSelectedHasilDate(summary.date); setShowHasilDetail(true); }}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[#6750A4] text-sm truncate">{jenisUjian.find(j => j.id === summary.jenis_id)?.nama || 'Ujian Tidak Diketahui'}</p>
                                <p className="text-xs text-[#49454F] mt-0.5">{format(new Date(summary.date), 'dd MMM yyyy', { locale: id })}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-bold bg-[#F3F0F5] px-2 py-1 rounded-lg">{summary.total}</span>
                                <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] px-2 py-1 rounded-lg">{summary.lulus} lulus</span>
                                <span className="text-[10px] font-bold bg-[#F9DEDC] text-[#B3261E] px-2 py-1 rounded-lg">{summary.tidakLulus} gagal</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b border-[#E6E1E5] flex flex-col md:flex-row justify-between items-start md:items-center bg-[#FDFCFB] gap-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setShowHasilDetail(false); setSelectedHasilJenis(null); setSelectedHasilDate(null); }} className="p-2 hover:bg-[#F3F0F5] rounded-full">
                      <ChevronLeft size={20} />
                    </button>
                    <div>
                      <h3 className="text-lg font-bold">{jenisUjian.find(j => j.id === selectedHasilJenis)?.nama || 'Ujian Tidak Diketahui'}</h3>
                      <p className="text-xs text-[#49454F]">{selectedHasilDate ? format(new Date(selectedHasilDate), 'dd MMMM yyyy', { locale: id }) : '-'}</p>
                    </div>
                  </div>
                  <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#49454F]"><Search size={16} /></div>
                    <input type="text" placeholder="Cari Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-[#E6E1E5] rounded-xl text-sm focus:ring-2 focus:ring-[#6750A4]" />
                  </div>
                </div>
                <div>
                  {(() => {
                    const filtered = results
                      .filter(r => r.jenis_ujian_id === selectedHasilJenis && format(new Date(r.waktu_selesai), 'yyyy-MM-dd') === selectedHasilDate)
                      .filter(r => r.nama.toLowerCase().includes(searchTerm.toLowerCase()) || r.nik.includes(searchTerm));
                    return (
                      <>
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-[#F3F0F5] text-[#49454F] text-xs uppercase tracking-wider">
                              <tr>
                                <th className="px-6 py-4 font-bold">Nama</th>
                                <th className="px-6 py-4 font-bold">NIK</th>
                                <th className="px-6 py-4 font-bold text-center">Nilai</th>
                                <th className="px-6 py-4 font-bold">Perusahaan</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                <th className="px-6 py-4 font-bold text-center">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E6E1E5]">
                              {filtered.map((r) => (
                                <tr key={r.id} className="hover:bg-[#FDFCFB]">
                                  <td className="px-6 py-4"><p className="font-bold text-sm">{r.nama}</p><p className="text-[10px] text-[#49454F]">{format(new Date(r.waktu_selesai), 'dd MMM yyyy, HH:mm', { locale: id })}</p></td>
                                  <td className="px-6 py-4"><p className="text-[10px] font-mono text-[#49454F]">{r.nik}</p></td>
                                  <td className="px-6 py-4 text-center"><span className={`text-base font-black ${r.nilai >= 70 ? 'text-[#2E7D32]' : 'text-[#B3261E]'}`}>{r.nilai}</span></td>
                                  <td className="px-6 py-4"><p className="text-xs text-[#49454F]">{r.perusahaan || peserta.find(p => p.nik === r.nik)?.perusahaan || '-'}</p></td>
                                  <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${r.status_lulus ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}>{r.status_lulus ? (r.profil_data.is_remedial ? 'Lulus Remedial' : 'Lulus') : (r.profil_data.is_remedial ? 'Tidak Lulus Remedial' : 'Tidak Lulus')}</span></td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button onClick={() => { setSelectedResultForCheating(r); setShowCheatingModal(true); }} className="p-1.5 text-[#49454F] hover:text-[#6750A4] hover:bg-[#EADDFF] rounded-lg"><FileQuestion size={16} /></button>
                                      <button onClick={() => deleteHasil(r.id)} className="p-1.5 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg" title="Hapus hasil ujian"><Trash2 size={16} /></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="md:hidden p-4 space-y-3">
                          {filtered.map((r) => (
                            <div key={r.id} className="bg-[#FAFAFA] border border-[#E6E1E5] rounded-2xl p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="font-bold text-sm">{r.nama}</p>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${r.status_lulus ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}>{r.status_lulus ? (r.profil_data.is_remedial ? 'Lulus Remedial' : 'Lulus') : (r.profil_data.is_remedial ? 'Tidak Lulus Remedial' : 'Tidak Lulus')}</span>
                                  </div>
                                  <p className="text-[10px] font-mono text-[#49454F]">{r.nik}</p>
                                  <p className="text-[10px] text-[#49454F]">{r.perusahaan || peserta.find(p => p.nik === r.nik)?.perusahaan || '-'}</p>
                                  <p className="text-[10px] text-[#9CA3AF] mt-1">{format(new Date(r.waktu_selesai), 'dd MMM yyyy, HH:mm', { locale: id })}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <span className={`text-2xl font-black ${r.nilai >= 70 ? 'text-[#2E7D32]' : 'text-[#B3261E]'}`}>{r.nilai}</span>
                                  <div className="flex gap-1">
                                    <button onClick={() => { setSelectedResultForCheating(r); setShowCheatingModal(true); }} className="p-1.5 text-[#49454F] hover:bg-[#EADDFF] rounded-lg"><FileQuestion size={16} /></button>
                                    <button onClick={() => deleteHasil(r.id)} className="p-1.5 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg"><Trash2 size={16} /></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-[#E6E1E5] flex justify-between items-center">
                <h3 className="text-xl font-bold">Daftar Administrator</h3>
                <button onClick={() => setShowAddAdminModal(true)} className="bg-[#6750A4] text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md hover:bg-[#4F378B]"><Plus size={18} /> Tambah Admin</button>
              </div>
              <div className="p-8 space-y-4">
                {admins.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold text-xl">{a.username[0].toUpperCase()}</div>
                      <div><p className="font-bold">{a.username}</p><p className="text-xs text-[#49454F] uppercase tracking-widest">{a.role}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                      {a.is_approved ? <span className="px-3 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-full text-[10px] font-bold">TERVERIFIKASI</span> : <span className="px-3 py-1 bg-[#FFF8E1] text-[#F57F17] rounded-full text-[10px] font-bold">PENDING</span>}
                      {admin?.role === 'super_admin' && a.username !== admin.username && (
                        <button onClick={async () => { if (confirm(`Hapus admin ${a.username}?`)) { const { error } = await supabase.from('users_admin').delete().eq('id', a.id); if (error) alert('Gagal'); else fetchData(); } }} className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg"><Trash2 size={18} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm p-8">
              <h3 className="text-xl font-bold mb-4">Konfigurasi Sistem</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-[#E6E1E5] rounded-3xl">
                  <h4 className="font-bold mb-2">Backup Data</h4>
                  <p className="text-sm text-[#49454F] mb-4">Ekspor seluruh database ke format JSON.</p>
                  <button onClick={handleExportDatabase} className="w-full py-3 bg-[#F3F0F5] text-[#1C1B1F] rounded-xl font-bold hover:bg-[#EADDFF]">Ekspor Database</button>
                </div>
                <div className="p-6 border border-[#E6E1E5] rounded-3xl">
                  <h4 className="font-bold mb-2">Keamanan</h4>
                  <p className="text-sm text-[#49454F] mb-4">Atur kebijakan password dan sesi login admin.</p>
                  <button onClick={() => setShowSecurityModal(true)} className="w-full py-3 bg-[#F3F0F5] text-[#1C1B1F] rounded-xl font-bold hover:bg-[#EADDFF]">Pengaturan Keamanan</button>
                </div>
              </div>
            </div>
            <LandingConfigEditor />
          </div>
        )}
      </main>
      {/* Real-time Notification */}
      <AnimatePresence>
        {notification && notification.show && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-6 right-6 z-[200] w-80 bg-white rounded-2xl shadow-2xl border border-[#E6E1E5] overflow-hidden">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#EADDFF] text-[#6750A4] rounded-full flex items-center justify-center flex-shrink-0"><MessageSquare size={20} /></div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#1C1B1F] text-sm">Request Remedial Baru</h4>
                  <p className="text-xs text-[#49454F] mt-1 leading-relaxed"><span className="font-bold">{notification.nama}</span> ({notification.nik}) meminta akses untuk <span className="font-bold">{notification.jenis}</span>.</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-[#49454F] hover:text-[#1C1B1F]"><X size={16} /></button>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { setActiveTab('requests'); setNotification(null); }} className="flex-1 py-2 bg-[#6750A4] text-white text-xs font-bold rounded-lg hover:bg-[#4F378B]">Lihat Request</button>
              </div>
            </div>
            <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 5, ease: "linear" }} className="h-1 bg-[#6750A4]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Peserta Modal */}
      {showAddPesertaModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-2xl font-bold mb-6">Tambah Peserta Baru</h3>
            <form onSubmit={handleSavePeserta} className="space-y-4">
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">NIK</label><input type="text" required value={newPeserta.nik} onChange={e => setNewPeserta({...newPeserta, nik: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Nama Lengkap</label><input type="text" required value={newPeserta.nama} onChange={e => setNewPeserta({...newPeserta, nama: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Perusahaan</label><input type="text" required value={newPeserta.perusahaan} onChange={e => setNewPeserta({...newPeserta, perusahaan: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Kategori</label>
                <select value={newPeserta.kategori} onChange={e => setNewPeserta({...newPeserta, kategori: e.target.value as any})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                  <option>Karyawan</option><option>Magang</option><option>Visitor</option><option>Kontraktor</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Jenis Ujian yang Diizinkan</label>
                <select required value={newPeserta.allowed_jenis_id} onChange={e => setNewPeserta({...newPeserta, allowed_jenis_id: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                  <option value="">Pilih Jenis Ujian...</option>
                  {jenisUjian.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddPesertaModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold">Batal</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan Peserta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-2xl font-bold mb-6">Tambah Administrator</h3>
            <form onSubmit={handleSaveAdmin} className="space-y-4">
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Username</label><input type="text" required value={newAdmin.username} onChange={e => setNewAdmin({...newAdmin, username: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Password</label><input type="password" required value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Role</label>
                <select value={newAdmin.role} onChange={e => setNewAdmin({...newAdmin, role: e.target.value as any})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                  <option value="admin">Admin</option><option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddAdminModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold">Batal</button>
                <button type="submit" className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold">Simpan Admin</button>
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
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Jenis Ujian</label>
                <select required value={newSoal.jenis_ujian_id} onChange={e => setNewSoal({...newSoal, jenis_ujian_id: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                  <option value="">Pilih Jenis Ujian...</option>
                  {jenisUjian.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Pertanyaan</label><textarea required value={newSoal.pertanyaan} onChange={e => setNewSoal({...newSoal, pertanyaan: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4] h-24" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#49454F] mb-1">Pilihan A</label><input type="text" required value={newSoal.pilihan_a} onChange={e => setNewSoal({...newSoal, pilihan_a: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
                <div><label className="block text-sm font-medium text-[#49454F] mb-1">Pilihan B</label><input type="text" required value={newSoal.pilihan_b} onChange={e => setNewSoal({...newSoal, pilihan_b: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
                <div><label className="block text-sm font-medium text-[#49454F] mb-1">Pilihan C</label><input type="text" required value={newSoal.pilihan_c} onChange={e => setNewSoal({...newSoal, pilihan_c: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
                <div><label className="block text-sm font-medium text-[#49454F] mb-1">Pilihan D</label><input type="text" required value={newSoal.pilihan_d} onChange={e => setNewSoal({...newSoal, pilihan_d: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              </div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Jawaban Benar</label>
                <select value={newSoal.jawaban_benar} onChange={e => setNewSoal({...newSoal, jawaban_benar: e.target.value as any})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                  <option>A</option><option>B</option><option>C</option><option>D</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddSoalModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold">Batal</button>
                <button type="submit" className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold">Simpan Soal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dashboard Settings Modal */}
      {showDashboardSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Pengaturan Dashboard</h3>
              <button onClick={() => setShowDashboardSettings(false)} className="p-2 hover:bg-[#F3F0F5] rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Tampilkan Pie Chart', key: 'showPieChart' },
                { label: 'Tampilkan Bar Chart Bulanan', key: 'showBarChartMonth' },
                { label: 'Tampilkan Bar Chart Tahunan', key: 'showBarChartYear' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                  <span className="text-sm font-medium text-[#49454F]">{item.label}</span>
                  <input type="checkbox" checked={dashboardConfig[item.key as keyof typeof dashboardConfig] as boolean}
                    onChange={e => setDashboardConfig({...dashboardConfig, [item.key]: e.target.checked})}
                    className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]" />
                </div>
              ))}
              <div className="pt-4">
                <button onClick={handleResetData} className="w-full py-3 bg-[#F9DEDC] text-[#B3261E] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#F2B8B5]">
                  <Trash2 size={18} /> Reset Seluruh Data
                </button>
                <p className="text-[10px] text-[#B3261E] mt-2 text-center">*Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <button onClick={() => setShowDashboardSettings(false)} className="w-full mt-8 py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B]">Selesai</button>
          </div>
        </div>
      )}

      {/* Add Jenis Modal */}
      {showAddJenisModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5] max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Tambah Jenis Ujian</h3>
            <form onSubmit={handleSaveJenis} className="space-y-6">
              <div><label className="block text-sm font-medium text-[#49454F] mb-2">Nama Ujian / Training</label><input type="text" required value={newJenis.nama} onChange={e => setNewJenis({...newJenis, nama: e.target.value})} placeholder="Contoh: Induksi Karyawan Baru" className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-2">Durasi (Menit)</label><input type="number" required value={newJenis.timer_minutes} onChange={e => setNewJenis({...newJenis, timer_minutes: parseInt(e.target.value)})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <span className="text-sm font-medium text-[#49454F]">Wajib Pakta Integritas</span>
                <input type="checkbox" checked={newJenis.has_commitment} onChange={e => setNewJenis({...newJenis, has_commitment: e.target.checked})} className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]" />
              </div>
              {newJenis.has_commitment && (
                <div className="space-y-4 p-4 bg-[#F3F0F5] rounded-2xl">
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Judul Komitmen</label><input type="text" value={newJenis.commitment_title} onChange={e => setNewJenis({...newJenis, commitment_title: e.target.value})} className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm" /></div>
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Isi Komitmen</label><textarea value={newJenis.commitment_content} onChange={e => setNewJenis({...newJenis, commitment_content: e.target.value})} rows={3} className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm" /></div>
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Teks Checkbox Persetujuan</label><input type="text" value={newJenis.commitment_checkbox_text} onChange={e => setNewJenis({...newJenis, commitment_checkbox_text: e.target.value})} className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm" /></div>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <div><span className="text-sm font-medium text-[#49454F]">Batasi 1x Per Hari</span><p className="text-[10px] text-[#49454F]">Kecuali diizinkan Admin</p></div>
                <input type="checkbox" checked={newJenis.limit_one_per_day} onChange={e => setNewJenis({...newJenis, limit_one_per_day: e.target.checked})} className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#49454F] mb-2">Jumlah Soal</label><input type="number" required min="1" value={newJenis.soal_display_count} onChange={e => setNewJenis({...newJenis, soal_display_count: parseInt(e.target.value)})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
                <div><label className="block text-sm font-medium text-[#49454F] mb-2">Skor Lulus</label><input type="number" required min="0" max="100" value={newJenis.passing_score} onChange={e => setNewJenis({...newJenis, passing_score: parseInt(e.target.value)})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddJenisModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]">Batal</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan Jenis'}</button>
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
              <div><label className="block text-sm font-medium text-[#49454F] mb-2">Pilih Jenis Ujian:</label>
                <select value={targetJenisId} onChange={e => setTargetJenisId(e.target.value)} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                  <option value="">-- Pilih Jenis Ujian --</option>
                  {jenisUjian.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowUploadPesertaModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]">Batal</button>
                <button onClick={() => { if (!targetJenisId) { alert('Pilih jenis ujian terlebih dahulu'); return; } const input = document.createElement('input'); input.type = 'file'; input.accept = '.xlsx, .xls'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleFileUploadPeserta(file); }; input.click(); }} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B]">Pilih File & Upload</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Jenis Modal */}
      {showEditJenisModal && editingJenis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5] max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Edit Jenis Ujian</h3>
            <form onSubmit={handleUpdateJenis} className="space-y-4">
              <div><label className="block text-sm font-medium text-[#49454F] mb-2">Nama Ujian</label><input type="text" required value={editingJenis.nama} onChange={e => setEditingJenis({...editingJenis, nama: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-2">Durasi (Menit)</label><input type="number" required value={editingJenis.timer_minutes} onChange={e => setEditingJenis({...editingJenis, timer_minutes: parseInt(e.target.value)})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <span className="text-sm font-medium text-[#49454F]">Wajib Pakta Integritas</span>
                <input type="checkbox" checked={editingJenis.has_commitment} onChange={e => setEditingJenis({...editingJenis, has_commitment: e.target.checked})} className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]" />
              </div>
              {editingJenis.has_commitment && (
                <div className="space-y-4 p-4 bg-[#F3F0F5] rounded-2xl">
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Judul Komitmen</label><input type="text" value={editingJenis.commitment_title} onChange={e => setEditingJenis({...editingJenis, commitment_title: e.target.value})} className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm" /></div>
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Isi Komitmen</label><textarea value={editingJenis.commitment_content} onChange={e => setEditingJenis({...editingJenis, commitment_content: e.target.value})} rows={3} className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm" /></div>
                  <div><label className="block text-xs font-bold text-[#49454F] mb-1 uppercase">Teks Checkbox Persetujuan</label><input type="text" value={editingJenis.commitment_checkbox_text || ''} onChange={e => setEditingJenis({...editingJenis, commitment_checkbox_text: e.target.value})} className="w-full p-3 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm" /></div>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <div><span className="text-sm font-medium text-[#49454F]">Batasi 1x Per Hari</span><p className="text-[10px] text-[#49454F]">Kecuali diizinkan Admin</p></div>
                <input type="checkbox" checked={editingJenis.limit_one_per_day} onChange={e => setEditingJenis({...editingJenis, limit_one_per_day: e.target.checked})} className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-[#49454F] mb-2">Jumlah Soal</label><input type="number" required min="1" value={editingJenis.soal_display_count} onChange={e => setEditingJenis({...editingJenis, soal_display_count: parseInt(e.target.value)})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
                <div><label className="block text-sm font-medium text-[#49454F] mb-2">Skor Lulus</label><input type="number" required min="0" max="100" value={editingJenis.passing_score} onChange={e => setEditingJenis({...editingJenis, passing_score: parseInt(e.target.value)})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditJenisModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]">Batal</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50">{loading ? 'Menyimpan...' : 'Update Jenis'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-xl font-bold mb-2">{showConfirmModal.title}</h3>
            <p className="text-[#49454F] mb-8">{showConfirmModal.message}</p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(prev => ({ ...prev, show: false }))} className="flex-1 py-3 rounded-xl border border-[#E6E1E5] font-bold text-sm">Batal</button>
              <button onClick={showConfirmModal.onConfirm} className="flex-1 py-3 rounded-xl bg-[#B3261E] text-white font-bold text-sm shadow-md hover:bg-[#8C1D18]">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-2xl font-bold mb-6">Filter Export Excel</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-[#49454F] mb-2">Jenis Pelatihan</label>
                <select value={exportFilters.jenis_id} onChange={e => setExportFilters({...exportFilters, jenis_id: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                  <option value="all">Semua Jenis Pelatihan</option>
                  {jenisUjian.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-[#49454F] mb-2">Periode</label>
                <select value={exportFilters.period} onChange={e => setExportFilters({...exportFilters, period: e.target.value as any, value: ''})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                  <option value="all">Semua Waktu</option><option value="daily">Harian</option><option value="monthly">Bulanan</option><option value="yearly">Tahunan</option>
                </select>
              </div>
              {exportFilters.period === 'daily' && (
                <div><label className="block text-sm font-medium text-[#49454F] mb-2">Pilih Tanggal</label>
                  <select value={exportFilters.value} onChange={e => setExportFilters({...exportFilters, value: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                    <option value="">-- Pilih Tanggal --</option>
                    {Array.from(new Set(results.map(r => format(new Date(r.waktu_selesai), 'yyyy-MM-dd')))).sort((a, b) => b.localeCompare(a)).map((date: string) => (
                      <option key={date} value={date}>{format(new Date(date), 'dd MMMM yyyy', { locale: id })}</option>
                    ))}
                  </select>
                </div>
              )}
              {exportFilters.period === 'monthly' && (
                <div><label className="block text-sm font-medium text-[#49454F] mb-2">Pilih Bulan</label>
                  <select value={exportFilters.value} onChange={e => setExportFilters({...exportFilters, value: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                    <option value="">-- Pilih Bulan --</option>
                    {Array.from(new Set(results.map(r => format(new Date(r.waktu_selesai), 'yyyy-MM')))).sort((a, b) => b.localeCompare(a)).map((month: string) => (
                      <option key={month} value={month}>{format(new Date(month + '-01'), 'MMMM yyyy', { locale: id })}</option>
                    ))}
                  </select>
                </div>
              )}
              {exportFilters.period === 'yearly' && (
                <div><label className="block text-sm font-medium text-[#49454F] mb-2">Pilih Tahun</label>
                  <select value={exportFilters.value} onChange={e => setExportFilters({...exportFilters, value: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]">
                    <option value="">-- Pilih Tahun --</option>
                    {Array.from(new Set(results.map(r => format(new Date(r.waktu_selesai), 'yyyy')))).sort((a, b) => b.localeCompare(a)).map((year: string) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowExportModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]">Batal</button>
                <button onClick={performExport} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B]">Download Excel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl border border-[#E6E1E5] text-center">
            <h3 className="text-xl font-bold mb-2">QR Code Ujian</h3>
            <p className="text-[#49454F] text-sm mb-2">{qrData.name}</p>
            <div className="mb-6 px-3 py-1 bg-[#F3F0F5] rounded-full inline-block"><p className="text-[10px] font-mono text-[#6750A4] truncate max-w-[200px]">{qrData.url}</p></div>
            <div className="bg-white p-4 rounded-2xl border border-[#E6E1E5] inline-block mb-6">
              <QRCodeCanvas id="qr-code-canvas" value={qrData.url} size={200} level="H" includeMargin={true} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowQRModal(false)} className="flex-1 py-3 rounded-xl border border-[#E6E1E5] font-bold text-sm">Tutup</button>
              <button onClick={downloadQR} className="flex-1 py-3 rounded-xl bg-[#6750A4] text-white font-bold text-sm shadow-md hover:bg-[#4F378B] flex items-center justify-center gap-2"><Download size={16} /> Download</button>
            </div>
          </div>
        </div>
      )}

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-2xl font-bold mb-2">Pengaturan Keamanan</h3>
            <p className="text-sm text-[#49454F] mb-6">Ubah password akun administrator Anda.</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div><label className="block text-sm font-medium text-[#49454F] mb-1">Password Baru</label><input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Masukkan password baru" className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" /></div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowSecurityModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]">Batal</button>
                <button type="submit" disabled={loading} className="flex-1 py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50">{loading ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Questions Modal */}
      {viewingQuestionsJenis && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-[#E6E1E5] flex flex-col">
            <div className="p-6 border-b border-[#E6E1E5] flex justify-between items-center bg-[#FDFCFB]">
              <div><h3 className="text-xl font-bold">Daftar Soal: {viewingQuestionsJenis.nama}</h3><p className="text-sm text-[#49454F]">Total: {soal.filter(s => s.jenis_ujian_id === viewingQuestionsJenis.id).length} Soal</p></div>
              <button onClick={() => setViewingQuestionsJenis(null)} className="p-2 hover:bg-[#F3F0F5] rounded-full"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {soal.filter(s => s.jenis_ujian_id === viewingQuestionsJenis.id).map((s, idx) => (
                <div key={s.id} className="p-6 rounded-2xl border border-[#E6E1E5] bg-white">
                  <div className="flex gap-4 mb-4">
                    <span className="w-8 h-8 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</span>
                    <p className="font-medium text-lg">{s.pertanyaan}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-12">
                    {['a','b','c','d'].map(opt => (
                      <div key={opt} className={`p-3 rounded-xl border ${s.jawaban_benar.toLowerCase() === opt ? 'border-[#2E7D32] bg-[#E8F5E9] font-bold' : 'border-[#E6E1E5]'}`}>
                        <span className="uppercase mr-2">{opt}.</span>{s[`pilihan_${opt}`]}
                        {s.jawaban_benar.toLowerCase() === opt && <span className="ml-2 text-[10px] bg-[#2E7D32] text-white px-2 py-0.5 rounded-full uppercase">Kunci</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {soal.filter(s => s.jenis_ujian_id === viewingQuestionsJenis.id).length === 0 && <div className="text-center py-12 text-[#49454F]">Belum ada soal.</div>}
            </div>
            <div className="p-6 border-t border-[#E6E1E5] bg-[#FDFCFB] flex justify-end">
              <button onClick={() => setViewingQuestionsJenis(null)} className="px-8 py-3 rounded-xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B]">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Cheating Modal */}
      {showCheatingModal && selectedResultForCheating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-[#E6E1E5]">
            <div className="p-8 border-b border-[#E6E1E5] bg-[#FDFCFB] flex justify-between items-center">
              <div><h3 className="text-xl font-bold">Upaya Kecurangan</h3><p className="text-xs text-[#49454F] mt-1">{selectedResultForCheating.nama} ({selectedResultForCheating.nik})</p></div>
              <button onClick={() => setShowCheatingModal(false)} className="p-2 hover:bg-[#F3F0F5] rounded-full"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center p-4 bg-[#F9DEDC] rounded-2xl border border-[#F2B8B5]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#B3261E] text-white flex items-center justify-center shadow-md"><Clock size={24} /></div>
                  <div><p className="text-xs text-[#B3261E] font-bold uppercase tracking-wider">Berpindah Tab</p><p className="text-2xl font-black text-[#B3261E]">{selectedResultForCheating.profil_data.tab_violations || 0} <span className="text-sm font-normal">Kali</span></p></div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-[#FFF8E1] rounded-2xl border border-[#FFE082]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F57F17] text-white flex items-center justify-center shadow-md"><Shield size={24} /></div>
                  <div><p className="text-xs text-[#F57F17] font-bold uppercase tracking-wider">Upaya Screenshot</p><p className="text-2xl font-black text-[#F57F17]">{selectedResultForCheating.profil_data.screenshot_violations || 0} <span className="text-sm font-normal">Kali</span></p></div>
                </div>
              </div>
              <div className="flex items-center p-4 bg-[#E8F5E9] rounded-2xl border border-[#A5D6A7]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2E7D32] text-white flex items-center justify-center shadow-md"><Copy size={24} /></div>
                  <div><p className="text-xs text-[#2E7D32] font-bold uppercase tracking-wider">Upaya Copy Teks</p><p className="text-2xl font-black text-[#2E7D32]">{selectedResultForCheating.profil_data.copy_violations || 0} <span className="text-sm font-normal">Kali</span></p></div>
                </div>
              </div>
              <div className="p-4 bg-[#F3F0F5] rounded-2xl"><p className="text-xs text-[#49454F] italic">* Data dicatat otomatis oleh sistem selama sesi ujian.</p></div>
            </div>
            <div className="p-8 border-t border-[#E6E1E5] bg-[#FDFCFB] flex justify-end">
              <button onClick={() => setShowCheatingModal(false)} className="px-8 py-3 rounded-xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B]">Tutup</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reset Confirm Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl border-2 border-[#B3261E]">
            <div className="w-16 h-16 bg-[#F9DEDC] text-[#B3261E] rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={36} /></div>
            <h3 className="text-xl font-bold text-center text-[#B3261E] mb-2">Konfirmasi Reset Data</h3>
            <p className="text-sm text-[#49454F] text-center mb-6">Tindakan ini akan menghapus <span className="font-bold">seluruh data</span> secara permanen. Masukkan password untuk konfirmasi.</p>
            <div className="mb-4">
              <input type="password" value={resetPasswordInput} onChange={e => { setResetPasswordInput(e.target.value); setResetPasswordError(''); }} placeholder="Masukkan password Anda" className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#B3261E] text-sm" autoFocus />
              {resetPasswordError && <p className="text-[#B3261E] text-xs mt-2 font-medium">{resetPasswordError}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowResetConfirmModal(false); setResetPasswordInput(''); setResetPasswordError(''); }} className="flex-1 py-3 rounded-xl border border-[#E6E1E5] font-bold text-sm text-[#49454F]">Batal</button>
              <button onClick={handleConfirmReset} disabled={!resetPasswordInput || loading} className="flex-1 py-3 rounded-xl bg-[#B3261E] text-white font-bold text-sm shadow-md hover:bg-[#8C1D18] disabled:opacity-50">{loading ? 'Mereset...' : 'Reset Sekarang'}</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Pilih Jenis untuk Spreadsheet */}
      {showSelectJenisModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
            className="bg-white rounded-[28px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-xl font-bold mb-2">Pilih Jenis {selectJenisMode === 'peserta' ? 'Pelatihan' : 'Ujian'}</h3>
            <p className="text-sm text-[#49454F] mb-6">{selectJenisMode === 'peserta' ? 'Peserta akan didaftarkan ke jenis pelatihan yang dipilih.' : 'Soal akan dimasukkan ke jenis ujian yang dipilih.'}</p>
            <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
              {jenisUjian.map(j => (
                <button key={j.id} onClick={() => { setSpreadsheetJenisId(j.id); setShowSelectJenisModal(false); if (selectJenisMode === 'peserta') { setSpreadsheetPesertaRows(Array.from({length:10}, emptyPesertaRow)); setShowSpreadsheetPeserta(true); } else { setSpreadsheetSoalRows(Array.from({length:10}, emptySoalRow)); setShowSpreadsheetSoal(true); } }}
                  className="w-full p-4 rounded-2xl border-2 border-[#E6E1E5] hover:border-[#6750A4] hover:bg-[#F3F0F5] text-left transition-all flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-[#EADDFF] text-[#6750A4] flex items-center justify-center group-hover:bg-[#6750A4] group-hover:text-white transition-all flex-shrink-0"><BookOpen size={18} /></div>
                  <div className="flex-1"><p className="font-bold text-[#1C1B1F]">{j.nama}</p><p className="text-xs text-[#49454F]">{Math.abs(j.timer_minutes)} menit · {j.is_active ? '🟢 Aktif' : '🔴 Nonaktif'}</p></div>
                  <ChevronRight size={18} className="text-[#CAC4D0] group-hover:text-[#6750A4]" />
                </button>
              ))}
              {jenisUjian.length === 0 && <p className="text-center text-[#49454F] py-4 text-sm">Belum ada jenis ujian.</p>}
            </div>
            <button onClick={() => setShowSelectJenisModal(false)} className="w-full py-3 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
          </motion.div>
        </div>
      )}

      {/* Spreadsheet Modal Peserta */}
      {showSpreadsheetPeserta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
          onMouseUp={() => { isDraggingRef.current = false; }} onMouseLeave={() => { isDraggingRef.current = false; }}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="bg-white rounded-[24px] w-full max-w-6xl shadow-2xl border border-[#E6E1E5] flex flex-col" style={{maxHeight:'95vh'}}>
            <div className="p-5 border-b border-[#E6E1E5] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Table2 size={20} className="text-[#006A6A]" /> Input Peserta via Spreadsheet</h3>
                <p className="text-xs text-[#49454F] mt-0.5">Jenis: <span className="font-bold text-[#6750A4]">{jenisUjian.find(j=>j.id===spreadsheetJenisId)?.nama}</span></p>
              </div>
              <button onClick={() => { setShowSpreadsheetPeserta(false); setSelectedRows(new Set()); setAnchorRow(null); }} className="p-2 hover:bg-[#F3F0F5] rounded-full flex-shrink-0"><X size={20}/></button>
            </div>
            {selectedRows.size > 0 && (
              <div className="px-5 py-3 bg-[#EDE7FF] border-b border-[#6750A4]/20 flex items-center gap-3 flex-wrap flex-shrink-0">
                <span className="text-xs font-bold text-white bg-[#6750A4] px-2.5 py-1 rounded-full">{selectedRows.size} baris dipilih</span>
                <span className="text-xs text-[#49454F]">Ubah kategori:</span>
                <div className="flex gap-1.5">
                  {['Karyawan','Magang','Visitor','Kontraktor'].map(k => (
                    <button key={k} onClick={() => { setBulkKategori(k); setSpreadsheetPesertaRows(rows => rows.map((r,i) => selectedRows.has(i) ? {...r, kategori:k} : r)); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${bulkKategori === k ? 'bg-[#6750A4] text-white border-[#6750A4]' : 'bg-white text-[#6750A4] border-[#6750A4]/40 hover:border-[#6750A4]'}`}>{k}</button>
                  ))}
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => { setSpreadsheetPesertaRows(rows => rows.filter((_,i) => !selectedRows.has(i))); setSelectedRows(new Set()); setAnchorRow(null); }}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-[#B3261E] bg-white border border-[#B3261E]/30 hover:bg-[#F9DEDC] flex items-center gap-1"><Trash2 size={12}/> Hapus {selectedRows.size} baris</button>
                  <button onClick={() => { setSelectedRows(new Set()); setAnchorRow(null); setBulkKategori(''); }} className="px-3 py-1 rounded-lg text-xs text-[#49454F] hover:bg-white border border-transparent hover:border-[#E6E1E5]">✕ Batal</button>
                </div>
              </div>
            )}
            <div className="overflow-auto flex-1 p-4">
              <table className="border-collapse text-sm" style={{minWidth:'700px', width:'100%', userSelect:'none'}}>
                <thead>
                  <tr className="bg-[#6750A4] text-white">
                    <th className="px-2 py-2.5 border border-[#4F378B] w-10 text-center cursor-pointer hover:bg-[#4F378B] text-xs"
                      onClick={() => { if (selectedRows.size === spreadsheetPesertaRows.length && spreadsheetPesertaRows.length > 0) { setSelectedRows(new Set()); setAnchorRow(null); } else { setSelectedRows(new Set(spreadsheetPesertaRows.map((_,i)=>i))); setAnchorRow(0); } setBulkKategori(''); }}>
                      {selectedRows.size === spreadsheetPesertaRows.length && spreadsheetPesertaRows.length > 0 ? '☑' : '#'}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'150px'}}>NIK / No. ID *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'180px'}}>Nama Lengkap *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'160px'}}>Perusahaan *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'120px'}}>Kategori</th>
                    <th className="px-2 py-2.5 border border-[#4F378B] w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetPesertaRows.map((row, ri) => {
                    const isSelected = selectedRows.has(ri);
                    const handleNumMouseDown = (e: React.MouseEvent) => {
                      e.preventDefault(); isDraggingRef.current = true;
                      if (e.shiftKey && anchorRow !== null) { const min = Math.min(anchorRow, ri); const max = Math.max(anchorRow, ri); const next = new Set<number>(); for (let i = min; i <= max; i++) next.add(i); setSelectedRows(next); }
                      else if (e.ctrlKey || e.metaKey) { const next = new Set(selectedRows); if (next.has(ri)) next.delete(ri); else next.add(ri); setSelectedRows(next); setAnchorRow(ri); }
                      else { setSelectedRows(new Set([ri])); setAnchorRow(ri); }
                      setBulkKategori('');
                    };
                    const handleNumMouseEnter = () => { if (!isDraggingRef.current) return; if (anchorRow !== null) { const min = Math.min(anchorRow, ri); const max = Math.max(anchorRow, ri); const next = new Set<number>(); for (let i = min; i <= max; i++) next.add(i); setSelectedRows(next); } };
                    const handlePaste = (col: string) => (e: React.ClipboardEvent<HTMLInputElement>) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      const lines = text.split('\n').map((l: string) => l.replace(/\r/g, '')).filter((l: string) => l.trim());
                      const colOrder = ['nik','nama','perusahaan','kategori'];
                      const startColIdx = colOrder.indexOf(col);
                      const newRows = [...spreadsheetPesertaRows];
                      lines.forEach((line: string, li: number) => {
                        const cells = line.split('\t');
                        const idx = ri + li;
                        const rowData: any = idx < newRows.length ? {...newRows[idx]} : {...emptyPesertaRow()};
                        cells.forEach((cell: string, ci: number) => { const targetColIdx = startColIdx + ci; if (targetColIdx < colOrder.length) rowData[colOrder[targetColIdx]] = cell.trim() || rowData[colOrder[targetColIdx]]; });
                        if (idx < newRows.length) newRows[idx] = rowData; else newRows.push(rowData);
                      });
                      setSpreadsheetPesertaRows(newRows);
                    };
                    return (
                      <tr key={ri} className={isSelected ? 'bg-[#EDE7FF]' : ri % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                        <td className="border border-[#E6E1E5] text-center cursor-pointer p-0" onMouseDown={handleNumMouseDown} onMouseEnter={handleNumMouseEnter}>
                          <div className={`w-full h-full px-2 py-1.5 flex items-center justify-center text-xs font-bold transition-all ${isSelected ? 'bg-[#6750A4] text-white' : 'text-[#9CA3AF] hover:bg-[#EADDFF] hover:text-[#6750A4]'}`}>{ri + 1}</div>
                        </td>
                        {(['nik','nama','perusahaan'] as const).map(col => (
                          <td key={col} className="border border-[#E6E1E5] p-0">
                            <input value={row[col]} placeholder={col === 'nik' ? 'Klik lalu Ctrl+V' : ''} onChange={e => { const nr=[...spreadsheetPesertaRows]; nr[ri]={...nr[ri],[col]:e.target.value}; setSpreadsheetPesertaRows(nr); }} onPaste={handlePaste(col)} style={{userSelect:'text'}} className={`w-full px-2 py-1.5 outline-none text-xs focus:bg-[#EDE7FF] ${isSelected ? 'bg-[#EDE7FF]' : ''}`} />
                          </td>
                        ))}
                        <td className="border border-[#E6E1E5] p-0">
                          <select value={row.kategori} onChange={e => { const nr=[...spreadsheetPesertaRows]; nr[ri]={...nr[ri],kategori:e.target.value}; setSpreadsheetPesertaRows(nr); }} className={`w-full px-2 py-1.5 outline-none text-xs bg-transparent ${isSelected ? 'bg-[#EDE7FF] font-bold text-[#6750A4]' : ''}`}>
                            {['Karyawan','Magang','Visitor','Kontraktor'].map(k=><option key={k}>{k}</option>)}
                          </select>
                        </td>
                        <td className="border border-[#E6E1E5] text-center p-0">
                          <button onClick={() => { setSpreadsheetPesertaRows(rows=>rows.filter((_,i)=>i!==ri)); const next=new Set(selectedRows); next.delete(ri); setSelectedRows(next); }} className="p-1.5 text-[#CAC4D0] hover:text-[#B3261E]"><X size={14}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between gap-3 flex-shrink-0">
              <button onClick={() => setSpreadsheetPesertaRows(r => [...r, ...Array.from({length:5},emptyPesertaRow)])} className="px-4 py-2 rounded-xl border border-[#E6E1E5] text-sm font-medium hover:bg-[#F3F0F5] flex items-center gap-2"><Plus size={16}/> Tambah 5 Baris</button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#49454F]">{spreadsheetPesertaRows.filter(r=>r.nik&&r.nama&&r.perusahaan).length} baris valid</span>
                <button onClick={() => { setShowSpreadsheetPeserta(false); setSelectedRows(new Set()); setAnchorRow(null); setBulkKategori(''); }} className="px-5 py-2.5 rounded-xl border border-[#E6E1E5] font-bold text-[#49454F]">Batal</button>
                <button onClick={handleSaveSpreadsheetPeserta} disabled={savingSpreadsheet} className="px-6 py-2.5 rounded-xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50 flex items-center gap-2"><Save size={16}/>{savingSpreadsheet ? 'Menyimpan...' : 'Simpan Semua'}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Spreadsheet Modal Soal */}
      {showSpreadsheetSoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="bg-white rounded-[24px] w-full max-w-7xl shadow-2xl border border-[#E6E1E5] flex flex-col" style={{maxHeight:'95vh'}}>
            <div className="p-5 border-b border-[#E6E1E5] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Table2 size={20} className="text-[#006A6A]" /> Input Soal via Spreadsheet</h3>
                <p className="text-xs text-[#49454F] mt-0.5">Jenis: <span className="font-bold text-[#6750A4]">{jenisUjian.find(j=>j.id===spreadsheetJenisId)?.nama}</span></p>
              </div>
              <button onClick={() => setShowSpreadsheetSoal(false)} className="p-2 hover:bg-[#F3F0F5] rounded-full flex-shrink-0"><X size={20}/></button>
            </div>
            <div className="px-5 py-3 bg-[#F0FAFA] border-b border-[#006A6A]/10 flex-shrink-0">
              <p className="text-xs font-bold text-[#006A6A] mb-2">📋 Format Excel yang didukung:</p>
              <div className="flex flex-wrap gap-2">
                {[{label:'Format 1',desc:'Pertanyaan | A | B | C | D | A',color:'bg-[#E0F2F1] text-[#006A6A]'},{label:'Format 2',desc:'✓ atau * di depan pilihan benar',color:'bg-[#E8F5E9] text-[#2E7D32]'},{label:'Format 3',desc:'(benar) di akhir pilihan benar',color:'bg-[#FFF8E1] text-[#F57F17]'}].map(f=>(
                  <div key={f.label} className={`px-3 py-1.5 rounded-lg ${f.color}`}><span className="text-[10px] font-bold">{f.label}:</span><span className="text-[10px]"> {f.desc}</span></div>
                ))}
              </div>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <table className="border-collapse text-sm" style={{minWidth:'1000px', width:'100%'}}>
                <thead>
                  <tr className="bg-[#006A6A] text-white">
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40] w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'260px'}}>Pertanyaan *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan A *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan B *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan C *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan D *</th>
                    <th className="px-3 py-2.5 text-center text-xs border border-[#004D40] w-24">Kunci Jawaban</th>
                    <th className="px-2 py-2.5 border border-[#004D40] w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetSoalRows.map((row, ri) => {
                    const bgClass = ri % 2 === 0 ? 'bg-white' : 'bg-[#F0FAFA]';
                    const detectAndParse = (cells: string[]) => {
                      const markers = ['✓','✔','*','(benar)','(correct)','(jawaban)','[benar]','[correct]'];
                      let answer = '';
                      const cleaned = cells.slice(0, 4).map((cell, idx) => {
                        let c = (cell || '').trim();
                        for (const m of markers) {
                          if (c.toLowerCase().startsWith(m.toLowerCase())) { if (!answer) answer = String.fromCharCode(65 + idx); c = c.substring(m.length).trim(); }
                          else if (c.toLowerCase().endsWith(m.toLowerCase())) { if (!answer) answer = String.fromCharCode(65 + idx); c = c.substring(0, c.length - m.length).trim(); }
                        }
                        return c;
                      });
                      return { cleaned, answer };
                    };
                    const handlePaste = (col: string) => (e: React.ClipboardEvent<HTMLInputElement>) => {
                      e.preventDefault();
                      const raw = e.clipboardData.getData('text');
                      const lines = raw.split('\n').map((l:string) => l.replace(/\r/g,'')).filter((l:string) => l.trim());
                      const colOrder = ['pertanyaan','pilihan_a','pilihan_b','pilihan_c','pilihan_d','jawaban_benar'];
                      const startColIdx = colOrder.indexOf(col);
                      const newRows = [...spreadsheetSoalRows];
                      lines.forEach((line:string, li:number) => {
                        const cells = line.split('\t');
                        const idx = ri + li;
                        const rowData: any = idx < newRows.length ? {...newRows[idx]} : {...emptySoalRow()};
                        if (col === 'pertanyaan' && cells.length >= 5) {
                          const lastCell = (cells[5] || cells[cells.length-1] || '').trim().toUpperCase();
                          const isExplicitAnswer = /^[ABCD]$/.test(lastCell) && cells.length >= 6;
                          const { cleaned, answer } = detectAndParse(cells.slice(1, 5));
                          rowData.pertanyaan = cells[0]?.trim() || '';
                          rowData.pilihan_a = cleaned[0] || ''; rowData.pilihan_b = cleaned[1] || ''; rowData.pilihan_c = cleaned[2] || ''; rowData.pilihan_d = cleaned[3] || '';
                          if (isExplicitAnswer) rowData.jawaban_benar = lastCell; else if (answer) rowData.jawaban_benar = answer;
                        } else if (col === 'pertanyaan' && cells.length === 5) {
                          const col5 = (cells[4] || '').trim().toUpperCase();
                          if (/^[ABCD]$/.test(col5)) { const { cleaned } = detectAndParse(cells.slice(1, 4)); rowData.pertanyaan = cells[0]?.trim() || ''; rowData.pilihan_a = cleaned[0] || ''; rowData.pilihan_b = cleaned[1] || ''; rowData.pilihan_c = cleaned[2] || ''; rowData.jawaban_benar = col5; }
                          else { const { cleaned, answer } = detectAndParse(cells.slice(1, 5)); rowData.pertanyaan = cells[0]?.trim() || ''; rowData.pilihan_a = cleaned[0] || ''; rowData.pilihan_b = cleaned[1] || ''; rowData.pilihan_c = cleaned[2] || ''; rowData.pilihan_d = cleaned[3] || ''; if (answer) rowData.jawaban_benar = answer; }
                        } else {
                          cells.forEach((cell:string, ci:number) => { const tci = startColIdx + ci; if (tci < colOrder.length) { const tc = colOrder[tci]; rowData[tc] = tc === 'jawaban_benar' ? cell.trim().toUpperCase() || rowData[tc] : cell.trim() || rowData[tc]; } });
                        }
                        if (idx < newRows.length) newRows[idx] = rowData; else newRows.push(rowData);
                      });
                      setSpreadsheetSoalRows(newRows);
                    };
                    return (
                      <tr key={ri} className={bgClass}>
                        <td className="px-3 py-1 border border-[#E6E1E5] text-[#9CA3AF] text-center text-xs">{ri+1}</td>
                        {(['pertanyaan','pilihan_a','pilihan_b','pilihan_c','pilihan_d'] as const).map(col => (
                          <td key={col} className="border border-[#E6E1E5] p-0">
                            <input value={row[col]} placeholder={col === 'pertanyaan' ? 'Paste dari Excel di sini' : ''} onChange={e => { const nr=[...spreadsheetSoalRows]; nr[ri]={...nr[ri],[col]:e.target.value}; setSpreadsheetSoalRows(nr); }} onPaste={handlePaste(col)} className="w-full px-2 py-1.5 outline-none focus:bg-[#E0F2F1] text-xs" />
                          </td>
                        ))}
                        <td className="border border-[#E6E1E5] p-0">
                          <div className="flex items-center justify-center gap-0.5 px-1 py-1">
                            {['A','B','C','D'].map(v => (
                              <button key={v} onClick={() => { const nr=[...spreadsheetSoalRows]; nr[ri]={...nr[ri],jawaban_benar:v}; setSpreadsheetSoalRows(nr); }}
                                className={`w-7 h-7 rounded-lg text-[11px] font-black transition-all ${row.jawaban_benar === v ? 'bg-[#006A6A] text-white shadow-sm scale-110' : 'bg-[#F3F0F5] text-[#9CA3AF] hover:bg-[#E0F2F1] hover:text-[#006A6A]'}`}>{v}</button>
                            ))}
                          </div>
                        </td>
                        <td className="border border-[#E6E1E5] text-center p-0">
                          <button onClick={() => setSpreadsheetSoalRows(rows=>rows.filter((_,i)=>i!==ri))} className="p-1.5 text-[#CAC4D0] hover:text-[#B3261E]"><X size={14}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between gap-3 flex-shrink-0">
              <button onClick={() => setSpreadsheetSoalRows(r => [...r, ...Array.from({length:5},emptySoalRow)])} className="px-4 py-2 rounded-xl border border-[#E6E1E5] text-sm font-medium hover:bg-[#F3F0F5] flex items-center gap-2"><Plus size={16}/> Tambah 5 Baris</button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#49454F]">{spreadsheetSoalRows.filter(r=>r.pertanyaan&&r.pilihan_a&&r.pilihan_b&&r.pilihan_c&&r.pilihan_d).length} baris valid</span>
                <button onClick={() => setShowSpreadsheetSoal(false)} className="px-5 py-2.5 rounded-xl border border-[#E6E1E5] font-bold text-[#49454F]">Batal</button>
                <button onClick={handleSaveSpreadsheetSoal} disabled={savingSpreadsheet} className="px-6 py-2.5 rounded-xl bg-[#006A6A] text-white font-bold shadow-md hover:bg-[#004D40] disabled:opacity-50 flex items-center gap-2"><Save size={16}/>{savingSpreadsheet ? 'Menyimpan...' : 'Simpan Semua'}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Guide Modal - dipertahankan dari kode asli */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4">
          <motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}}
            className="bg-white rounded-[28px] w-full max-w-4xl shadow-2xl border border-[#E6E1E5] flex flex-col" style={{maxHeight:'92vh'}}>
            <div className="flex items-center justify-between p-6 border-b border-[#E6E1E5] flex-shrink-0"
              style={{background:'linear-gradient(135deg,#1A0533 0%,#2D1254 60%,#0F2A2A 100%)'}}>
              <div>
                <div className="flex items-center gap-2 mb-1"><HelpCircle size={20} className="text-[#E6A620]" /><span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E6A620]">EHS Learning System</span></div>
                <h3 className="text-xl font-black text-white">Panduan Admin Lengkap</h3>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="p-2 rounded-full hover:bg-white/10"><X size={20} className="text-white/70" /></button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-52 flex-shrink-0 border-r border-[#E6E1E5] overflow-y-auto bg-[#FDFCFB] p-3 space-y-1">
                {[{id:'alur',icon:'🗺️',label:'Alur Kerja Admin'},{id:'dashboard',icon:'📊',label:'Dashboard'},{id:'jenis',icon:'📋',label:'Jenis Ujian'},{id:'peserta',icon:'👥',label:'Peserta Master'},{id:'soal',icon:'❓',label:'Bank Soal'},{id:'hasil',icon:'📈',label:'Hasil Ujian'},{id:'remedial',icon:'🔄',label:'Request Remedial'},{id:'pengaturan',icon:'⚙️',label:'Pengaturan'}].map(item => (
                  <button key={item.id} onClick={() => setGuidePage(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${guidePage === item.id ? 'bg-[#6750A4] text-white' : 'hover:bg-[#F3F0F5] text-[#49454F]'}`}>
                    <div className="flex items-center gap-2"><span className="text-base">{item.icon}</span><p className={`text-xs font-bold ${guidePage === item.id ? 'text-white' : 'text-[#1C1B1F]'}`}>{item.label}</p></div>
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-sm text-[#49454F]">Pilih topik di sebelah kiri untuk membaca panduan detail.</p>
              </div>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between flex-shrink-0 bg-[#FDFCFB]">
              <p className="text-[10px] text-[#9CA3AF]">EHS Learning System — Panduan Admin</p>
              <button onClick={() => setShowGuideModal(false)} className="px-6 py-2.5 rounded-xl bg-[#6750A4] text-white font-bold text-sm hover:bg-[#4F378B]">Tutup Panduan</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
