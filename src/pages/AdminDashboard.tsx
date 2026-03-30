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
  Cell,
  LineChart,
  Line,
  Legend
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
        else { setJudul('Induksi & Keselamatan Kerja'); setDeskripsi('Platform ujian induksi keselamatan kerja profesional.'); }
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
          <input type="text" value={judul} onChange={e => setJudul(e.target.value)}
            placeholder="Contoh: Induksi & Keselamatan Kerja"
            className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4] text-sm" />
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
          <textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={3}
            placeholder="Deskripsi singkat sistem..."
            className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4] text-sm resize-none" />
        </div>
        <button onClick={handleSave} disabled={loading || !judul || !deskripsi}
          className="w-full py-3 bg-[#6750A4] text-white rounded-xl font-bold hover:bg-[#4F378B] transition-all disabled:opacity-50">
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

  // Dashboard filters
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

  // QR Modal states
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [qrData, setQrData] = useState<{url: string, name: string} | null>(null);
  
  // Viewing questions from Jenis Ujian
  const [viewingQuestionsJenis, setViewingQuestionsJenis] = useState<any>(null);
  
  // Grouping filters
  const [selectedGroupJenis, setSelectedGroupJenis] = useState<string | 'all'>('all');
  const [selectedSoalGroupJenis, setSelectedSoalGroupJenis] = useState<string | 'all'>('all');

  // Multi-select states
  const [selectedJenis, setSelectedJenis] = useState<string[]>([]);
  const [selectedPeserta, setSelectedPeserta] = useState<string[]>([]);
  const [selectedSoal, setSelectedSoal] = useState<string[]>([]);

  // Hasil Ujian view states
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

  // Export Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    jenis_id: 'all',
    period: 'all' as 'all' | 'daily' | 'monthly' | 'yearly',
    value: ''
  });

  // Modal states
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
    commitment_checkbox_text: 'Saya telah mengisi data dengan benar dan menyetujui pakta integritas.',
    tipe_ujian: 'khusus' as 'khusus' | 'umum'
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
  // Spreadsheet states
  const [showSpreadsheetPeserta, setShowSpreadsheetPeserta] = useState(false);
  const [showSpreadsheetSoal, setShowSpreadsheetSoal] = useState(false);
  const [spreadsheetJenisId, setSpreadsheetJenisId] = useState('');
  const [showSelectJenisModal, setShowSelectJenisModal] = useState(false);
  const [selectJenisMode, setSelectJenisMode] = useState<'peserta' | 'soal'>('peserta');
  // Spreadsheet rows
  const emptyPesertaRow = () => ({ nik: '', nama: '', perusahaan: '', kategori: 'Karyawan' });
  const emptySoalRow = () => ({ pertanyaan: '', pilihan_a: '', pilihan_b: '', pilihan_c: '', pilihan_d: '', jawaban_benar: 'A' });
  const [spreadsheetPesertaRows, setSpreadsheetPesertaRows] = useState<any[]>(Array.from({length: 10}, emptyPesertaRow));
  const [spreadsheetSoalRows, setSpreadsheetSoalRows] = useState<any[]>(Array.from({length: 10}, emptySoalRow));
  const [savingSpreadsheet, setSavingSpreadsheet] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkKategori, setBulkKategori] = useState('');
  const [anchorRow, setAnchorRow] = useState<number|null>(null);
  const isDraggingRef = React.useRef(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    role: 'admin' as any
  });
  const [newPeserta, setNewPeserta] = useState({
    nik: '',
    nama: '',
    perusahaan: '',
    kategori: 'Karyawan' as any,
    allowed_jenis_id: ''
  });

  const [showAddSoalModal, setShowAddSoalModal] = useState(false);
  const [newSoal, setNewSoal] = useState({
    jenis_ujian_id: '',
    pertanyaan: '',
    pilihan_a: '',
    pilihan_b: '',
    pilihan_c: '',
    pilihan_d: '',
    jawaban_benar: 'A' as any
  });

  const navigate = useNavigate();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  useEffect(() => {
    const stored = localStorage.getItem('ehs_admin');
    if (!stored) {
      navigate('/admin/login');
      return;
    }
    setAdmin(JSON.parse(stored));
    fetchData();
  }, [navigate]);

  useEffect(() => {
    const channel = supabase
      .channel('remedial_requests_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'remedial_requests',
        },
        (payload) => {
          const newReq = payload.new;
          const jenisName = jenisUjian.find(j => j.id === newReq.jenis_ujian_id)?.nama || 'Ujian';
          
          setNotification({
            id: newReq.id,
            nama: newReq.nama,
            nik: newReq.nik,
            jenis: jenisName,
            show: true
          });
          
          // Refresh data
          fetchData();

          // Auto hide after 5 seconds
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jenisUjian]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: resData, error: resError } = await supabase.from('hasil_ujian').select('*').order('waktu_selesai', { ascending: false });
      const { data: pesData, error: pesError } = await supabase.from('peserta_master').select('*');
      const { data: jenisData, error: jenisError } = await supabase.from('jenis_ujian').select('*');
      const { data: soalData, error: soalError } = await supabase.from('soal').select('*');
      const { data: adminData, error: adminError } = await supabase.from('users_admin').select('*');
      const { data: reqData, error: reqError } = await supabase.from('remedial_requests').select('*').order('created_at', { ascending: false });
      const { data: statData, error: statError } = await supabase.from('persistent_stats').select('*');
      
      if (resError) console.error('Error fetching results:', resError);
      if (pesError) console.error('Error fetching peserta:', pesError);
      if (jenisError) console.error('Error fetching jenis_ujian:', jenisError);
      if (soalError) console.error('Error fetching soal:', soalError);
      if (adminError) console.error('Error fetching admins:', adminError);
      if (reqError) console.error('Error fetching requests:', reqError);
      if (statError) console.error('Error fetching stats:', statError);

      if (resData) setResults(resData);
      if (pesData) setPeserta(pesData);
      if (jenisData) setJenisUjian(jenisData);
      if (soalData) setSoal(soalData);
      if (adminData) setAdmins(adminData);
      if (reqData) setRequests(reqData);
      if (statData) setPersistentStats(statData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      setNewJenis({ 
        nama: '', 
        timer_minutes: 30, 
        has_commitment: true, 
        is_active: true,
        limit_one_per_day: false,
        soal_display_count: 20,
        passing_score: 70,
        commitment_title: 'Pakta Integritas',
        commitment_content: 'Dengan ini saya menyatakan bahwa saya akan mengerjakan ujian ini dengan jujur dan tidak akan melakukan kecurangan dalam bentuk apapun.',
        commitment_checkbox_text: 'Saya telah mengisi data dengan benar dan menyetujui pakta integritas.',
        tipe_ujian: 'khusus' as 'khusus' | 'umum'
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan jenis ujian');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePeserta = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side check for duplicate NIK
    if (peserta.some(p => p.nik === newPeserta.nik)) {
      alert(`Gagal menyimpan: NIK ${newPeserta.nik} sudah terdaftar di database.`);
      return;
    }

    setLoading(true);
    try {
      // Sanitize data: convert empty allowed_jenis_id to null for DB compatibility
      const dataToSave = {
        ...newPeserta,
        allowed_jenis_id: newPeserta.allowed_jenis_id || null
      };

      const { error } = await supabase.from('peserta_master').insert([dataToSave]);
      if (error) throw error;
      
      // Increment persistent stat for total peserta
      await supabase.rpc('increment_stat', { stat_id: 'total_peserta' });

      setShowAddPesertaModal(false);
      setNewPeserta({ nik: '', nama: '', perusahaan: '', kategori: 'Karyawan', allowed_jenis_id: '' });
      fetchData();
      alert('Peserta berhasil disimpan!');
    } catch (err: any) {
      console.error('Error saving peserta:', err);
      const message = err.message || 'Terjadi kesalahan saat menyimpan data.';
      alert(`Gagal menyimpan peserta: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('soal').insert([newSoal]);
      if (error) throw error;
      setShowAddSoalModal(false);
      setNewSoal({
        jenis_ujian_id: '',
        pertanyaan: '',
        pilihan_a: '',
        pilihan_b: '',
        pilihan_c: '',
        pilihan_d: '',
        jawaban_benar: 'A'
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan soal.');
    } finally {
      setLoading(false);
    }
  };

  const deletePeserta = async (nik: string) => {
    setShowConfirmModal({
      show: true,
      title: 'Hapus Peserta',
      message: 'Apakah Anda yakin ingin menghapus peserta ini? Data hasil ujian peserta tetap tersimpan permanen.',
      onConfirm: async () => {
        try {
          // Hanya hapus remedial_requests, BUKAN hasil_ujian (data historis tetap ada)
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

  const deleteHasil = async (id: string) => {
    setShowConfirmModal({
      show: true,
      title: 'Hapus Hasil Ujian',
      message: 'Apakah Anda yakin ingin menghapus hasil ujian ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('hasil_ujian').delete().eq('id', id);
          if (error) throw error;
          fetchData();
        } catch (err: any) {
          alert('Gagal menghapus hasil ujian: ' + err.message);
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
        await supabase.from('soal').delete().eq('id', id);
        fetchData();
        setShowConfirmModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  const toggleJenisStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setJenisUjian(prev => prev.map(j => j.id === id ? { ...j, is_active: !currentStatus } : j));
    try {
      const { error } = await supabase
        .from('jenis_ujian')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) {
        // Rollback jika gagal
        setJenisUjian(prev => prev.map(j => j.id === id ? { ...j, is_active: currentStatus } : j));
        console.error(error);
      } else {
        fetchData();
      }
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
      commitment_checkbox_text: jenis.commitment_checkbox_text || 'Saya telah mengisi data dengan benar dan menyetujui pakta integritas.',
      tipe_ujian: jenis.tipe_ujian || 'khusus'
    });
    setShowEditJenisModal(true);
  };

  const handleResetData = () => {
    setResetPasswordInput('');
    setResetPasswordError('');
    setShowResetConfirmModal(true);
  };

  const handleConfirmReset = async () => {
    const { data: adminData } = await supabase
      .from('users_admin')
      .select('password_hash')
      .eq('id', admin?.id)
      .single();

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
    } catch (err) {
      console.error(err);
      alert('Gagal mereset data.');
    } finally {
      setLoading(false);
    }
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
    } catch (err) {
      console.error(err);
      alert('Gagal melakukan backup database');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users_admin')
        .update({ password_hash: newPassword }) // In a real app, this should be hashed
        .eq('id', admin?.id);
      
      if (error) throw error;
      alert('Password berhasil diperbarui');
      setShowSecurityModal(false);
      setNewPassword('');
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJenis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('jenis_ujian')
        .update({
          nama: editingJenis.nama,
          timer_minutes: editingJenis.limit_one_per_day ? -Math.abs(editingJenis.timer_minutes) : Math.abs(editingJenis.timer_minutes),
          has_commitment: editingJenis.has_commitment,
          is_active: editingJenis.is_active,
          limit_one_per_day: editingJenis.limit_one_per_day,
          soal_display_count: editingJenis.soal_display_count,
          passing_score: editingJenis.passing_score,
          commitment_title: editingJenis.commitment_title,
          commitment_content: editingJenis.commitment_content,
          commitment_checkbox_text: editingJenis.commitment_checkbox_text,
          tipe_ujian: editingJenis.tipe_ujian || 'khusus'
        })
        .eq('id', editingJenis.id);
      
      if (error) throw error;
      setShowEditJenisModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui jenis ujian');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('remedial_requests')
        .update({ status: 'approved' })
        .eq('id', requestId);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('remedial_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(err);
    }
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
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const bulkDeletePeserta = async () => {
    setShowConfirmModal({
      show: true,
      title: 'Hapus Peserta',
      message: `Hapus ${selectedPeserta.length} peserta terpilih? Data hasil ujian mereka tetap tersimpan permanen.`,
      onConfirm: async () => {
        try {
          // Hanya hapus remedial_requests, BUKAN hasil_ujian
          await supabase.from('remedial_requests').delete().in('nik', selectedPeserta);
          const { error } = await supabase.from('peserta_master').delete().in('nik', selectedPeserta);
          if (error) throw error;
          setSelectedPeserta([]);
          fetchData();
          setShowConfirmModal(prev => ({ ...prev, show: false }));
        } catch (err: any) {
          console.error(err);
          alert('Gagal menghapus beberapa peserta: ' + err.message);
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
        } catch (err) {
          console.error(err);
        }
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
    const template = [
      { 
        'Nama Jenis Ujian': jenisUjian[0]?.nama || 'CONTOH: Karyawan Baru', 
        Pertanyaan: 'Apa kepanjangan dari K3?', 
        'Pilihan A': 'Keselamatan dan Kesehatan Kerja',
        'Pilihan B': 'Kesehatan dan Keselamatan Kerja',
        'Pilihan C': 'Keamanan dan Kesehatan Kerja',
        'Pilihan D': 'Kerapihan dan Kebersihan Kerja',
        'Jawaban Benar (A/B/C/D)': 'A'
      }
    ];
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
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const formattedData = data.map(row => {
          const namaJenis = row['Jenis Ujian'] || row.jenis_ujian;
          const jenis = jenisUjian.find(j => j.nama.toLowerCase() === String(namaJenis).toLowerCase());
          
          return {
            nik: String(row.NIK || row.nik),
            nama: row.Nama || row.nama,
            perusahaan: row.Perusahaan || row.perusahaan,
            kategori: row.Kategori || row.kategori || 'Karyawan',
            allowed_jenis_id: targetJenisId || jenis?.id || null
          };
        });

        const { error } = await supabase.from('peserta_master').upsert(formattedData, { onConflict: 'nik' });
        if (error) throw error;
        alert('Data peserta berhasil diunggah!');
        setShowUploadPesertaModal(false);
        setUploadFile(null);
        setTargetJenisId('');
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Gagal mengunggah data. Pastikan format file sesuai template.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(fileToUpload);
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('users_admin').insert([{
        username: newAdmin.username,
        password_hash: newAdmin.password,
        role: newAdmin.role,
        is_approved: true
      }]);
      if (error) throw error;
      setShowAddAdminModal(false);
      setNewAdmin({ username: '', password: '', role: 'admin' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSpreadsheetPeserta = async () => {
    const validRows = spreadsheetPesertaRows.filter(r => r.nik && r.nama && r.perusahaan);
    if (validRows.length === 0) { alert('Tidak ada data valid. Pastikan NIK, Nama, dan Perusahaan terisi.'); return; }
    setSavingSpreadsheet(true);
    try {
      const data = validRows.map(r => ({
        nik: String(r.nik).trim(),
        nama: String(r.nama).trim(),
        perusahaan: String(r.perusahaan).trim(),
        kategori: r.kategori || 'Karyawan',
        allowed_jenis_id: spreadsheetJenisId || null
      }));
      const { error } = await supabase.from('peserta_master').upsert(data, { onConflict: 'nik' });
      if (error) throw error;
      alert(`${validRows.length} peserta berhasil disimpan!`);
      setShowSpreadsheetPeserta(false);
      scrollToTop();
      setSpreadsheetPesertaRows(Array.from({length: 10}, emptyPesertaRow));
      setSpreadsheetJenisId('');
      fetchData();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'));
    } finally { setSavingSpreadsheet(false); }
  };

  const handleSaveSpreadsheetSoal = async () => {
    const validRows = spreadsheetSoalRows.filter(r => r.pertanyaan && r.pilihan_a && r.pilihan_b && r.pilihan_c && r.pilihan_d && r.jawaban_benar);
    if (validRows.length === 0) { alert('Tidak ada data valid. Pastikan semua kolom terisi.'); return; }
    if (!spreadsheetJenisId) { alert('Pilih jenis ujian terlebih dahulu.'); return; }
    setSavingSpreadsheet(true);
    try {
      const data = validRows.map(r => ({
        jenis_ujian_id: spreadsheetJenisId,
        pertanyaan: String(r.pertanyaan).trim(),
        pilihan_a: String(r.pilihan_a).trim(),
        pilihan_b: String(r.pilihan_b).trim(),
        pilihan_c: String(r.pilihan_c).trim(),
        pilihan_d: String(r.pilihan_d).trim(),
        jawaban_benar: String(r.jawaban_benar).toUpperCase().trim()
      }));
      const { error } = await supabase.from('soal').insert(data);
      if (error) throw error;
      alert(`${validRows.length} soal berhasil disimpan!`);
      setShowSpreadsheetSoal(false);
      scrollToTop();
      setSpreadsheetSoalRows(Array.from({length: 10}, emptySoalRow));
      setSpreadsheetJenisId('');
      fetchData();
    } catch (err: any) {
      alert('Gagal menyimpan: ' + (err.message || 'Terjadi kesalahan'));
    } finally { setSavingSpreadsheet(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('ehs_admin');
    navigate('/admin/login');
  };

  const handleFileUploadSoal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const formattedData = data.map(row => {
          const namaJenis = row['Nama Jenis Ujian'] || row.nama_jenis;
          const jenis = jenisUjian.find(j => j.nama.toLowerCase() === String(namaJenis).toLowerCase());
          
          return {
            jenis_ujian_id: jenis?.id || row.jenis_ujian_id,
            pertanyaan: row.Pertanyaan || row.pertanyaan,
            pilihan_a: row['Pilihan A'] || row.pilihan_a,
            pilihan_b: row['Pilihan B'] || row.pilihan_b,
            pilihan_c: row['Pilihan C'] || row.pilihan_c,
            pilihan_d: row['Pilihan D'] || row.pilihan_d,
            jawaban_benar: row['Jawaban Benar (A/B/C/D)'] || row.jawaban_benar
          };
        }).filter(item => item.jenis_ujian_id);

        if (formattedData.length === 0) {
          throw new Error('Tidak ada data valid atau Nama Jenis Ujian tidak ditemukan.');
        }

        const { error } = await supabase.from('soal').insert(formattedData);
        if (error) throw error;
        alert('Data soal berhasil diunggah!');
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Gagal mengunggah data. ' + (err instanceof Error ? err.message : 'Pastikan format file sesuai template.'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const performExport = () => {
    let filtered = [...results];

    // Filter by Jenis
    if (exportFilters.jenis_id !== 'all') {
      filtered = filtered.filter(r => r.jenis_ujian_id === exportFilters.jenis_id);
    }

    // Filter by Period
    if (exportFilters.period !== 'all') {
      if (!exportFilters.value) {
        alert('Silakan pilih periode terlebih dahulu');
        return;
      }

      filtered = filtered.filter(r => {
        const d = new Date(r.waktu_selesai);
        if (exportFilters.period === 'daily') {
          return format(d, 'yyyy-MM-dd') === exportFilters.value;
        } else if (exportFilters.period === 'monthly') {
          return format(d, 'yyyy-MM') === exportFilters.value;
        } else if (exportFilters.period === 'yearly') {
          return format(d, 'yyyy') === exportFilters.value;
        }
        return true;
      });
    }

    if (filtered.length === 0) {
      alert('Data yang diminta tidak ditemukan untuk filter tersebut.');
      return;
    }

    const exportData = filtered.map(r => ({
      'Waktu Selesai': format(new Date(r.waktu_selesai), 'dd/MM/yyyy HH:mm'),
      'Jenis Ujian': jenisUjian.find(j => j.id === r.jenis_ujian_id)?.nama || '-',
      'Nilai': r.nilai,
      'Nama': r.nama,
      'NIK': r.nik,
      'Perusahaan': r.perusahaan || peserta.find(p => p.nik === r.nik)?.perusahaan || '-',
      'Status Lulus': r.status_lulus ? 'LULUS' : 'TIDAK LULUS',
      'Status Perkawinan': r.profil_data.status || '-',
      'Agama': r.profil_data.agama || '-',
      'Tanggal Lahir': r.profil_data.tanggalLahir || '-',
      'Pendidikan': r.profil_data.pendidikan || '-',
      'Kontak Darurat': r.profil_data.kontakDarurat || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Ujian');
    
    let filename = 'EHS_Results';
    if (exportFilters.period !== 'all') filename += `_${exportFilters.value}`;
    XLSX.writeFile(wb, `${filename}.xlsx`);
    setShowExportModal(false);
  };

  // Analytics Data
  const stats = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all' 
      ? results 
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);

    const totalAttempts = filteredResults.length;
    const totalLulus = filteredResults.filter(r => r.status_lulus).length;
    const totalGagal = totalAttempts - totalLulus;
    const lulusRate = totalAttempts > 0 ? Math.round((totalLulus / totalAttempts) * 100) : 0;
    const avgNilai = totalAttempts > 0
      ? Math.round(filteredResults.reduce((sum, r) => sum + r.nilai, 0) / totalAttempts)
      : 0;

    // Unique peserta (by nik) dari hasil_ujian — tidak bergantung peserta_master
    const uniquePeserta = new Set(filteredResults.map(r => r.nik)).size;

    // Trend bulan ini vs bulan lalu
    const now = new Date();
    const thisMonth = filteredResults.filter(r => {
      const d = new Date(r.waktu_selesai);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = filteredResults.filter(r => {
      const d = new Date(r.waktu_selesai);
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
    });
    const thisMonthLulusRate = thisMonth.length > 0
      ? Math.round((thisMonth.filter(r => r.status_lulus).length / thisMonth.length) * 100) : 0;
    const lastMonthLulusRate = lastMonth.length > 0
      ? Math.round((lastMonth.filter(r => r.status_lulus).length / lastMonth.length) * 100) : 0;
    const trendLulus = thisMonthLulusRate - lastMonthLulusRate;

    return {
      totalAttempts, totalLulus, totalGagal, lulusRate, avgNilai,
      uniquePeserta, thisMonthCount: thisMonth.length,
      trendLulus, totalUjianSistem: jenisUjian.length
    };
  }, [results, jenisUjian, dashboardFilterJenis]);

  // Pie chart: ambil kategori dari profil_data hasil_ujian ATAU fallback ke peserta_master
  const pieData = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all'
      ? results
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);

    const kategoris: Record<string, number> = { Karyawan: 0, Magang: 0, Visitor: 0, Kontraktor: 0 };
    filteredResults.forEach(r => {
      // Coba ambil dari peserta_master dulu, fallback ke profil_data
      const p = peserta.find(p => p.nik === r.nik);
      const kat = p?.kategori || (r.profil_data as any)?.kategori;
      if (kat && kategoris[kat] !== undefined) kategoris[kat]++;
      else kategoris['Karyawan']++; // default
    });
    return Object.entries(kategoris)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);
  }, [peserta, results, dashboardFilterJenis]);

  // Lulus vs Tidak Lulus donut
  const lulusDonutData = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all'
      ? results
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    const lulus = filteredResults.filter(r => r.status_lulus).length;
    const gagal = filteredResults.length - lulus;
    return [
      { name: 'Lulus', value: lulus },
      { name: 'Tidak Lulus', value: gagal },
    ].filter(d => d.value > 0);
  }, [results, dashboardFilterJenis]);

  // Top perusahaan
  const topPerusahaanData = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all'
      ? results
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    const map: Record<string, { total: number; lulus: number }> = {};
    filteredResults.forEach(r => {
      const nama = r.perusahaan || peserta.find(p => p.nik === r.nik)?.perusahaan || 'Tidak diketahui';
      if (!map[nama]) map[nama] = { total: 0, lulus: 0 };
      map[nama].total++;
      if (r.status_lulus) map[nama].lulus++;
    });
    return Object.entries(map)
      .map(([nama, d]) => ({ nama: nama.length > 20 ? nama.substring(0, 18) + '…' : nama, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [results, peserta, dashboardFilterJenis]);

  // Tren lulus per bulan (line chart)
  const trendLulusData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const filteredResults = dashboardFilterJenis === 'all'
      ? results
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return months.map((name, i) => {
      const monthResults = filteredResults.filter(r => {
        const d = new Date(r.waktu_selesai);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      });
      const total = monthResults.length;
      const lulus = monthResults.filter(r => r.status_lulus).length;
      return { name, total, lulus, rate: total > 0 ? Math.round((lulus / total) * 100) : 0 };
    });
  }, [results, dashboardFilterJenis]);

  // Ringkasan per jenis ujian
  const perJenisData = useMemo(() => {
    return jenisUjian.map(j => {
      const r = results.filter(x => x.jenis_ujian_id === j.id);
      const lulus = r.filter(x => x.status_lulus).length;
      const avg = r.length > 0 ? Math.round(r.reduce((s, x) => s + x.nilai, 0) / r.length) : 0;
      return {
        nama: j.nama,
        total: r.length,
        lulus,
        lulusRate: r.length > 0 ? Math.round((lulus / r.length) * 100) : 0,
        avgNilai: avg,
      };
    }).filter(j => j.total > 0).sort((a, b) => b.total - a.total);
  }, [results, jenisUjian]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all'
      ? results
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    return filteredResults.slice(0, 8);
  }, [results, dashboardFilterJenis]);

  const barChartMonthData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const filteredResults = dashboardFilterJenis === 'all' 
      ? results 
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);

    const weeks = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
    return weeks.map((name, i) => {
      const monthResults = filteredResults.filter(r => {
        const d = new Date(r.waktu_selesai);
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return false;
        const day = d.getDate();
        if (i === 0) return day <= 7;
        if (i === 1) return day > 7 && day <= 14;
        if (i === 2) return day > 14 && day <= 21;
        return day > 21;
      });
      return { name, val: monthResults.length, lulus: monthResults.filter(r => r.status_lulus).length };
    });
  }, [results, dashboardFilterJenis]);

  const barChartYearData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const filteredResults = dashboardFilterJenis === 'all' 
      ? results 
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months.map((name, i) => {
      const val = filteredResults.filter(r => {
        const d = new Date(r.waktu_selesai);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      }).length;
      return { name, val };
    });
  }, [results, dashboardFilterJenis]);

  const COLORS = ['#6750A4', '#006A6A', '#B3261E', '#F57F17'];
  const LULUS_COLORS = ['#2E7D32', '#B3261E'];

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
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

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-[28px] p-6 md:p-8" style={{background:'linear-gradient(135deg,#1A0533 0%,#2D1254 40%,#0F2A2A 100%)'}}>
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10" style={{background:'radial-gradient(circle,#E6A620 0%,transparent 70%)'}} />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{color:'#E6A620'}}>EHS Learning System</p>
                  <h2 className="text-2xl md:text-3xl font-black text-white">Dashboard Analitik</h2>
                  <p className="text-sm mt-1" style={{color:'rgba(255,255,255,0.5)'}}>
                    {dashboardFilterJenis === 'all' ? 'Semua jenis ujian' : `Filter: ${jenisUjian.find(j=>j.id===dashboardFilterJenis)?.nama}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select value={dashboardFilterJenis} onChange={e=>setDashboardFilterJenis(e.target.value)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border-0 focus:ring-2 focus:ring-[#E6A620] outline-none"
                    style={{background:'rgba(255,255,255,0.12)',color:'white',backdropFilter:'blur(8px)',minWidth:'180px'}}>
                    <option value="all" style={{background:'#2D1254'}}>Semua Jenis Ujian</option>
                    {jenisUjian.map(j=><option key={j.id} value={j.id} style={{background:'#2D1254'}}>{j.nama}</option>)}
                  </select>
                  <button onClick={()=>setShowDashboardSettings(true)} className="p-2.5 rounded-xl transition-all" style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)'}}><Settings size={18}/></button>
                </div>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Ujian */}
              <div className="relative overflow-hidden rounded-[24px] p-5 flex flex-col justify-between min-h-[140px]" style={{background:'linear-gradient(135deg,#6750A4 0%,#4F378B 100%)'}}>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-15 bg-white"/>
                <div className="p-2 rounded-xl bg-white/20 w-fit"><Users size={16} className="text-white"/></div>
                <div>
                  <h3 className="text-3xl font-black text-white">{stats.totalAttempts}</h3>
                  <p className="text-xs font-bold text-white/80 mt-0.5">Total Ujian Selesai</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{stats.uniquePeserta} peserta unik</p>
                </div>
              </div>

              {/* Tingkat Lulus */}
              <div className="relative overflow-hidden rounded-[24px] p-5 flex flex-col justify-between min-h-[140px]" style={{background:'linear-gradient(135deg,#1B5E20 0%,#2E7D32 100%)'}}>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-15 bg-white"/>
                <div className="p-2 rounded-xl bg-white/20 w-fit"><CheckCircle2 size={16} className="text-white"/></div>
                <div>
                  <div className="flex items-end gap-1">
                    <h3 className="text-3xl font-black text-white">{stats.lulusRate}</h3>
                    <span className="text-lg font-black text-white/70 mb-0.5">%</span>
                  </div>
                  <p className="text-xs font-bold text-white/80 mt-0.5">Tingkat Kelulusan</p>
                  <div className="mt-1.5 bg-white/20 rounded-full h-1">
                    <div className="h-1 rounded-full bg-white transition-all" style={{width:`${stats.lulusRate}%`}}/>
                  </div>
                </div>
              </div>

              {/* Rata-rata Nilai */}
              <div className="rounded-[24px] p-5 flex flex-col justify-between bg-white border border-[#E6E1E5] shadow-sm min-h-[140px]">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-[#EADDFF]"><BarChart3 size={16} className="text-[#6750A4]"/></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stats.avgNilai>=70?'bg-[#E8F5E9] text-[#2E7D32]':'bg-[#FFF8E1] text-[#F57F17]'}`}>
                    {stats.avgNilai>=70?'✓ Baik':'⚠ Rendah'}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#1C1B1F]">{stats.avgNilai}</h3>
                  <p className="text-xs font-bold text-[#49454F] mt-0.5">Rata-rata Nilai</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">KKM = 75</p>
                </div>
              </div>

              {/* Bulan ini */}
              <div className="rounded-[24px] p-5 flex flex-col justify-between bg-white border border-[#E6E1E5] shadow-sm min-h-[140px]">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-[#FFF8E1]"><Clock size={16} className="text-[#F57F17]"/></div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stats.trendLulus>0?'bg-[#E8F5E9] text-[#2E7D32]':stats.trendLulus<0?'bg-[#F9DEDC] text-[#B3261E]':'bg-[#F3F0F5] text-[#49454F]'}`}>
                    {stats.trendLulus>0?`↑ +${stats.trendLulus}%`:stats.trendLulus<0?`↓ ${stats.trendLulus}%`:'→ Stabil'}
                  </span>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-[#1C1B1F]">{stats.thisMonthCount}</h3>
                  <p className="text-xs font-bold text-[#49454F] mt-0.5">Ujian Bulan Ini</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">vs bulan lalu</p>
                </div>
              </div>
            </div>

            {/* Row: Lulus Donut + Kategori Pie + Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Lulus vs Gagal Donut */}
              <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 rounded-full bg-[#2E7D32]"/>
                  <h4 className="text-sm font-bold text-[#1C1B1F]">Lulus vs Tidak Lulus</h4>
                </div>
                <p className="text-[10px] text-[#9CA3AF] mb-3 ml-3">Total: {stats.totalAttempts} ujian</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={lulusDonutData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                        {lulusDonutData.map((_, i) => <Cell key={i} fill={LULUS_COLORS[i % LULUS_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v)=>[`${v} peserta`,'Jumlah']} contentStyle={{borderRadius:'10px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-around mt-1">
                  {lulusDonutData.map((d,i)=>(
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{backgroundColor:LULUS_COLORS[i]}}/>
                      <span className="text-[10px] text-[#49454F]">{d.name} <span className="font-bold">({d.value})</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kategori Pie */}
              {dashboardConfig.showPieChart && (
                <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-4 rounded-full bg-[#6750A4]"/>
                    <h4 className="text-sm font-bold text-[#1C1B1F]">Kategori Peserta</h4>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] mb-3 ml-3">Berdasarkan data historis hasil ujian</p>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                          {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Pie>
                        <Tooltip formatter={(v)=>[`${v} peserta`,'Jumlah']} contentStyle={{borderRadius:'10px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {pieData.map((d,i)=>(
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{backgroundColor:COLORS[i]}}/>
                        <span className="text-[10px] text-[#49454F] truncate">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 rounded-full bg-[#F57F17]"/>
                  <h4 className="text-sm font-bold text-[#1C1B1F]">Aktivitas Terbaru</h4>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto" style={{maxHeight:'200px'}}>
                  {recentActivity.length === 0 && <p className="text-xs text-[#9CA3AF] text-center py-4">Belum ada data</p>}
                  {recentActivity.map(r=>(
                    <div key={r.id} className="flex items-center gap-3 py-1.5 border-b border-[#F3F0F5] last:border-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status_lulus?'bg-[#2E7D32]':'bg-[#B3261E]'}`}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1C1B1F] truncate">{r.nama}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{format(new Date(r.waktu_selesai),'dd MMM, HH:mm',{locale:id})}</p>
                      </div>
                      <span className={`text-[11px] font-black flex-shrink-0 ${r.nilai>=70?'text-[#2E7D32]':'text-[#B3261E]'}`}>{r.nilai}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bar Chart Bulanan */}
            {dashboardConfig.showBarChartMonth && (
              <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 rounded-full bg-[#6750A4]"/>
                  <h4 className="text-sm font-bold text-[#1C1B1F]">Ujian Bulan Ini — Per Minggu</h4>
                </div>
                <p className="text-[10px] text-[#9CA3AF] mb-4 ml-3">Perbandingan total ujian dan kelulusan per minggu</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartMonthData} barSize={22} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F0F5"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:11}}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:11}} allowDecimals={false}/>
                      <Tooltip cursor={{fill:'#F3F0F5'}} contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                      <Legend formatter={(v)=>v==='val'?'Total Ujian':'Lulus'} wrapperStyle={{fontSize:'11px'}}/>
                      <Bar dataKey="val" name="val" fill="#6750A4" radius={[5,5,0,0]}/>
                      <Bar dataKey="lulus" name="lulus" fill="#2E7D32" radius={[5,5,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tren Lulus + Year */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Line Chart Tren Kelulusan */}
              <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 rounded-full bg-[#2E7D32]"/>
                  <h4 className="text-sm font-bold text-[#1C1B1F]">Tren Kelulusan {new Date().getFullYear()}</h4>
                </div>
                <p className="text-[10px] text-[#9CA3AF] mb-4 ml-3">% kelulusan per bulan sepanjang tahun</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendLulusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F0F5"/>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:10}}/>
                      <YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:10}} domain={[0,100]} tickFormatter={v=>`${v}%`}/>
                      <Tooltip formatter={(v)=>[`${v}%`,'Tingkat Lulus']} contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                      <Line type="monotone" dataKey="rate" stroke="#2E7D32" strokeWidth={2.5} dot={{fill:'#2E7D32',r:3}} activeDot={{r:5}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Tahunan */}
              {dashboardConfig.showBarChartYear && (
                <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-4 rounded-full bg-[#006A6A]"/>
                    <h4 className="text-sm font-bold text-[#1C1B1F]">Total Ujian {new Date().getFullYear()}</h4>
                  </div>
                  <p className="text-[10px] text-[#9CA3AF] mb-4 ml-3">Jumlah ujian per bulan sepanjang tahun</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartYearData} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F0F5"/>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:10}}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fill:'#9CA3AF',fontSize:10}} allowDecimals={false}/>
                        <Tooltip cursor={{fill:'#F0FAFA'}} contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
                        <Bar dataKey="val" fill="#006A6A" radius={[5,5,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Top Perusahaan */}
            {topPerusahaanData.length > 0 && (
              <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 rounded-full bg-[#F57F17]"/>
                  <h4 className="text-sm font-bold text-[#1C1B1F]">Top Perusahaan Peserta</h4>
                </div>
                <p className="text-[10px] text-[#9CA3AF] mb-4 ml-3">6 perusahaan dengan jumlah peserta terbanyak</p>
                <div className="space-y-3">
                  {topPerusahaanData.map((p, i) => (
                    <div key={p.nama} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[#9CA3AF] w-4 text-right flex-shrink-0">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#1C1B1F] truncate">{p.nama}</span>
                          <span className="text-[10px] text-[#49454F] flex-shrink-0 ml-2">{p.total} ujian · {p.total>0?Math.round((p.lulus/p.total)*100):0}% lulus</span>
                        </div>
                        <div className="h-1.5 bg-[#F3F0F5] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#F57F17] transition-all" style={{width:`${topPerusahaanData[0].total>0?(p.total/topPerusahaanData[0].total)*100:0}%`}}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ringkasan per Jenis Ujian */}
            {perJenisData.length > 0 && (
              <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#E6E1E5]">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-[#6750A4]"/>
                    <h4 className="text-sm font-bold text-[#1C1B1F]">Ringkasan per Jenis Ujian</h4>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F3F0F5] text-[#49454F] text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3 font-bold">Nama Ujian</th>
                        <th className="px-5 py-3 font-bold text-center">Total</th>
                        <th className="px-5 py-3 font-bold text-center">Lulus</th>
                        <th className="px-5 py-3 font-bold text-center">% Lulus</th>
                        <th className="px-5 py-3 font-bold text-center">Avg Nilai</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E1E5]">
                      {perJenisData.map(j=>(
                        <tr key={j.nama} className="hover:bg-[#FDFCFB]">
                          <td className="px-5 py-3 text-xs font-bold text-[#6750A4]">{j.nama}</td>
                          <td className="px-5 py-3 text-center text-xs font-bold">{j.total}</td>
                          <td className="px-5 py-3 text-center"><span className="text-xs font-bold text-[#2E7D32]">{j.lulus}</span></td>
                          <td className="px-5 py-3 text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${j.lulusRate>=70?'bg-[#E8F5E9] text-[#2E7D32]':'bg-[#F9DEDC] text-[#B3261E]'}`}>{j.lulusRate}%</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`text-xs font-black ${j.avgNilai>=70?'text-[#2E7D32]':'text-[#B3261E]'}`}>{j.avgNilai}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'jenis_ujian' && (
          <div>
            {/* PC: Tabel */}
            <div className="hidden md:block bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#F3F0F5] text-[#49454F] text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4"><input type="checkbox" className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                      onChange={(e) => { if (e.target.checked) setSelectedJenis(jenisUjian.map(j => j.id)); else setSelectedJenis([]); }}
                      checked={selectedJenis.length === jenisUjian.length && jenisUjian.length > 0} /></th>
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
                      <td className="px-6 py-4"><input type="checkbox" className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                        checked={selectedJenis.includes(j.id)}
                        onChange={(e) => { if (e.target.checked) setSelectedJenis([...selectedJenis, j.id]); else setSelectedJenis(selectedJenis.filter(id => id !== j.id)); }} /></td>
                      <td className="px-6 py-4"><button onClick={() => setViewingQuestionsJenis(j)} className="font-bold text-[#6750A4] hover:underline text-left">{j.nama}</button></td>
                      <td className="px-6 py-4">{Math.abs(j.timer_minutes)} Menit</td>
                      <td className="px-6 py-4"><span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", j.timer_minutes < 0 ? "bg-[#E3F2FD] text-[#1565C0]" : "bg-[#F5F5F5] text-[#757575]")}>{j.timer_minutes < 0 ? 'Ya' : 'Tidak'}</span></td>
                      <td className="px-6 py-4">{j.has_commitment ? <span className="text-[#2E7D32] flex items-center gap-1 text-xs font-medium"><CheckCircle2 size={14} /> Aktif</span> : <span className="text-[#49454F] text-xs">Tidak Ada</span>}</td>
                      <td className="px-6 py-4"><span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold", j.tipe_ujian === 'umum' ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[#EDE7F6] text-[#4527A0]")}>{j.tipe_ujian === 'umum' ? '🌐 Umum' : '🔒 Khusus'}</span></td>
                      <td className="px-6 py-4"><button onClick={() => toggleJenisStatus(j.id, j.is_active)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase cursor-pointer transition-all hover:opacity-80 ${j.is_active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}>{j.is_active ? '🟢 ON' : '🔴 OFF'}</button></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => copyExamLink(j.id)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" title="Salin Link"><Copy size={18} /></button>
                          <button onClick={() => handleShowQR(j)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" title="QR Code"><QrCode size={18} /></button>
                          <button onClick={() => handleEditJenis(j)} className="p-2 text-[#49454F] hover:text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" title="Edit"><Settings size={18} /></button>
                          <button onClick={() => { if (confirm('Hapus jenis ujian ini?')) { supabase.from('jenis_ujian').delete().eq('id', j.id).then(() => fetchData()); } }} className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg transition-all" title="Hapus"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jenisUjian.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-[#49454F]">Belum ada data jenis ujian. Klik "Tambah Jenis" untuk memulai.</td></tr>}
                </tbody>
              </table>
            </div>
            {/* Mobile: Card */}
            <div className="md:hidden space-y-3">
              {jenisUjian.length === 0 && <div className="bg-white rounded-2xl border border-[#E6E1E5] p-8 text-center text-[#49454F]">Belum ada data jenis ujian.</div>}
              {jenisUjian.map((j) => (
                <div key={j.id} className="bg-white rounded-2xl border border-[#E6E1E5] shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4] mt-1 flex-shrink-0"
                      checked={selectedJenis.includes(j.id)}
                      onChange={(e) => { if (e.target.checked) setSelectedJenis([...selectedJenis, j.id]); else setSelectedJenis(selectedJenis.filter(id => id !== j.id)); }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <button onClick={() => setViewingQuestionsJenis(j)} className="font-bold text-[#6750A4] hover:underline text-left text-sm leading-tight">{j.nama}</button>
                        <button onClick={() => toggleJenisStatus(j.id, j.is_active)} className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${j.is_active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}>{j.is_active ? '🟢 ON' : '🔴 OFF'}</button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-[10px] bg-[#F3F0F5] text-[#49454F] px-2 py-0.5 rounded-full">{Math.abs(j.timer_minutes)} menit</span>
                        <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-bold", j.timer_minutes < 0 ? "bg-[#E3F2FD] text-[#1565C0]" : "bg-[#F5F5F5] text-[#757575]")}>{j.timer_minutes < 0 ? 'Limit 1x/hari' : 'Tanpa limit'}</span>
                        {j.has_commitment && <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full font-bold">Komitmen</span>}
                        <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-bold", j.tipe_ujian === 'umum' ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[#EDE7F6] text-[#4527A0]")}>{j.tipe_ujian === 'umum' ? '🌐 Umum' : '🔒 Khusus'}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => copyExamLink(j.id)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg" title="Salin Link"><Copy size={16} /></button>
                        <button onClick={() => handleShowQR(j)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg" title="QR Code"><QrCode size={16} /></button>
                        <button onClick={() => handleEditJenis(j)} className="p-2 text-[#49454F] hover:bg-[#EADDFF] rounded-lg" title="Edit"><Settings size={16} /></button>
                        <button onClick={() => { if (confirm('Hapus?')) { supabase.from('jenis_ujian').delete().eq('id', j.id).then(() => fetchData()); } }} className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg" title="Hapus"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'peserta' && (
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
                  {/* Select All */}
                  {(() => {
                    const filteredNiks = peserta
                      .filter(p => selectedGroupJenis === 'all_list' || p.allowed_jenis_id === selectedGroupJenis)
                      .filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.nik.includes(searchTerm))
                      .map(p => p.nik);
                    const allSelected = filteredNiks.length > 0 && filteredNiks.every(n => selectedPeserta.includes(n));
                    return (
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
                    );
                  })()}
                </div>
                <div className="p-6 space-y-3">
                  {peserta
                    .filter(p => selectedGroupJenis === 'all_list' || p.allowed_jenis_id === selectedGroupJenis)
                    .filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()) || p.nik.includes(searchTerm))
                    .map((p) => (
                    <div key={p.nik} className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                        checked={selectedPeserta.includes(p.nik)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPeserta([...selectedPeserta, p.nik]);
                          } else {
                            setSelectedPeserta(selectedPeserta.filter(nik => nik !== p.nik));
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
        )}

        {activeTab === 'soal' && (
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
                <div className="p-6 border-b border-[#E6E1E5] flex flex-col md:justify-between md:items-center bg-[#FDFCFB] gap-4">
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
                </div>
                <div className="p-6 space-y-3">
                  {soal
                    .filter(s => selectedSoalGroupJenis === 'all_list' || s.jenis_ujian_id === selectedSoalGroupJenis)
                    .filter(s => s.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((s) => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl border border-[#E6E1E5] shadow-sm hover:border-[#6750A4] transition-all flex items-center gap-4">
                      <input 
                        type="checkbox" 
                        className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4]"
                        checked={selectedSoal.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSoal([...selectedSoal, s.id]);
                          } else {
                            setSelectedSoal(selectedSoal.filter(id => id !== s.id));
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
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse min-w-[700px]">
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
                    <tr key={r.id} className="hover:bg-[#FDFCFB] transition-colors">
                      <td className="px-6 py-4 text-sm">
                        {format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#1C1B1F]">{r.nama}</p>
                        <p className="text-xs text-[#49454F] font-mono">{r.nik || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {r.perusahaan || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {jenisUjian.find(j => j.id === r.jenis_ujian_id)?.nama || 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                          r.status === 'pending' ? "bg-[#FFF8E1] text-[#F57F17]" :
                          r.status === 'approved' ? "bg-[#E8F5E9] text-[#2E7D32]" :
                          "bg-[#F9DEDC] text-[#B3261E]"
                        )}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.status === 'pending' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproveRequest(r.id)}
                              className="p-2 text-[#2E7D32] hover:bg-[#E8F5E9] rounded-lg transition-all"
                              title="Setujui"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleRejectRequest(r.id)}
                              className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg transition-all"
                              title="Tolak"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#49454F]">
                        Tidak ada request remedial saat ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'hasil' && (
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
                      {(() => {
                        const grouped = results.reduce((acc, curr) => {
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
                          return acc;
                        }, {} as Record<string, any>);

                        return Object.values(grouped)
                          .sort((a: any, b: any) => b.date.localeCompare(a.date))
                          .map((summary: any) => (
                            <tr 
                              key={`${summary.date}_${summary.jenis_id}`}
                              className="hover:bg-[#FDFCFB] transition-colors cursor-pointer group"
                              onClick={() => {
                                setSelectedHasilJenis(summary.jenis_id);
                                setSelectedHasilDate(summary.date);
                                setShowHasilDetail(true);
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
                          ));
                      })()}
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
                      {results
                        .filter(r => r.jenis_ujian_id === selectedHasilJenis && format(new Date(r.waktu_selesai), 'yyyy-MM-dd') === selectedHasilDate)
                        .filter(r => r.nama.toLowerCase().includes(searchTerm.toLowerCase()) || (r.nik && r.nik.includes(searchTerm)))
                        .map((r) => (
                        <tr key={r.id} className="hover:bg-[#FDFCFB] transition-colors">
                          <td className="px-4 md:px-6 py-4">
                            <p className="font-bold text-[#1C1B1F] text-xs md:text-sm">{r.nama}</p>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <p className="text-[10px] text-[#49454F] font-mono">{r.nik || '-'}</p>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-center">
                            <span className={`text-sm md:text-base font-black ${r.nilai >= 70 ? 'text-[#2E7D32]' : 'text-[#B3261E]'}`}>
                              {r.nilai}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <p className="text-xs text-[#49454F]">{r.perusahaan || peserta.find(p => p.nik === r.nik)?.perusahaan || '-'}</p>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              r.status_lulus ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'
                            }`}>
                              {r.status_lulus 
                                ? (r.profil_data.is_remedial ? 'Lulus Remedial' : 'Lulus') 
                                : (r.profil_data.is_remedial ? 'Tidak Lulus Remedial' : 'Tidak Lulus')
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
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
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
                          onClick={async () => {
                            if (confirm(`Hapus admin ${a.username}?`)) {
                              const { error } = await supabase.from('users_admin').delete().eq('id', a.id);
                              if (error) alert('Gagal menghapus admin');
                              else fetchData();
                            }
                          }}
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

            <LandingConfigEditor />
          </div>
        )}
      </main>

      {/* Real-time Notification */}
      <AnimatePresence>
        {notification && notification.show && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-6 right-6 z-[200] w-80 bg-white rounded-2xl shadow-2xl border border-[#E6E1E5] overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#EADDFF] text-[#6750A4] rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#1C1B1F] text-sm">Request Remedial Baru</h4>
                  <p className="text-xs text-[#49454F] mt-1 leading-relaxed">
                    <span className="font-bold">{notification.nama}</span> ({notification.nik}) meminta akses untuk <span className="font-bold">{notification.jenis}</span>.
                  </p>
                </div>
                <button onClick={() => setNotification(null)} className="text-[#49454F] hover:text-[#1C1B1F]">
                  <X size={16} />
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => {
                    setActiveTab('requests');
                    setNotification(null);
                  }}
                  className="flex-1 py-2 bg-[#6750A4] text-white text-xs font-bold rounded-lg hover:bg-[#4F378B] transition-all"
                >
                  Lihat Request
                </button>
              </div>
            </div>
            {/* Progress Bar */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-1 bg-[#6750A4]"
            />
          </motion.div>
        )}
      </AnimatePresence>

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
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Kategori</label>
                <select 
                  value={newPeserta.kategori}
                  onChange={e => setNewPeserta({...newPeserta, kategori: e.target.value as any})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                >
                  <option>Karyawan</option>
                  <option>Magang</option>
                  <option>Visitor</option>
                  <option>Kontraktor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Jenis Ujian yang Diizinkan</label>
                <select 
                  required
                  value={newPeserta.allowed_jenis_id}
                  onChange={e => setNewPeserta({...newPeserta, allowed_jenis_id: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                >
                  <option value="">Pilih Jenis Ujian...</option>
                  {jenisUjian.map(j => <option key={j.id} value={j.id}>{j.nama}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddPesertaModal(false)} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold">Batal</button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Peserta'}
                </button>
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
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Role</label>
                <select 
                  value={newAdmin.role}
                  onChange={e => setNewAdmin({...newAdmin, role: e.target.value as any})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
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

      {/* Guide Modal - Full 8 Pages */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4">
          <motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}}
            className="bg-white rounded-[28px] w-full max-w-4xl shadow-2xl border border-[#E6E1E5] flex flex-col" style={{maxHeight:'92vh'}}>
            <div className="flex items-center justify-between p-6 border-b border-[#E6E1E5] flex-shrink-0"
              style={{background:'linear-gradient(135deg,#1A0533 0%,#2D1254 60%,#0F2A2A 100%)'}}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle size={20} className="text-[#E6A620]" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#E6A620]">EHS Learning System</span>
                </div>
                <h3 className="text-xl font-black text-white">Panduan Admin Lengkap</h3>
                <p className="text-xs text-white/50 mt-0.5">Pilih topik di kiri untuk membaca panduan detail</p>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="p-2 rounded-full hover:bg-white/10 transition-all">
                <X size={20} className="text-white/70" />
              </button>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-52 flex-shrink-0 border-r border-[#E6E1E5] overflow-y-auto bg-[#FDFCFB] p-3 space-y-1">
                {[
                  { id: 'alur', icon: '🗺️', label: 'Alur Kerja Admin', sub: 'Mulai dari sini' },
                  { id: 'dashboard', icon: '📊', label: 'Dashboard', sub: 'Analitik & statistik' },
                  { id: 'jenis', icon: '📋', label: 'Jenis Ujian', sub: 'Kelola kategori ujian' },
                  { id: 'peserta', icon: '👥', label: 'Peserta Master', sub: 'Kelola data peserta' },
                  { id: 'soal', icon: '❓', label: 'Bank Soal', sub: 'Kelola soal ujian' },
                  { id: 'hasil', icon: '📈', label: 'Hasil Ujian', sub: 'Lihat & ekspor hasil' },
                  { id: 'remedial', icon: '🔄', label: 'Request Remedial', sub: 'Kelola ujian ulang' },
                  { id: 'pengaturan', icon: '⚙️', label: 'Pengaturan', sub: 'Sistem & tampilan' },
                ].map(item => (
                  <button key={item.id} onClick={() => setGuidePage(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${guidePage === item.id ? 'bg-[#6750A4] text-white shadow-sm' : 'hover:bg-[#F3F0F5] text-[#49454F]'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <p className={`text-xs font-bold leading-tight ${guidePage === item.id ? 'text-white' : 'text-[#1C1B1F]'}`}>{item.label}</p>
                        <p className={`text-[10px] leading-tight ${guidePage === item.id ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{item.sub}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {guidePage === 'alur' && (
                  <div>
                    <h4 className="text-lg font-black text-[#1C1B1F] mb-1">🗺️ Alur Kerja Admin — Dari Awal Sampai Akhir</h4>
                    <p className="text-xs text-[#49454F] mb-4">Ikuti langkah-langkah berikut secara berurutan agar sistem berjalan dengan benar.</p>
                    <div className="bg-[#EDE7FF] border border-[#6750A4]/20 rounded-xl p-3 mb-4">
                      <p className="text-xs font-bold text-[#6750A4]">📌 Urutan wajib:</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {['1. Buat Jenis Ujian','→','2. Masukkan Soal','→','3. Daftarkan Peserta','→','4. Aktifkan Sesi','→','5. Bagikan Link/QR','→','6. Pantau Hasil','→','7. Nonaktifkan Sesi'].map((t,i)=>(
                          <span key={i} className={t==='→'?'text-[#6750A4] font-black text-xs':'bg-white text-[#6750A4] font-bold text-[10px] px-2 py-0.5 rounded-lg'}>{t}</span>
                        ))}
                      </div>
                    </div>
                    {[
                      {step:'1',title:'Buat Jenis Ujian',tab:'Jenis Ujian',color:'#6750A4',bg:'#EADDFF',items:['Buka tab "Jenis Ujian" → klik "+ Tambah Jenis"','Isi nama, durasi, passing score, jumlah soal','Centang "Limit 1x/Hari" dan "Pakta Integritas" jika perlu','Simpan — status otomatis NONAKTIF (OFF)','Biarkan NONAKTIF sampai soal & peserta siap'],warn:'Jangan aktifkan sebelum soal dan peserta siap!'},
                      {step:'2',title:'Masukkan Soal ke Bank Soal',tab:'Bank Soal',color:'#006A6A',bg:'#E0F2F1',items:['Buka tab "Bank Soal" → klik "Input via Spreadsheet"','Pilih jenis ujian yang sesuai','Paste data dari Excel langsung ke grid','Kunci jawaban terdeteksi otomatis','Klik "Simpan Semua"'],warn:'Jika bank soal kosong, peserta tidak bisa memulai ujian.'},
                      {step:'3',title:'Daftarkan Peserta',tab:'Peserta Master',color:'#1565C0',bg:'#E3F2FD',items:['Buka tab "Peserta Master" → "Input via Spreadsheet"','Pilih jenis pelatihan','Paste data dari Excel (NIK | Nama | Perusahaan)','Cek baris valid → Simpan Semua'],warn:'NIK harus unik. Jika NIK sudah ada, data akan ter-update.'},
                      {step:'4',title:'Aktifkan Sesi & Bagikan',tab:'Jenis Ujian',color:'#2E7D32',bg:'#E8F5E9',items:['Kembali ke tab "Jenis Ujian"','Klik tombol "🔴 OFF" → berubah "🟢 ON"','Bagikan link: klik ikon 🔗 untuk salin URL','Atau tampilkan QR Code: klik ikon QR'],warn:'Nonaktifkan segera setelah sesi selesai.'},
                      {step:'5',title:'Pantau & Ekspor Hasil',tab:'Hasil Ujian',color:'#F57F17',bg:'#FFF8E1',items:['Buka tab "Hasil Ujian"','Data dikelompokkan per tanggal & jenis ujian','Klik baris untuk lihat detail nilai per peserta','Klik "Export Excel" untuk backup data'],warn:''},
                    ].map(s=>(
                      <div key={s.step} className="flex gap-4 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-sm" style={{background:s.bg,color:s.color}}>{s.step}</div>
                        <div className="flex-1 pb-4 border-b border-[#F3F0F5]">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-black text-[#1C1B1F]">{s.title}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:s.bg,color:s.color}}>→ Tab: {s.tab}</span>
                          </div>
                          <ul className="space-y-1 mb-2">{s.items.map((item,i)=>(
                            <li key={i} className="flex items-start gap-2 text-xs text-[#49454F]">
                              <span className="font-bold flex-shrink-0" style={{color:s.color}}>{i+1}.</span><span>{item}</span>
                            </li>
                          ))}</ul>
                          {s.warn&&<div className="flex items-start gap-2 bg-[#FFF8E1] border border-[#FFE082] rounded-lg px-3 py-2"><span className="text-sm flex-shrink-0">⚠️</span><p className="text-[10px] font-bold text-[#F57F17]">{s.warn}</p></div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {guidePage === 'dashboard' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-[#1C1B1F] mb-1">📊 Dashboard Analitik</h4>
                    <p className="text-xs text-[#49454F] leading-relaxed">Halaman utama yang menampilkan ringkasan statistik seluruh aktivitas ujian. Data diperbarui otomatis setiap ada ujian selesai.</p>
                    {[
                      {icon:'🔽',title:'Filter Jenis Ujian',desc:'Dropdown di hero banner untuk filter semua statistik per jenis ujian. Pilih "Semua Jenis Ujian" untuk data keseluruhan.'},
                      {icon:'👥',title:'Total Ujian Selesai',desc:'Jumlah total seluruh peserta yang telah menyelesaikan ujian. Termasuk attempt remedial. Tidak berkurang meski peserta master dihapus.'},
                      {icon:'✅',title:'Tingkat Kelulusan (%)',desc:'Persentase peserta yang lulus. Badge "Baik" jika ≥70%, "Perlu Perhatian" jika di bawah 70%. Progress bar menunjukkan pencapaian visual.'},
                      {icon:'🎯',title:'Rata-rata Nilai',desc:'Nilai rata-rata dari seluruh peserta. Badge "Di atas KKM" jika ≥70, "Di bawah KKM" jika di bawah 70. KKM default = 70.'},
                      {icon:'📅',title:'Ujian Bulan Ini + Tren',desc:'Jumlah ujian bulan berjalan. Badge tren: ↑ naik (hijau), ↓ turun (merah), → stabil (abu-abu) vs bulan lalu.'},
                      {icon:'🥧',title:'Distribusi Kategori & Lulus/Gagal',desc:'Pie chart kategori peserta + donut chart lulus vs tidak lulus. Hover untuk detail angka.'},
                      {icon:'📊',title:'Grafik Bulanan & Tahunan',desc:'Bar chart aktivitas per minggu (bulan ini) dan per bulan (tahun ini). Line chart tren kelulusan per bulan.'},
                      {icon:'🏢',title:'Top Perusahaan & Ringkasan Jenis',desc:'Horizontal bar chart 6 perusahaan teratas + tabel ringkasan statistik per jenis ujian.'},
                      {icon:'⚙️',title:'Pengaturan Dashboard',desc:'Klik ikon ⚙️ di hero banner untuk toggle tampilan chart. Aktif/nonaktifkan pie chart, bar bulanan, bar tahunan.'},
                    ].map((item,i)=>(
                      <div key={i} className="border border-[#E6E1E5] rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">{item.icon}</span>
                          <p className="font-bold text-[#1C1B1F] text-sm">{item.title}</p>
                        </div>
                        <p className="text-xs text-[#49454F] leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
                {guidePage === 'jenis' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-[#1C1B1F] mb-1">📋 Manajemen Jenis Ujian</h4>
                    <p className="text-xs text-[#49454F] leading-relaxed">Fondasi sistem. Semua soal, peserta, dan hasil terikat ke jenis ujian. Buat ini terlebih dahulu.</p>
                    {[
                      {title:'Membuat Jenis Ujian Baru',color:'#6750A4',steps:['Klik "+ Tambah Jenis" di pojok kanan atas','Isi Nama, Durasi (menit), Passing Score, Jumlah Soal','Centang "Limit 1x/Hari" — peserta hanya bisa mengerjakan sekali per hari','Centang "Pakta Integritas" — peserta harus setuju sebelum mulai','Klik Simpan — status otomatis NONAKTIF']},
                      {title:'Mengaktifkan/Menonaktifkan Sesi',color:'#2E7D32',steps:['Klik tombol "🔴 OFF" → berubah "🟢 ON" — sesi aktif','Klik "🟢 ON" → berubah "🔴 OFF" — sesi nonaktif','Perubahan berlaku INSTAN','Selalu nonaktifkan sesi setelah training selesai']},
                      {title:'Menyebarkan Link & QR Code',color:'#1565C0',steps:['Klik ikon 🔗 untuk salin URL ujian ke clipboard','Klik ikon QR untuk tampilkan QR Code besar','QR Code sudah terhubung ke jenis ujian spesifik']},
                      {title:'Menghapus Jenis Ujian',color:'#B3261E',steps:['Centang checkbox → klik "Hapus Terpilih"','PERINGATAN: Hapus jenis ujian akan PERMANEN menghapus SEMUA soal dan hasil ujian terkait!','Ekspor data terlebih dahulu sebelum menghapus']},
                    ].map((item,i)=>(
                      <div key={i} className="border border-[#E6E1E5] rounded-2xl p-4">
                        <p className="font-bold text-[#1C1B1F] text-sm mb-3">📌 {item.title}</p>
                        <ol className="space-y-1.5">{item.steps.map((s,j)=>(
                          <li key={j} className="flex items-start gap-2 text-xs text-[#49454F]">
                            <span className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:item.color}}>{j+1}</span>
                            <span className={s.startsWith('PERINGATAN')?'font-bold text-[#B3261E]':''}>{s}</span>
                          </li>
                        ))}</ol>
                      </div>
                    ))}
                  </div>
                )}
                {guidePage === 'peserta' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-[#1C1B1F] mb-1">👥 Manajemen Peserta Master</h4>
                    <p className="text-xs text-[#49454F] leading-relaxed">Hanya peserta dengan NIK terdaftar yang bisa login. Data peserta bisa diganti setiap sesi tanpa kehilangan data hasil ujian historis.</p>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-[#E8F5E9] border border-[#A5D6A7] rounded-xl p-3">
                        <p className="text-[10px] font-bold text-[#2E7D32]">✅ Tidak terhapus saat peserta dihapus:</p>
                        <p className="text-[10px] text-[#2E7D32] mt-1">Data hasil ujian, nilai, dan catatan kecurangan tetap tersimpan permanen.</p>
                      </div>
                      <div className="flex-1 bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-3">
                        <p className="text-[10px] font-bold text-[#F57F17]">⚠️ Perhatikan:</p>
                        <p className="text-[10px] text-[#F57F17] mt-1">NIK harus unik. Jika NIK sudah ada, data ter-update (bukan duplikat).</p>
                      </div>
                    </div>
                    {[
                      {title:'Input via Spreadsheet — Cara Tercepat',color:'#1565C0',steps:['Klik "Input via Spreadsheet" (tombol hijau)','Pilih jenis pelatihan','Klik sel NIK baris pertama → Ctrl+V dari Excel','Data mengisi otomatis: NIK → Nama → Perusahaan → Kategori','Cek "baris valid" di footer → Klik "Simpan Semua"']},
                      {title:'Block Selection untuk Ubah Kategori Massal',color:'#6750A4',steps:['Klik nomor baris (angka di kolom kiri) untuk pilih baris','Drag ke bawah untuk blok selection seperti Excel','Shift+klik untuk range, Ctrl+klik untuk toggle satu baris','Action bar muncul — klik tombol kategori untuk ubah semua sekaligus']},
                      {title:'Select All & Hapus Massal dari Daftar',color:'#B3261E',steps:['Centang "Pilih Semua (n)" di header daftar','Semua peserta yang tampil (sesuai filter) akan terpilih','Tombol "Hapus (n)" muncul di header halaman','Data hasil ujian TIDAK ikut terhapus']},
                    ].map((item,i)=>(
                      <div key={i} className="border border-[#E6E1E5] rounded-2xl p-4">
                        <p className="font-bold text-[#1C1B1F] text-sm mb-3">📌 {item.title}</p>
                        <ol className="space-y-1.5">{item.steps.map((s,j)=>(
                          <li key={j} className="flex items-start gap-2 text-xs text-[#49454F]">
                            <span className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:item.color}}>{j+1}</span>
                            <span>{s}</span>
                          </li>
                        ))}</ol>
                      </div>
                    ))}
                  </div>
                )}
                {guidePage === 'soal' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-[#1C1B1F] mb-1">❓ Manajemen Bank Soal</h4>
                    <p className="text-xs text-[#49454F] leading-relaxed">Sistem mengacak urutan soal DAN pilihan jawaban setiap sesi — setiap peserta mendapat kombinasi berbeda.</p>
                    <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-xl p-3">
                      <p className="text-xs font-bold text-[#2E7D32]">💡 Rekomendasi: masukkan minimal 2x jumlah soal yang ditampilkan</p>
                    </div>
                    {[
                      {title:'Input via Spreadsheet — Format Didukung',color:'#006A6A',steps:['Klik "Input via Spreadsheet" → pilih jenis ujian','Format 1: Pertanyaan | A | B | C | D | A (kolom ke-6 = kunci)','Format 2: ✓ atau * di depan pilihan benar','Format 3: (benar) di akhir pilihan benar','Paste di kolom Pertanyaan → kunci terdeteksi otomatis','Koreksi kunci dengan klik tombol A/B/C/D → Simpan Semua']},
                      {title:'Sistem Anti-Kecurangan Soal',color:'#6750A4',steps:['Urutan soal diacak setiap sesi','Urutan pilihan jawaban juga diacak','Hanya sebagian soal tampil dari total bank soal','Watermark Nama+NIK+Perusahaan di seluruh layar ujian','Sistem mendeteksi: tab switching, copy-paste, screenshot']},
                    ].map((item,i)=>(
                      <div key={i} className="border border-[#E6E1E5] rounded-2xl p-4">
                        <p className="font-bold text-[#1C1B1F] text-sm mb-3">📌 {item.title}</p>
                        <ol className="space-y-1.5">{item.steps.map((s,j)=>(
                          <li key={j} className="flex items-start gap-2 text-xs text-[#49454F]">
                            <span className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:item.color}}>{j+1}</span>
                            <span>{s}</span>
                          </li>
                        ))}</ol>
                      </div>
                    ))}
                  </div>
                )}
                {guidePage === 'hasil' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-[#1C1B1F] mb-1">📈 Laporan Hasil Ujian</h4>
                    <p className="text-xs text-[#49454F] leading-relaxed">Seluruh hasil ujian tersimpan permanen — tidak terhapus meskipun data peserta master diperbarui.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[{label:'Lulus',color:'#2E7D32',bg:'#E8F5E9',desc:'Skor ≥ passing score, ujian pertama'},{label:'Tidak Lulus',color:'#B3261E',bg:'#F9DEDC',desc:'Skor < passing score'},{label:'Lulus Remedial',color:'#1565C0',bg:'#E3F2FD',desc:'Lulus di ujian ulang'},{label:'Tidak Lulus Remedial',color:'#F57F17',bg:'#FFF8E1',desc:'Gagal di ujian ulang'}].map((s,i)=>(
                        <div key={i} className="rounded-xl p-2.5" style={{background:s.bg}}>
                          <p className="text-[10px] font-bold" style={{color:s.color}}>{s.label}</p>
                          <p className="text-[10px] mt-0.5" style={{color:s.color}}>{s.desc}</p>
                        </div>
                      ))}
                    </div>
                    {[
                      {title:'Membaca & Mengelola Hasil',color:'#F57F17',steps:['Hasil dikelompokkan per tanggal & jenis ujian','Klik baris untuk masuk ke detail per peserta','Klik ikon 📋 untuk lihat data kecurangan (tab switching, screenshot, copy)','Klik ikon 🗑️ di baris peserta untuk hapus hasil ujian individual','Klik "Export Excel" untuk backup ke file']},
                    ].map((item,i)=>(
                      <div key={i} className="border border-[#E6E1E5] rounded-2xl p-4">
                        <p className="font-bold text-[#1C1B1F] text-sm mb-3">📌 {item.title}</p>
                        <ol className="space-y-1.5">{item.steps.map((s,j)=>(
                          <li key={j} className="flex items-start gap-2 text-xs text-[#49454F]">
                            <span className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:item.color}}>{j+1}</span>
                            <span>{s}</span>
                          </li>
                        ))}</ol>
                      </div>
                    ))}
                  </div>
                )}
                {guidePage === 'remedial' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-[#1C1B1F] mb-1">🔄 Manajemen Request Remedial</h4>
                    <p className="text-xs text-[#49454F] leading-relaxed">Peserta yang gagal dapat mengajukan request remedial. Admin menentukan apakah disetujui atau ditolak.</p>
                    <div className="bg-[#E3F2FD] border border-[#90CAF9] rounded-xl p-3">
                      <p className="text-xs font-bold text-[#1565C0]">ℹ️ Alur remedial:</p>
                      <div className="mt-1 space-y-0.5">
                        {['1. Peserta selesai ujian → klik "Minta Ujian Ulang"','2. Request muncul di tab ini dengan status "Pending"','3. Admin tinjau → Setujui atau Tolak','4. Jika Disetujui: peserta bisa login kembali hari yang sama','5. Status berubah "Used" setelah peserta menggunakan slot'].map((t,i)=>(
                          <p key={i} className="text-[10px] text-[#1565C0]">{t}</p>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[{status:'Pending',color:'#F57F17',bg:'#FFF8E1',desc:'Belum diproses'},{status:'Approved',color:'#2E7D32',bg:'#E8F5E9',desc:'Peserta bisa login ulang'},{status:'Used',color:'#1565C0',bg:'#E3F2FD',desc:'Slot sudah digunakan'},{status:'Rejected',color:'#B3261E',bg:'#F9DEDC',desc:'Ditolak admin'}].map((s,i)=>(
                        <div key={i} className="rounded-xl p-2.5" style={{background:s.bg}}>
                          <p className="text-[10px] font-bold" style={{color:s.color}}>{s.status}</p>
                          <p className="text-[10px] mt-0.5" style={{color:s.color}}>{s.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border border-[#E6E1E5] rounded-2xl p-4">
                      <p className="font-bold text-[#1C1B1F] text-sm mb-2">📌 Cara memproses request</p>
                      <ul className="space-y-1.5">
                        {['Klik ✓ (centang hijau) untuk menyetujui — peserta langsung bisa login ulang','Klik ✗ (silang merah) untuk menolak','Setiap approval hanya berlaku 1 kali ujian ulang','Badge merah di sidebar = jumlah request pending yang belum diproses'].map((s,i)=>(
                          <li key={i} className="flex items-start gap-2 text-xs text-[#49454F]">
                            <span className="w-4 h-4 rounded-full bg-[#6750A4] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {guidePage === 'pengaturan' && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-black text-[#1C1B1F] mb-1">⚙️ Pengaturan Sistem</h4>
                    <p className="text-xs text-[#49454F] leading-relaxed">Kelola admin, tampilan landing page, dan pengaturan sistem. Sebagian fitur hanya untuk Super Admin.</p>
                    {[
                      {title:'Manajemen Administrator',color:'#6750A4',steps:['Klik "+ Tambah Admin" untuk buat akun baru','Admin baru perlu diverifikasi Super Admin sebelum bisa login','Klik 🗑️ untuk hapus akun — hanya Super Admin yang bisa']},
                      {title:'Edit Tampilan Landing Page',color:'#1565C0',steps:['Buka tab Pengaturan → bagian "Tampilan Landing Page"','Edit judul & deskripsi yang tampil di halaman login peserta','Klik Simpan — perubahan langsung berlaku']},
                      {title:'Reset Data (BERBAHAYA)',color:'#B3261E',steps:['EKSPOR DATA KE EXCEL TERLEBIH DAHULU!','Klik tombol Reset di Pengaturan Dashboard','Masukkan password konfirmasi','Proses tidak dapat dibatalkan']},
                    ].map((item,i)=>(
                      <div key={i} className="border border-[#E6E1E5] rounded-2xl p-4">
                        <p className="font-bold text-[#1C1B1F] text-sm mb-3">📌 {item.title}</p>
                        <ol className="space-y-1.5">{item.steps.map((s,j)=>(
                          <li key={j} className="flex items-start gap-2 text-xs text-[#49454F]">
                            <span className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:item.color}}>{j+1}</span>
                            <span className={s.startsWith('EKSPOR')?'font-bold text-[#B3261E]':''}>{s}</span>
                          </li>
                        ))}</ol>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between flex-shrink-0 bg-[#FDFCFB]">
              <p className="text-[10px] text-[#9CA3AF]">EHS Learning System — Panduan Admin v2.0</p>
              <button onClick={() => setShowGuideModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#6750A4] text-white font-bold text-sm hover:bg-[#4F378B] transition-all">
                Tutup Panduan
              </button>
            </div>
          </motion.div>
        </div>
      )}
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
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-1">Pilihan A</label>
                  <input type="text" required value={newSoal.pilihan_a} onChange={e => setNewSoal({...newSoal, pilihan_a: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-1">Pilihan B</label>
                  <input type="text" required value={newSoal.pilihan_b} onChange={e => setNewSoal({...newSoal, pilihan_b: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-1">Pilihan C</label>
                  <input type="text" required value={newSoal.pilihan_c} onChange={e => setNewSoal({...newSoal, pilihan_c: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-1">Pilihan D</label>
                  <input type="text" required value={newSoal.pilihan_d} onChange={e => setNewSoal({...newSoal, pilihan_d: e.target.value})} className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Jawaban Benar</label>
                <select 
                  value={newSoal.jawaban_benar}
                  onChange={e => setNewSoal({...newSoal, jawaban_benar: e.target.value as any})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                >
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                  <option>D</option>
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
              <button onClick={() => setShowDashboardSettings(false)} className="p-2 hover:bg-[#F3F0F5] rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <span className="text-sm font-medium text-[#49454F]">Tampilkan Pie Chart</span>
                <input 
                  type="checkbox" 
                  checked={dashboardConfig.showPieChart}
                  onChange={e => setDashboardConfig({...dashboardConfig, showPieChart: e.target.checked})}
                  className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <span className="text-sm font-medium text-[#49454F]">Tampilkan Bar Chart Bulanan</span>
                <input 
                  type="checkbox" 
                  checked={dashboardConfig.showBarChartMonth}
                  onChange={e => setDashboardConfig({...dashboardConfig, showBarChartMonth: e.target.checked})}
                  className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <span className="text-sm font-medium text-[#49454F]">Tampilkan Bar Chart Tahunan</span>
                <input 
                  type="checkbox" 
                  checked={dashboardConfig.showBarChartYear}
                  onChange={e => setDashboardConfig({...dashboardConfig, showBarChartYear: e.target.checked})}
                  className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]"
                />
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={handleResetData}
                  className="w-full py-3 bg-[#F9DEDC] text-[#B3261E] rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#F2B8B5] transition-all"
                >
                  <Trash2 size={18} /> Reset Seluruh Data
                </button>
                <p className="text-[10px] text-[#B3261E] mt-2 text-center">*Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <button 
              onClick={() => setShowDashboardSettings(false)}
              className="w-full mt-8 py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B]"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* Add Jenis Modal */}
      {showAddJenisModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5] my-auto">
            <h3 className="text-2xl font-bold mb-6">Tambah Jenis Ujian</h3>
            <form onSubmit={handleSaveJenis} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Nama Ujian / Training</label>
                <input 
                  type="text" 
                  required
                  value={newJenis.nama}
                  onChange={e => setNewJenis({...newJenis, nama: e.target.value})}
                  placeholder="Contoh: Induksi Karyawan Baru"
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Durasi (Menit)</label>
                <input 
                  type="number" 
                  required
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
                    <div className="text-[10px] text-[#49454F] mt-0.5">Peserta harus terdaftar</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewJenis({...newJenis, tipe_ujian: 'umum'})}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${newJenis.tipe_ujian === 'umum' ? 'border-[#E65100] bg-[#FFF3E0]' : 'border-[#E6E1E5] bg-[#F3F0F5]'}`}
                  >
                    <div className="font-bold text-sm text-[#1C1B1F]">🌐 Umum</div>
                    <div className="text-[10px] text-[#49454F] mt-0.5">Siapa saja bisa ikut</div>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#49454F]">Batasi 1x Per Hari</span>
                  <span className="text-[10px] text-[#49454F]">Kecuali diizinkan Admin</span>
                </div>
                <input
                  type="checkbox"
                  checked={newJenis.limit_one_per_day}
                  onChange={e => setNewJenis({...newJenis, limit_one_per_day: e.target.checked})}
                  className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Jumlah Soal</label>
                  <input 
                    type="number" required min="1"
                    value={newJenis.soal_display_count}
                    onChange={e => setNewJenis({...newJenis, soal_display_count: parseInt(e.target.value)})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Skor Lulus</label>
                  <input 
                    type="number" required min="0" max="100"
                    value={newJenis.passing_score}
                    onChange={e => setNewJenis({...newJenis, passing_score: parseInt(e.target.value)})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddJenisModal(false)}
                  className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Jenis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Tipe Ujian</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingJenis({...editingJenis, tipe_ujian: 'khusus'})}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${editingJenis.tipe_ujian === 'khusus' || !editingJenis.tipe_ujian ? 'border-[#6750A4] bg-[#EADDFF]' : 'border-[#E6E1E5] bg-[#F3F0F5]'}`}
                  >
                    <div className="font-bold text-sm text-[#1C1B1F]">🔒 Khusus</div>
                    <div className="text-[10px] text-[#49454F] mt-0.5">Peserta harus terdaftar</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingJenis({...editingJenis, tipe_ujian: 'umum'})}
                    className={`p-3 rounded-2xl border-2 text-left transition-all ${editingJenis.tipe_ujian === 'umum' ? 'border-[#E65100] bg-[#FFF3E0]' : 'border-[#E6E1E5] bg-[#F3F0F5]'}`}
                  >
                    <div className="font-bold text-sm text-[#1C1B1F]">🌐 Umum</div>
                    <div className="text-[10px] text-[#49454F] mt-0.5">Siapa saja bisa ikut</div>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#49454F]">Batasi 1x Per Hari</span>
                  <span className="text-[10px] text-[#49454F]">Kecuali diizinkan Admin</span>
                </div>
                <input
                  type="checkbox"
                  checked={editingJenis.limit_one_per_day}
                  onChange={e => setEditingJenis({...editingJenis, limit_one_per_day: e.target.checked})}
                  className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Jumlah Soal</label>
                  <input
                    type="number" required min="1"
                    value={editingJenis.soal_display_count}
                    onChange={e => setEditingJenis({...editingJenis, soal_display_count: parseInt(e.target.value)})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Skor Lulus</label>
                  <input 
                    type="number" required min="0" max="100"
                    value={editingJenis.passing_score}
                    onChange={e => setEditingJenis({...editingJenis, passing_score: parseInt(e.target.value)})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowEditJenisModal(false)}
                  className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Update Jenis'}
                </button>
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
              <button 
                onClick={() => setShowConfirmModal(prev => ({ ...prev, show: false }))}
                className="flex-1 py-3 rounded-xl border border-[#E6E1E5] font-bold text-sm"
              >
                Batal
              </button>
              <button 
                onClick={showConfirmModal.onConfirm}
                className="flex-1 py-3 rounded-xl bg-[#B3261E] text-white font-bold text-sm shadow-md hover:bg-[#8C1D18]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-2xl font-bold mb-6">Filter Export Excel</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Jenis Pelatihan</label>
                <select 
                  value={exportFilters.jenis_id}
                  onChange={e => setExportFilters({...exportFilters, jenis_id: e.target.value})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                >
                  <option value="all">Semua Jenis Pelatihan</option>
                  {jenisUjian.map(j => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Periode</label>
                <select 
                  value={exportFilters.period}
                  onChange={e => setExportFilters({...exportFilters, period: e.target.value as any, value: ''})}
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                >
                  <option value="all">Semua Waktu</option>
                  <option value="daily">Harian</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </div>

              {exportFilters.period === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Pilih Tanggal</label>
                  <select 
                    value={exportFilters.value}
                    onChange={e => setExportFilters({...exportFilters, value: e.target.value})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  >
                    <option value="">-- Pilih Tanggal --</option>
                    {Array.from(new Set(results.map(r => format(new Date(r.waktu_selesai), 'yyyy-MM-dd'))))
                      .sort((a: string, b: string) => b.localeCompare(a))
                      .map((date: string) => (
                        <option key={date} value={date}>{format(new Date(date), 'dd MMMM yyyy', { locale: id })}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              {exportFilters.period === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Pilih Bulan</label>
                  <select 
                    value={exportFilters.value}
                    onChange={e => setExportFilters({...exportFilters, value: e.target.value})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  >
                    <option value="">-- Pilih Bulan --</option>
                    {Array.from(new Set(results.map(r => format(new Date(r.waktu_selesai), 'yyyy-MM'))))
                      .sort((a: string, b: string) => b.localeCompare(a))
                      .map((month: string) => (
                        <option key={month} value={month}>{format(new Date(month + '-01'), 'MMMM yyyy', { locale: id })}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              {exportFilters.period === 'yearly' && (
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Pilih Tahun</label>
                  <select 
                    value={exportFilters.value}
                    onChange={e => setExportFilters({...exportFilters, value: e.target.value})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  >
                    <option value="">-- Pilih Tahun --</option>
                    {Array.from(new Set(results.map(r => format(new Date(r.waktu_selesai), 'yyyy'))))
                      .sort((a: string, b: string) => b.localeCompare(a))
                      .map((year: string) => (
                        <option key={year} value={year}>{year}</option>
                      ))
                    }
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]"
                >
                  Batal
                </button>
                <button 
                  onClick={performExport}
                  className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B]"
                >
                  Download Excel
                </button>
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
            <div className="mb-6 px-3 py-1 bg-[#F3F0F5] rounded-full inline-block">
              <p className="text-[10px] font-mono text-[#6750A4] truncate max-w-[200px]">{qrData.url}</p>
            </div>
            
            <div className="bg-white p-4 rounded-2xl border border-[#E6E1E5] inline-block mb-6">
              <QRCodeCanvas 
                id="qr-code-canvas"
                value={qrData.url} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#E6E1E5] font-bold text-sm"
              >
                Tutup
              </button>
              <button 
                onClick={downloadQR}
                className="flex-1 py-3 rounded-xl bg-[#6750A4] text-white font-bold text-sm shadow-md hover:bg-[#4F378B] flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-2xl font-bold mb-2">Pengaturan Keamanan</h3>
            <p className="text-sm text-[#49454F] mb-6">Ubah password akun administrator Anda.</p>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1">Password Baru</label>
                <input 
                  type="password" required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
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
              <div>
                <h3 className="text-xl font-bold">Daftar Soal: {viewingQuestionsJenis.nama}</h3>
                <p className="text-sm text-[#49454F]">Total: {soal.filter(s => s.jenis_ujian_id === viewingQuestionsJenis.id).length} Soal</p>
              </div>
              <button 
                onClick={() => setViewingQuestionsJenis(null)}
                className="p-2 hover:bg-[#F3F0F5] rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {soal.filter(s => s.jenis_ujian_id === viewingQuestionsJenis.id).map((s, idx) => (
                <div key={s.id} className="p-6 rounded-2xl border border-[#E6E1E5] bg-white">
                  <div className="flex gap-4 mb-4">
                    <span className="w-8 h-8 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="font-medium text-lg">{s.pertanyaan}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-12">
                    {['a', 'b', 'c', 'd'].map(opt => (
                      <div 
                        key={opt}
                        className={`p-3 rounded-xl border ${s.jawaban_benar.toLowerCase() === opt ? 'border-[#2E7D32] bg-[#E8F5E9] font-bold' : 'border-[#E6E1E5]'}`}
                      >
                        <span className="uppercase mr-2">{opt}.</span> {s[`pilihan_${opt}`]}
                        {s.jawaban_benar.toLowerCase() === opt && (
                          <span className="ml-2 text-[10px] bg-[#2E7D32] text-white px-2 py-0.5 rounded-full uppercase">Kunci</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {soal.filter(s => s.jenis_ujian_id === viewingQuestionsJenis.id).length === 0 && (
                <div className="text-center py-12 text-[#49454F]">
                  Belum ada soal untuk jenis ujian ini.
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-[#E6E1E5] bg-[#FDFCFB] flex justify-end">
              <button 
                onClick={() => setViewingQuestionsJenis(null)}
                className="px-8 py-3 rounded-xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {showCheatingModal && selectedResultForCheating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-[#E6E1E5]"
          >
            <div className="p-8 border-b border-[#E6E1E5] bg-[#FDFCFB] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-[#1C1B1F]">Upaya Kecurangan</h3>
                <p className="text-xs text-[#49454F] mt-1">{selectedResultForCheating.nama} ({selectedResultForCheating.nik})</p>
              </div>
              <button 
                onClick={() => setShowCheatingModal(false)}
                className="p-2 hover:bg-[#F3F0F5] rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 bg-[#F9DEDC] rounded-2xl border border-[#F2B8B5]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#B3261E] text-white flex items-center justify-center shadow-md">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-[#B3261E] font-bold uppercase tracking-wider">Berpindah Tab</p>
                    <p className="text-2xl font-black text-[#B3261E]">{selectedResultForCheating.profil_data.tab_violations || 0} <span className="text-sm font-normal">Kali</span></p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#FFF8E1] rounded-2xl border border-[#FFE082]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#F57F17] text-white flex items-center justify-center shadow-md">
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-[#F57F17] font-bold uppercase tracking-wider">Upaya Screenshot</p>
                    <p className="text-2xl font-black text-[#F57F17]">{selectedResultForCheating.profil_data.screenshot_violations || 0} <span className="text-sm font-normal">Kali</span></p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#F3F0F5] rounded-2xl">
                <p className="text-xs text-[#49454F] leading-relaxed italic">
                  * Data ini dicatat secara otomatis oleh sistem selama sesi ujian berlangsung untuk menjaga integritas hasil ujian.
                </p>
              </div>
            </div>
            
            <div className="p-8 border-t border-[#E6E1E5] bg-[#FDFCFB] flex justify-end">
              <button 
                onClick={() => setShowCheatingModal(false)}
                className="px-8 py-3 rounded-xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] transition-all"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reset Confirm Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <motion.div initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}}
            className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl border-2 border-[#B3261E]">
            <div className="w-16 h-16 bg-[#F9DEDC] text-[#B3261E] rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={36} />
            </div>
            <h3 className="text-xl font-bold text-center text-[#B3261E] mb-2">Konfirmasi Reset Data</h3>
            <p className="text-sm text-[#49454F] text-center mb-6">
              Tindakan ini akan menghapus <span className="font-bold text-[#1C1B1F]">seluruh data</span> secara permanen dan tidak dapat dibatalkan. Masukkan password Anda untuk konfirmasi.
            </p>
            <div className="mb-4">
              <input type="password" value={resetPasswordInput}
                onChange={e => { setResetPasswordInput(e.target.value); setResetPasswordError(''); }}
                placeholder="Masukkan password Anda"
                className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#B3261E] text-sm"
                autoFocus />
              {resetPasswordError && <p className="text-[#B3261E] text-xs mt-2 font-medium">{resetPasswordError}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowResetConfirmModal(false); setResetPasswordInput(''); setResetPasswordError(''); }}
                className="flex-1 py-3 rounded-xl border border-[#E6E1E5] font-bold text-sm text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
              <button onClick={handleConfirmReset} disabled={!resetPasswordInput || loading}
                className="flex-1 py-3 rounded-xl bg-[#B3261E] text-white font-bold text-sm shadow-md hover:bg-[#8C1D18] disabled:opacity-50">
                {loading ? 'Mereset...' : 'Reset Sekarang'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Pilih Jenis Ujian untuk Spreadsheet */}
      {showSelectJenisModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
            className="bg-white rounded-[28px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-xl font-bold mb-2">Pilih Jenis {selectJenisMode === 'peserta' ? 'Pelatihan' : 'Ujian'}</h3>
            <p className="text-sm text-[#49454F] mb-6">
              {selectJenisMode === 'peserta' ? 'Peserta akan didaftarkan ke jenis pelatihan yang dipilih.' : 'Soal akan dimasukkan ke jenis ujian yang dipilih.'}
            </p>
            <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
              {jenisUjian.map(j => (
                <button key={j.id}
                  onClick={() => {
                    setSpreadsheetJenisId(j.id);
                    setShowSelectJenisModal(false);
                    if (selectJenisMode === 'peserta') {
                      setSpreadsheetPesertaRows(Array.from({length:10}, emptyPesertaRow));
                      setShowSpreadsheetPeserta(true);
                    } else {
                      setSpreadsheetSoalRows(Array.from({length:10}, emptySoalRow));
                      setShowSpreadsheetSoal(true);
                    }
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-[#E6E1E5] hover:border-[#6750A4] hover:bg-[#F3F0F5] text-left transition-all flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-[#EADDFF] text-[#6750A4] flex items-center justify-center group-hover:bg-[#6750A4] group-hover:text-white transition-all flex-shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1C1B1F]">{j.nama}</p>
                    <p className="text-xs text-[#49454F]">{Math.abs(j.timer_minutes)} menit · {j.is_active ? '🟢 Aktif' : '🔴 Nonaktif'}</p>
                  </div>
                  <ChevronRight size={18} className="text-[#CAC4D0] group-hover:text-[#6750A4]" />
                </button>
              ))}
              {jenisUjian.length === 0 && <p className="text-center text-[#49454F] py-4 text-sm">Belum ada jenis ujian. Buat jenis ujian terlebih dahulu.</p>}
            </div>
            <button onClick={() => setShowSelectJenisModal(false)}
              className="w-full py-3 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
          </motion.div>
        </div>
      )}

      {/* Spreadsheet Modal Peserta */}
      {showSpreadsheetPeserta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
          onMouseUp={() => { isDraggingRef.current = false; }}
          onMouseLeave={() => { isDraggingRef.current = false; }}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="bg-white rounded-[24px] w-full max-w-6xl shadow-2xl border border-[#E6E1E5] flex flex-col" style={{maxHeight:'95vh'}}>
            <div className="p-5 border-b border-[#E6E1E5] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Table2 size={20} className="text-[#006A6A]" /> Input Peserta via Spreadsheet</h3>
                <p className="text-xs text-[#49454F] mt-0.5">Jenis: <span className="font-bold text-[#6750A4]">{jenisUjian.find(j=>j.id===spreadsheetJenisId)?.nama}</span> · Klik sel lalu Ctrl+V untuk paste · <span className="text-[#006A6A] font-medium">Klik/drag nomor baris untuk blok · Shift+klik untuk range</span></p>
              </div>
              <button onClick={() => { setShowSpreadsheetPeserta(false); setSelectedRows(new Set()); setAnchorRow(null); }}
                className="p-2 hover:bg-[#F3F0F5] rounded-full flex-shrink-0"><X size={20}/></button>
            </div>
            {selectedRows.size > 0 && (
              <div className="px-5 py-3 bg-[#EDE7FF] border-b border-[#6750A4]/20 flex items-center gap-3 flex-wrap flex-shrink-0">
                <span className="text-xs font-bold text-white bg-[#6750A4] px-2.5 py-1 rounded-full">{selectedRows.size} baris dipilih</span>
                <span className="text-xs text-[#49454F]">Ubah kategori:</span>
                <div className="flex gap-1.5">
                  {['Karyawan','Magang','Visitor','Kontraktor'].map(k => (
                    <button key={k} onClick={() => { setBulkKategori(k); setSpreadsheetPesertaRows(rows => rows.map((r,i) => selectedRows.has(i) ? {...r, kategori:k} : r)); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${bulkKategori===k?'bg-[#6750A4] text-white border-[#6750A4]':'bg-white text-[#6750A4] border-[#6750A4]/40 hover:border-[#6750A4] hover:bg-[#F3F0F5]'}`}>{k}</button>
                  ))}
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => { setSpreadsheetPesertaRows(rows => rows.filter((_,i) => !selectedRows.has(i))); setSelectedRows(new Set()); setAnchorRow(null); }}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-[#B3261E] bg-white border border-[#B3261E]/30 hover:bg-[#F9DEDC] flex items-center gap-1"><Trash2 size={12}/> Hapus {selectedRows.size} baris</button>
                  <button onClick={() => { setSelectedRows(new Set()); setAnchorRow(null); setBulkKategori(''); }}
                    className="px-3 py-1 rounded-lg text-xs text-[#49454F] hover:bg-white border border-transparent hover:border-[#E6E1E5]">✕ Batal</button>
                </div>
              </div>
            )}
            <div className="overflow-auto flex-1 p-4">
              <table className="border-collapse text-sm" style={{minWidth:'700px',width:'100%',userSelect:'none'}}>
                <thead>
                  <tr className="bg-[#6750A4] text-white">
                    <th className="px-2 py-2.5 border border-[#4F378B] w-10 text-center cursor-pointer hover:bg-[#4F378B] text-xs"
                      onClick={() => { if (selectedRows.size===spreadsheetPesertaRows.length&&spreadsheetPesertaRows.length>0){setSelectedRows(new Set());setAnchorRow(null);}else{setSelectedRows(new Set(spreadsheetPesertaRows.map((_,i)=>i)));setAnchorRow(0);} setBulkKategori(''); }}>
                      {selectedRows.size===spreadsheetPesertaRows.length&&spreadsheetPesertaRows.length>0?'☑':'#'}
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
                      if (e.shiftKey&&anchorRow!==null){const min=Math.min(anchorRow,ri);const max=Math.max(anchorRow,ri);const next=new Set<number>();for(let i=min;i<=max;i++)next.add(i);setSelectedRows(next);}
                      else if(e.ctrlKey||e.metaKey){const next=new Set(selectedRows);if(next.has(ri))next.delete(ri);else next.add(ri);setSelectedRows(next);setAnchorRow(ri);}
                      else{setSelectedRows(new Set([ri]));setAnchorRow(ri);}
                      setBulkKategori('');
                    };
                    const handleNumMouseEnter=()=>{if(!isDraggingRef.current)return;if(anchorRow!==null){const min=Math.min(anchorRow,ri);const max=Math.max(anchorRow,ri);const next=new Set<number>();for(let i=min;i<=max;i++)next.add(i);setSelectedRows(next);}};
                    const handlePaste=(col:string)=>(e:React.ClipboardEvent<HTMLInputElement>)=>{
                      e.preventDefault();const text=e.clipboardData.getData('text');
                      const lines=text.split('\n').map((l:string)=>l.replace(/\r/g,'')).filter((l:string)=>l.trim());
                      const colOrder=['nik','nama','perusahaan','kategori'];const startColIdx=colOrder.indexOf(col);
                      const newRows=[...spreadsheetPesertaRows];
                      lines.forEach((line:string,li:number)=>{const cells=line.split('\t');const idx=ri+li;const rowData:any=idx<newRows.length?{...newRows[idx]}:{...emptyPesertaRow()};
                        cells.forEach((cell:string,ci:number)=>{const tci=startColIdx+ci;if(tci<colOrder.length)rowData[colOrder[tci]]=cell.trim()||rowData[colOrder[tci]];});
                        if(idx<newRows.length)newRows[idx]=rowData;else newRows.push(rowData);});
                      setSpreadsheetPesertaRows(newRows);};
                    return (
                      <tr key={ri} className={isSelected?'bg-[#EDE7FF]':ri%2===0?'bg-white':'bg-[#FAFAFA]'}>
                        <td className="border border-[#E6E1E5] text-center cursor-pointer p-0" onMouseDown={handleNumMouseDown} onMouseEnter={handleNumMouseEnter}>
                          <div className={`w-full h-full px-2 py-1.5 flex items-center justify-center text-xs font-bold transition-all ${isSelected?'bg-[#6750A4] text-white':'text-[#9CA3AF] hover:bg-[#EADDFF] hover:text-[#6750A4]'}`}>{ri+1}</div>
                        </td>
                        {(['nik','nama','perusahaan'] as const).map(col=>(
                          <td key={col} className="border border-[#E6E1E5] p-0">
                            <input value={row[col]} placeholder={col==='nik'?'Klik lalu Ctrl+V':''} onChange={e=>{const nr=[...spreadsheetPesertaRows];nr[ri]={...nr[ri],[col]:e.target.value};setSpreadsheetPesertaRows(nr);}} onPaste={handlePaste(col)} style={{userSelect:'text'}} className={`w-full px-2 py-1.5 outline-none text-xs focus:bg-[#EDE7FF] ${isSelected?'bg-[#EDE7FF]':''}`}/>
                          </td>
                        ))}
                        <td className="border border-[#E6E1E5] p-0">
                          <select value={row.kategori} onChange={e=>{const nr=[...spreadsheetPesertaRows];nr[ri]={...nr[ri],kategori:e.target.value};setSpreadsheetPesertaRows(nr);}} className={`w-full px-2 py-1.5 outline-none text-xs bg-transparent ${isSelected?'bg-[#EDE7FF] font-bold text-[#6750A4]':''}`}>
                            {['Karyawan','Magang','Visitor','Kontraktor'].map(k=><option key={k}>{k}</option>)}
                          </select>
                        </td>
                        <td className="border border-[#E6E1E5] text-center p-0">
                          <button onClick={()=>{setSpreadsheetPesertaRows(rows=>rows.filter((_,i)=>i!==ri));const next=new Set(selectedRows);next.delete(ri);setSelectedRows(next);}} className="p-1.5 text-[#CAC4D0] hover:text-[#B3261E] transition-colors"><X size={14}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between gap-3 flex-shrink-0">
              <button onClick={()=>setSpreadsheetPesertaRows(r=>[...r,...Array.from({length:5},emptyPesertaRow)])}
                className="px-4 py-2 rounded-xl border border-[#E6E1E5] text-sm font-medium hover:bg-[#F3F0F5] flex items-center gap-2"><Plus size={16}/> Tambah 5 Baris</button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#49454F]">{spreadsheetPesertaRows.filter(r=>r.nik&&r.nama&&r.perusahaan).length} baris valid</span>
                <button onClick={()=>{setShowSpreadsheetPeserta(false);setSelectedRows(new Set());setAnchorRow(null);setBulkKategori('');}} className="px-5 py-2.5 rounded-xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
                <button onClick={handleSaveSpreadsheetPeserta} disabled={savingSpreadsheet}
                  className="px-6 py-2.5 rounded-xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50 flex items-center gap-2"><Save size={16}/>{savingSpreadsheet?'Menyimpan...':'Simpan Semua'}</button>
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
                <p className="text-xs text-[#49454F] mt-0.5">Jenis: <span className="font-bold text-[#6750A4]">{jenisUjian.find(j=>j.id===spreadsheetJenisId)?.nama}</span> · <span className="text-[#006A6A] font-medium">Paste dari Excel — kunci jawaban terdeteksi otomatis</span></p>
              </div>
              <button onClick={()=>setShowSpreadsheetSoal(false)} className="p-2 hover:bg-[#F3F0F5] rounded-full flex-shrink-0"><X size={20}/></button>
            </div>
            <div className="px-5 py-3 bg-[#F0FAFA] border-b border-[#006A6A]/10 flex-shrink-0">
              <p className="text-xs font-bold text-[#006A6A] mb-2">📋 Format Excel yang didukung:</p>
              <div className="flex flex-wrap gap-2">
                {[{label:'Format 1',desc:'Pertanyaan | A | B | C | D | A',color:'bg-[#E0F2F1] text-[#006A6A]',hint:'Kolom ke-6 = kunci'},{label:'Format 2',desc:'✓ atau * di depan pilihan benar',color:'bg-[#E8F5E9] text-[#2E7D32]',hint:'Contoh: ✓Jawaban benar'},{label:'Format 3',desc:'(benar) di akhir pilihan benar',color:'bg-[#FFF8E1] text-[#F57F17]',hint:'Contoh: Jawaban benar (benar)'}].map(f=>(
                  <div key={f.label} className={`px-3 py-1.5 rounded-lg ${f.color}`}>
                    <span className="text-[10px] font-bold">{f.label}:</span><span className="text-[10px]"> {f.desc}</span><span className="text-[10px] opacity-60"> — {f.hint}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <table className="border-collapse text-sm" style={{minWidth:'1000px',width:'100%'}}>
                <thead>
                  <tr className="bg-[#006A6A] text-white">
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40] w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'260px'}}>Pertanyaan * <span className="opacity-60 font-normal">← Paste di sini</span></th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan A *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan B *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan C *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan D *</th>
                    <th className="px-3 py-2.5 text-center text-xs border border-[#004D40] w-24">Kunci Jawaban</th>
                    <th className="px-2 py-2.5 border border-[#004D40] w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetSoalRows.map((row,ri)=>{
                    const bgClass=ri%2===0?'bg-white':'bg-[#F0FAFA]';
                    const detectAndParse=(cells:string[])=>{
                      const markers=['✓','✔','*','(benar)','(correct)','(jawaban)','[benar]','[correct]'];
                      let answer='';
                      const cleaned=cells.slice(0,4).map((cell,idx)=>{let c=(cell||'').trim();for(const m of markers){if(c.toLowerCase().startsWith(m.toLowerCase())){if(!answer)answer=String.fromCharCode(65+idx);c=c.substring(m.length).trim();}else if(c.toLowerCase().endsWith(m.toLowerCase())){if(!answer)answer=String.fromCharCode(65+idx);c=c.substring(0,c.length-m.length).trim();}}return c;});
                      return{cleaned,answer};};
                    const handlePaste=(col:string)=>(e:React.ClipboardEvent<HTMLInputElement>)=>{
                      e.preventDefault();const raw=e.clipboardData.getData('text');
                      const lines=raw.split('\n').map((l:string)=>l.replace(/\r/g,'')).filter((l:string)=>l.trim());
                      const colOrder=['pertanyaan','pilihan_a','pilihan_b','pilihan_c','pilihan_d','jawaban_benar'];
                      const startColIdx=colOrder.indexOf(col);const newRows=[...spreadsheetSoalRows];
                      lines.forEach((line:string,li:number)=>{
                        const cells=line.split('\t');const idx=ri+li;
                        const rowData:any=idx<newRows.length?{...newRows[idx]}:{...emptySoalRow()};
                        if(col==='pertanyaan'&&cells.length>=5){
                          const lastCell=(cells[5]||cells[cells.length-1]||'').trim().toUpperCase();
                          const isExplicitAnswer=/^[ABCD]$/.test(lastCell)&&cells.length>=6;
                          const pilihanCells=cells.slice(1,5);const{cleaned,answer}=detectAndParse(pilihanCells);
                          rowData.pertanyaan=cells[0]?.trim()||'';rowData.pilihan_a=cleaned[0]||'';rowData.pilihan_b=cleaned[1]||'';rowData.pilihan_c=cleaned[2]||'';rowData.pilihan_d=cleaned[3]||'';
                          if(isExplicitAnswer)rowData.jawaban_benar=lastCell;else if(answer)rowData.jawaban_benar=answer;
                        }else if(col==='pertanyaan'&&cells.length===5){
                          const col5=(cells[4]||'').trim().toUpperCase();
                          if(/^[ABCD]$/.test(col5)){const{cleaned}=detectAndParse(cells.slice(1,4));rowData.pertanyaan=cells[0]?.trim()||'';rowData.pilihan_a=cleaned[0]||'';rowData.pilihan_b=cleaned[1]||'';rowData.pilihan_c=cleaned[2]||'';rowData.jawaban_benar=col5;}
                          else{const{cleaned,answer}=detectAndParse(cells.slice(1,5));rowData.pertanyaan=cells[0]?.trim()||'';rowData.pilihan_a=cleaned[0]||'';rowData.pilihan_b=cleaned[1]||'';rowData.pilihan_c=cleaned[2]||'';rowData.pilihan_d=cleaned[3]||'';if(answer)rowData.jawaban_benar=answer;}
                        }else{cells.forEach((cell:string,ci:number)=>{const tci=startColIdx+ci;if(tci<colOrder.length){const tc=colOrder[tci];rowData[tc]=tc==='jawaban_benar'?cell.trim().toUpperCase()||rowData[tc]:cell.trim()||rowData[tc];}});}
                        if(idx<newRows.length)newRows[idx]=rowData;else newRows.push(rowData);});
                      setSpreadsheetSoalRows(newRows);};
                    return(
                      <tr key={ri} className={bgClass}>
                        <td className="px-3 py-1 border border-[#E6E1E5] text-[#9CA3AF] text-center text-xs">{ri+1}</td>
                        {(['pertanyaan','pilihan_a','pilihan_b','pilihan_c','pilihan_d'] as const).map(col=>(
                          <td key={col} className="border border-[#E6E1E5] p-0">
                            <input value={row[col]} placeholder={col==='pertanyaan'?'Paste dari Excel di sini':''} onChange={e=>{const nr=[...spreadsheetSoalRows];nr[ri]={...nr[ri],[col]:e.target.value};setSpreadsheetSoalRows(nr);}} onPaste={handlePaste(col)} className="w-full px-2 py-1.5 outline-none focus:bg-[#E0F2F1] text-xs"/>
                          </td>
                        ))}
                        <td className="border border-[#E6E1E5] p-0">
                          <div className="flex items-center justify-center gap-0.5 px-1 py-1">
                            {['A','B','C','D'].map(v=>(
                              <button key={v} onClick={()=>{const nr=[...spreadsheetSoalRows];nr[ri]={...nr[ri],jawaban_benar:v};setSpreadsheetSoalRows(nr);}}
                                className={`w-7 h-7 rounded-lg text-[11px] font-black transition-all ${row.jawaban_benar===v?'bg-[#006A6A] text-white shadow-sm scale-110':'bg-[#F3F0F5] text-[#9CA3AF] hover:bg-[#E0F2F1] hover:text-[#006A6A]'}`}>{v}</button>
                            ))}
                          </div>
                        </td>
                        <td className="border border-[#E6E1E5] text-center p-0">
                          <button onClick={()=>setSpreadsheetSoalRows(rows=>rows.filter((_,i)=>i!==ri))} className="p-1.5 text-[#CAC4D0] hover:text-[#B3261E] transition-colors"><X size={14}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between gap-3 flex-shrink-0">
              <button onClick={()=>setSpreadsheetSoalRows(r=>[...r,...Array.from({length:5},emptySoalRow)])}
                className="px-4 py-2 rounded-xl border border-[#E6E1E5] text-sm font-medium hover:bg-[#F3F0F5] flex items-center gap-2"><Plus size={16}/> Tambah 5 Baris</button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#49454F]">{spreadsheetSoalRows.filter(r=>r.pertanyaan&&r.pilihan_a&&r.pilihan_b&&r.pilihan_c&&r.pilihan_d).length} baris valid</span>
                <button onClick={()=>setShowSpreadsheetSoal(false)} className="px-5 py-2.5 rounded-xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
                <button onClick={handleSaveSpreadsheetSoal} disabled={savingSpreadsheet}
                  className="px-6 py-2.5 rounded-xl bg-[#006A6A] text-white font-bold shadow-md hover:bg-[#004D40] disabled:opacity-50 flex items-center gap-2"><Save size={16}/>{savingSpreadsheet?'Menyimpan...':'Simpan Semua'}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
