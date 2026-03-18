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
        commitment_checkbox_text: 'Saya telah mengisi data dengan benar dan menyetujui pakta integritas.'
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
      scrollToTop();
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
      scrollToTop();
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
      message: 'Apakah Anda yakin ingin menghapus peserta ini? Seluruh riwayat ujian peserta ini juga akan dihapus.',
      onConfirm: async () => {
        // Delete related records first to avoid foreign key constraint errors
        await supabase.from('hasil_ujian').delete().eq('nik', nik);
        await supabase.from('remedial_requests').delete().eq('nik', nik);
        
        const { error } = await supabase.from('peserta_master').delete().eq('nik', nik);
        if (error) {
          console.error(error);
          alert('Gagal menghapus peserta: ' + error.message);
        } else {
          fetchData();
        }
        setShowConfirmModal(prev => ({ ...prev, show: false }));
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
    // Optimistic update — UI langsung berubah
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
        // Fetch ulang untuk pastikan sinkron dengan database
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
      commitment_checkbox_text: jenis.commitment_checkbox_text || 'Saya telah mengisi data dengan benar dan menyetujui pakta integritas.'
    });
    setShowEditJenisModal(true);
  };

  const handleResetData = () => {
    setResetPasswordInput('');
    setResetPasswordError('');
    setShowResetConfirmModal(true);
  };

  const handleConfirmReset = async () => {
    // Verifikasi password admin
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
          commitment_checkbox_text: editingJenis.commitment_checkbox_text
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
      message: `Apakah Anda yakin ingin menghapus ${selectedPeserta.length} peserta terpilih? Seluruh riwayat ujian peserta tersebut juga akan dihapus.`,
      onConfirm: async () => {
        try {
          // Delete related records first to avoid foreign key constraint errors
          await supabase.from('hasil_ujian').delete().in('nik', selectedPeserta);
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
        const jumlahBerhasil = formattedData.length;
        alert(`${jumlahBerhasil} data peserta berhasil diunggah/diperbarui!`);
        setShowUploadPesertaModal(false);
        setUploadFile(null);
        setTargetJenisId('');
        fetchData();
      } catch (err: any) {
        console.error(err);
        const msg = err?.message || '';
        if (msg.includes('duplicate') || msg.includes('unique')) {
          alert('Gagal: Terdapat NIK duplikat di file. Gunakan fitur ini untuk update data, pastikan NIK sudah terdaftar, atau hapus baris duplikat dari file Excel.');
        } else {
          alert('Gagal mengunggah data. Pastikan format file sesuai template.\n\nDetail: ' + msg);
        }
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
        password_hash: newAdmin.password, // In a real app, hash this!
        role: newAdmin.role,
        is_approved: true
      }]);
      if (error) throw error;

      // Increment total admin stat if needed, but user didn't ask for it.
      
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

    const exportData = filtered.map(r => {
      const perusahaan = r.perusahaan || peserta.find(p => p.nik === r.nik)?.perusahaan || '-';
      return {
        'Waktu Selesai': format(new Date(r.waktu_selesai), 'dd/MM/yyyy HH:mm'),
        'Jenis Ujian': jenisUjian.find(j => j.id === r.jenis_ujian_id)?.nama || '-',
        'Nilai': r.nilai,
        'Status Lulus': r.status_lulus ? 'LULUS' : 'TIDAK LULUS',
        'Nama': r.nama,
        'NIK': r.nik,
        'Perusahaan': perusahaan,
        'Status Perkawinan': r.profil_data.status || '-',
        'Agama': r.profil_data.agama || '-',
        'Tanggal Lahir': r.profil_data.tanggalLahir || '-',
        'Pendidikan': r.profil_data.pendidikan || '-',
        'Kontak Darurat': r.profil_data.kontakDarurat || '-',
        'Pindah Tab': r.profil_data.tab_violations || 0,
        'Upaya Screenshot': r.profil_data.screenshot_violations || 0,
        'Upaya Copy': r.profil_data.copy_violations || 0,
      };
    });

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

    const totalPesertaUjian = filteredResults.length;
    const totalUjianSistem = jenisUjian.length;
    const totalAttempts = filteredResults.length;
    const totalLulus = filteredResults.filter(r => r.status_lulus).length;
    const lulusRate = totalAttempts > 0 ? Math.round((totalLulus / totalAttempts) * 100) : 0;
    const avgNilai = totalAttempts > 0 
      ? Math.round(filteredResults.reduce((sum, r) => sum + r.nilai, 0) / totalAttempts) 
      : 0;

    // Trend: bandingkan bulan ini vs bulan lalu
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

    return { totalPesertaUjian, totalUjianSistem, lulusRate, totalAttempts, avgNilai, trendLulus, thisMonthCount: thisMonth.length };
  }, [results, jenisUjian, dashboardFilterJenis]);

  const pieData = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all' 
      ? results 
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    
    const nics = new Set(filteredResults.map(r => r.nik));
    const relevantPeserta = peserta.filter(p => nics.has(p.nik));

    return [
      { name: 'Karyawan', value: relevantPeserta.filter(p => p.kategori === 'Karyawan').length },
      { name: 'Magang', value: relevantPeserta.filter(p => p.kategori === 'Magang').length },
      { name: 'Visitor', value: relevantPeserta.filter(p => p.kategori === 'Visitor').length },
      { name: 'Kontraktor', value: relevantPeserta.filter(p => p.kategori === 'Kontraktor').length },
    ].filter(d => d.value > 0);
  }, [peserta, results, dashboardFilterJenis]);

  const barChartMonthData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const filteredResults = dashboardFilterJenis === 'all' 
      ? results 
      : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);

    const weeks = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'];
    return weeks.map((name, i) => {
      const val = filteredResults.filter(r => {
        const d = new Date(r.waktu_selesai);
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return false;
        const day = d.getDate();
        if (i === 0) return day <= 7;
        if (i === 1) return day > 7 && day <= 14;
        if (i === 2) return day > 14 && day <= 21;
        return day > 21;
      }).length;
      return { name, val };
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
      <div 
        className={clsx(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

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
              <div className="flex gap-2">
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
              <div className="flex gap-2">
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
          <div className="space-y-8">
            {/* Dashboard Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-[#E6E1E5] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#EADDFF] text-[#21005D] rounded-2xl">
                  <LayoutDashboard size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Ringkasan Statistik</h3>
                  <p className="text-sm text-[#49454F]">Pantau performa pelatihan dan ujian</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#49454F]" size={18} />
                  <select 
                    value={dashboardFilterJenis}
                    onChange={(e) => setDashboardFilterJenis(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#F3F0F5] border-none rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm font-medium appearance-none"
                  >
                    <option value="all">Semua Jenis Ujian</option>
                    {jenisUjian.map(j => (
                      <option key={j.id} value={j.id}>{j.nama}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => setShowDashboardSettings(true)}
                  className="p-3 bg-[#F3F0F5] text-[#49454F] rounded-xl hover:bg-[#EADDFF] hover:text-[#21005D] transition-all"
                  title="Pengaturan Dashboard"
                >
                  <Settings size={20} />
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-[#E6E1E5] shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[#49454F] text-xs font-bold uppercase tracking-wider mb-1">Total Ujian Selesai</p>
                  <h3 className="text-3xl font-bold">{stats.totalPesertaUjian}</h3>
                </div>
                <div className="mt-4 pt-4 border-t border-[#F3F0F5] flex items-center justify-between">
                  <span className="text-[10px] text-[#49454F]">Jumlah Attempt</span>
                  <Users size={16} className="text-[#6750A4]" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E6E1E5] shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[#49454F] text-xs font-bold uppercase tracking-wider mb-1">Total Jenis Ujian</p>
                  <h3 className="text-3xl font-bold">{stats.totalUjianSistem}</h3>
                </div>
                <div className="mt-4 pt-4 border-t border-[#F3F0F5] flex items-center justify-between">
                  <span className="text-[10px] text-[#49454F]">Dalam Sistem</span>
                  <BookOpen size={16} className="text-[#006A6A]" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E6E1E5] shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[#49454F] text-xs font-bold uppercase tracking-wider mb-1">Tingkat Kelulusan</p>
                  <h3 className="text-3xl font-bold">{stats.lulusRate}%</h3>
                </div>
                <div className="mt-4 pt-4 border-t border-[#F3F0F5] flex items-center justify-between">
                  <span className="text-[10px] text-[#49454F]">Rata-rata</span>
                  <CheckCircle2 size={16} className="text-[#2E7D32]" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E6E1E5] shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[#49454F] text-xs font-bold uppercase tracking-wider mb-1">Ujian Dilakukan</p>
                  <h3 className="text-3xl font-bold">{stats.totalAttempts}</h3>
                </div>
                <div className="mt-4 pt-4 border-t border-[#F3F0F5] flex items-center justify-between">
                  <span className="text-[10px] text-[#49454F]">Total Submit</span>
                  <ClipboardCheck size={16} className="text-[#F57F17]" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E6E1E5] shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[#49454F] text-xs font-bold uppercase tracking-wider mb-1">Rata-rata Nilai</p>
                  <h3 className="text-3xl font-bold">{stats.avgNilai}</h3>
                </div>
                <div className="mt-4 pt-4 border-t border-[#F3F0F5] flex items-center justify-between">
                  <span className="text-[10px] text-[#49454F]">Semua ujian</span>
                  <BarChart3 size={16} className="text-[#6750A4]" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#E6E1E5] shadow-sm flex flex-col justify-between">
                <div>
                  <p className="text-[#49454F] text-xs font-bold uppercase tracking-wider mb-1">Bulan Ini</p>
                  <h3 className="text-3xl font-bold">{stats.thisMonthCount}</h3>
                </div>
                <div className="mt-4 pt-4 border-t border-[#F3F0F5] flex items-center justify-between">
                  <span className="text-[10px] text-[#49454F]">Ujian selesai</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    stats.trendLulus > 0 ? 'bg-[#E8F5E9] text-[#2E7D32]' :
                    stats.trendLulus < 0 ? 'bg-[#F9DEDC] text-[#B3261E]' :
                    'bg-[#F3F0F5] text-[#49454F]'
                  }`}>
                    {stats.trendLulus > 0 ? `+${stats.trendLulus}%` : stats.trendLulus < 0 ? `${stats.trendLulus}%` : '~'} lulus
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Row 1: Pie & Month */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {dashboardConfig.showPieChart && (
                <div className="bg-white p-8 rounded-[32px] border border-[#E6E1E5] shadow-sm lg:col-span-1">
                  <h4 className="text-lg font-bold mb-6">Distribusi Peserta</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {pieData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-[10px] text-[#49454F] truncate">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashboardConfig.showBarChartMonth && (
                <div className={clsx(
                  "bg-white p-8 rounded-[32px] border border-[#E6E1E5] shadow-sm",
                  dashboardConfig.showPieChart ? "lg:col-span-2" : "lg:col-span-3"
                )}>
                  <h4 className="text-lg font-bold mb-6">Peserta Bulan Ini</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartMonthData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1E5" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#49454F', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#49454F', fontSize: 12 }} />
                        <Tooltip cursor={{ fill: '#F3F0F5' }} />
                        <Bar dataKey="val" fill="#6750A4" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Charts Row 2: Year */}
            {dashboardConfig.showBarChartYear && (
              <div className="bg-white p-8 rounded-[32px] border border-[#E6E1E5] shadow-sm">
                <h4 className="text-lg font-bold mb-6">Peserta Tahun Ini ({new Date().getFullYear()})</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartYearData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E1E5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#49454F', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#49454F', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#F3F0F5' }} />
                      <Bar dataKey="val" fill="#006A6A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'jenis_ujian' && (
          <div className="space-y-3">
            {jenisUjian.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#E6E1E5] p-8 text-center text-[#49454F]">
                Belum ada data jenis ujian. Klik "Tambah Jenis" untuk memulai.
              </div>
            )}
            {jenisUjian.map((j) => (
              <div key={j.id} className="bg-white rounded-2xl border border-[#E6E1E5] shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" className="rounded border-[#E6E1E5] text-[#6750A4] focus:ring-[#6750A4] mt-1 flex-shrink-0"
                    checked={selectedJenis.includes(j.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedJenis([...selectedJenis, j.id]);
                      else setSelectedJenis(selectedJenis.filter(id => id !== j.id));
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <button onClick={() => setViewingQuestionsJenis(j)} className="font-bold text-[#6750A4] hover:underline text-left text-sm leading-tight">
                        {j.nama}
                      </button>
                      <button onClick={() => toggleJenisStatus(j.id, j.is_active)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex-shrink-0 ${j.is_active ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}>
                        {j.is_active ? '🟢 ON' : '🔴 OFF'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-[10px] bg-[#F3F0F5] text-[#49454F] px-2 py-0.5 rounded-full">{Math.abs(j.timer_minutes)} menit</span>
                      <span className={clsx("text-[10px] px-2 py-0.5 rounded-full font-bold", j.timer_minutes < 0 ? "bg-[#E3F2FD] text-[#1565C0]" : "bg-[#F5F5F5] text-[#757575]")}>
                        {j.timer_minutes < 0 ? 'Limit 1x/hari' : 'Tanpa limit'}
                      </span>
                      {j.has_commitment && <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full font-bold">Komitmen</span>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => copyExamLink(j.id)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" title="Salin Link"><Copy size={16} /></button>
                      <button onClick={() => handleShowQR(j)} className="p-2 text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" title="QR Code"><QrCode size={16} /></button>
                      <button onClick={() => handleEditJenis(j)} className="p-2 text-[#49454F] hover:text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" title="Edit"><Settings size={16} /></button>
                      <button onClick={() => { if (confirm('Hapus jenis ujian ini?')) { supabase.from('jenis_ujian').delete().eq('id', j.id).then(() => fetchData()); } }} className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg transition-all" title="Hapus"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                <div className="p-6 border-b border-[#E6E1E5] flex flex-col md:justify-between md:items-center bg-[#FDFCFB] gap-4">
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
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="bg-white rounded-2xl border border-[#E6E1E5] p-8 text-center text-[#49454F]">
                Tidak ada request remedial saat ini.
              </div>
            )}
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-[#E6E1E5] shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-[#1C1B1F] text-sm">{r.nama}</p>
                      <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex-shrink-0",
                        r.status === 'pending' ? "bg-[#FFF8E1] text-[#F57F17]" :
                        r.status === 'approved' ? "bg-[#E8F5E9] text-[#2E7D32]" :
                        "bg-[#F9DEDC] text-[#B3261E]"
                      )}>{r.status}</span>
                    </div>
                    <p className="text-[10px] text-[#49454F] font-mono mb-1">{r.nik}</p>
                    <p className="text-xs text-[#49454F]">{r.perusahaan || '-'}</p>
                    <p className="text-xs text-[#6750A4] font-medium mt-1">{jenisUjian.find(j => j.id === r.jenis_ujian_id)?.nama || 'Unknown'}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">{format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => handleApproveRequest(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] text-[#2E7D32] rounded-xl text-xs font-bold hover:bg-[#C8E6C9] transition-all">
                        <Check size={14} /> Setujui
                      </button>
                      <button onClick={() => handleRejectRequest(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F9DEDC] text-[#B3261E] rounded-xl text-xs font-bold hover:bg-[#F2B8B5] transition-all">
                        <X size={14} /> Tolak
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'hasil' && (
          <div className="space-y-6">
            {!showHasilDetail ? (
              <div className="space-y-3">
                {(() => {
                  const grouped = results.reduce((acc, curr) => {
                    const date = format(new Date(curr.waktu_selesai), 'yyyy-MM-dd');
                    const key = `${date}_${curr.jenis_ujian_id}`;
                    if (!acc[key]) acc[key] = { date, jenis_id: curr.jenis_ujian_id, total: 0, lulus: 0, tidakLulus: 0 };
                    acc[key].total++;
                    if (curr.status_lulus) acc[key].lulus++;
                    else acc[key].tidakLulus++;
                    return acc;
                  }, {} as Record<string, any>);

                  const summaries = Object.values(grouped).sort((a: any, b: any) => b.date.localeCompare(a.date));
                  if (summaries.length === 0) return (
                    <div className="bg-white rounded-2xl border border-[#E6E1E5] p-8 text-center text-[#49454F]">Belum ada data hasil ujian.</div>
                  );
                  return summaries.map((summary: any) => (
                    <button key={`${summary.date}_${summary.jenis_id}`}
                      className="w-full bg-white rounded-2xl border border-[#E6E1E5] shadow-sm p-4 hover:border-[#6750A4] transition-all text-left group"
                      onClick={() => { setSelectedHasilJenis(summary.jenis_id); setSelectedHasilDate(summary.date); setShowHasilDetail(true); }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#6750A4] text-sm truncate">{jenisUjian.find(j => j.id === summary.jenis_id)?.nama || 'Ujian Tidak Diketahui'}</p>
                          <p className="text-xs text-[#49454F] mt-0.5">{format(new Date(summary.date), 'dd MMM yyyy', { locale: id })}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-bold text-[#1C1B1F] bg-[#F3F0F5] px-2 py-1 rounded-lg">{summary.total}</span>
                          <span className="text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] px-2 py-1 rounded-lg">{summary.lulus} lulus</span>
                          <span className="text-[10px] font-bold bg-[#F9DEDC] text-[#B3261E] px-2 py-1 rounded-lg">{summary.tidakLulus} gagal</span>
                          <ChevronRight size={16} className="text-[#CAC4D0] group-hover:text-[#6750A4] transition-colors" />
                        </div>
                      </div>
                    </button>
                  ));
                })()}
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
                <div className="p-4 space-y-3">
                  {results
                    .filter(r => r.jenis_ujian_id === selectedHasilJenis && format(new Date(r.waktu_selesai), 'yyyy-MM-dd') === selectedHasilDate)
                    .filter(r => r.nama.toLowerCase().includes(searchTerm.toLowerCase()) || r.nik.includes(searchTerm))
                    .map((r) => (
                    <div key={r.id} className="bg-[#FAFAFA] border border-[#E6E1E5] rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-[#1C1B1F] text-sm">{r.nama}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase flex-shrink-0 ${r.status_lulus ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'}`}>
                              {r.status_lulus ? (r.profil_data.is_remedial ? 'Lulus Remedial' : 'Lulus') : (r.profil_data.is_remedial ? 'Tidak Lulus Remedial' : 'Tidak Lulus')}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#49454F] font-mono">{r.nik}</p>
                          <p className="text-[10px] text-[#49454F]">{r.perusahaan || peserta.find(p => p.nik === r.nik)?.perusahaan || '-'}</p>
                          <p className="text-[10px] text-[#9CA3AF] mt-1">{format(new Date(r.waktu_selesai), 'dd MMM yyyy, HH:mm', { locale: id })}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className={`text-2xl font-black ${r.nilai >= 70 ? 'text-[#2E7D32]' : 'text-[#B3261E]'}`}>{r.nilai}</span>
                          <button onClick={() => { setSelectedResultForCheating(r); setShowCheatingModal(true); }}
                            className="p-1.5 text-[#49454F] hover:text-[#6750A4] hover:bg-[#EADDFF] rounded-lg transition-all" title="Lihat Pelanggaran">
                            <FileQuestion size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl p-8 shadow-2xl border border-[#E6E1E5] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Panduan Penggunaan Admin</h3>
              <button onClick={() => setShowGuideModal(false)} className="p-2 hover:bg-[#F3F0F5] rounded-full">
                <XCircle size={24} className="text-[#49454F]" />
              </button>
            </div>
            <div className="space-y-6 text-[#49454F]">
              <section>
                <h4 className="font-bold text-[#1C1B1F] mb-2">1. Manajemen Jenis Ujian</h4>
                <p>Gunakan tab ini untuk membuat kategori ujian (misal: Induksi Karyawan, Visitor). Anda bisa mengatur durasi dan apakah ujian memerlukan pakta integritas.</p>
              </section>
              <section>
                <h4 className="font-bold text-[#1C1B1F] mb-2">2. Manajemen Peserta</h4>
                <p>Daftarkan peserta secara manual atau gunakan fitur **Upload Excel** untuk pendaftaran massal. Pastikan NIK unik untuk setiap peserta.</p>
              </section>
              <section>
                <h4 className="font-bold text-[#1C1B1F] mb-2">3. Bank Soal</h4>
                <p>Tambahkan soal untuk setiap jenis ujian. Gunakan template Excel untuk mengunggah banyak soal sekaligus.</p>
              </section>
              <section>
                <h4 className="font-bold text-[#1C1B1F] mb-2">4. Hasil Ujian</h4>
                <p>Pantau hasil ujian peserta secara real-time. Anda dapat mengekspor data ke Excel untuk pelaporan berkala.</p>
              </section>
            </div>
            <button 
              onClick={() => setShowGuideModal(false)}
              className="w-full mt-8 py-4 rounded-2xl bg-[#6750A4] text-white font-bold"
            >
              Mengerti
            </button>
          </div>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
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

              <div className="flex items-center justify-between p-4 bg-[#E8F5E9] rounded-2xl border border-[#A5D6A7]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#2E7D32] text-white flex items-center justify-center shadow-md">
                    <Copy size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-[#2E7D32] font-bold uppercase tracking-wider">Upaya Copy Teks</p>
                    <p className="text-2xl font-black text-[#2E7D32]">{selectedResultForCheating.profil_data.copy_violations || 0} <span className="text-sm font-normal">Kali</span></p>
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
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl border-2 border-[#B3261E]"
          >
            <div className="w-16 h-16 bg-[#F9DEDC] text-[#B3261E] rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={36} />
            </div>
            <h3 className="text-xl font-bold text-center text-[#B3261E] mb-2">Konfirmasi Reset Data</h3>
            <p className="text-sm text-[#49454F] text-center mb-6">
              Tindakan ini akan menghapus <span className="font-bold text-[#1C1B1F]">seluruh data</span> secara permanen dan tidak dapat dibatalkan. Masukkan password Anda untuk konfirmasi.
            </p>
            <div className="mb-4">
              <input
                type="password"
                value={resetPasswordInput}
                onChange={e => { setResetPasswordInput(e.target.value); setResetPasswordError(''); }}
                placeholder="Masukkan password Anda"
                className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#B3261E] text-sm"
                autoFocus
              />
              {resetPasswordError && (
                <p className="text-[#B3261E] text-xs mt-2 font-medium">{resetPasswordError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowResetConfirmModal(false); setResetPasswordInput(''); setResetPasswordError(''); }}
                className="flex-1 py-3 rounded-xl border border-[#E6E1E5] font-bold text-sm text-[#49454F] hover:bg-[#F3F0F5]"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={!resetPasswordInput || loading}
                className="flex-1 py-3 rounded-xl bg-[#B3261E] text-white font-bold text-sm shadow-md hover:bg-[#8C1D18] disabled:opacity-50"
              >
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
              {selectJenisMode === 'peserta'
                ? 'Peserta akan didaftarkan ke jenis pelatihan yang dipilih.'
                : 'Soal akan dimasukkan ke jenis ujian yang dipilih.'}
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
                  className="w-full p-4 rounded-2xl border-2 border-[#E6E1E5] hover:border-[#6750A4] hover:bg-[#F3F0F5] text-left transition-all flex items-center gap-3 group"
                >
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
              {jenisUjian.length === 0 && (
                <p className="text-center text-[#49454F] py-4 text-sm">Belum ada jenis ujian. Buat jenis ujian terlebih dahulu.</p>
              )}
            </div>
            <button onClick={() => setShowSelectJenisModal(false)}
              className="w-full py-3 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">
              Batal
            </button>
          </motion.div>
        </div>
      )}

      {/* Spreadsheet Modal Peserta */}
      {showSpreadsheetPeserta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="bg-white rounded-[24px] w-full max-w-6xl shadow-2xl border border-[#E6E1E5] flex flex-col" style={{maxHeight:'95vh'}}>
            <div className="p-5 border-b border-[#E6E1E5] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Table2 size={20} className="text-[#006A6A]" /> Input Peserta via Spreadsheet</h3>
                <p className="text-xs text-[#49454F] mt-0.5">
                  Jenis: <span className="font-bold text-[#6750A4]">{jenisUjian.find(j=>j.id===spreadsheetJenisId)?.nama}</span>
                  {' · Baris kosong diabaikan · '}
                  <span className="text-[#006A6A] font-medium">Paste dari Excel langsung ke kolom NIK</span>
                </p>
              </div>
              <button onClick={() => setShowSpreadsheetPeserta(false)} className="p-2 hover:bg-[#F3F0F5] rounded-full flex-shrink-0"><X size={20}/></button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <table className="border-collapse text-sm" style={{minWidth:'700px', width:'100%'}}>
                <thead>
                  <tr className="bg-[#6750A4] text-white">
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B] w-10">#</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'150px'}}>NIK / No. ID *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'180px'}}>Nama Lengkap *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'160px'}}>Perusahaan *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'120px'}}>Kategori</th>
                    <th className="px-2 py-2.5 border border-[#4F378B] w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetPesertaRows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                      <td className="px-3 py-1 border border-[#E6E1E5] text-[#9CA3AF] text-center text-xs">{ri+1}</td>
                      <td className="border border-[#E6E1E5] p-0">
                        <input value={row.nik} placeholder="Paste Excel di sini"
                          onChange={e => { const nr=[...spreadsheetPesertaRows]; nr[ri]={...nr[ri],nik:e.target.value}; setSpreadsheetPesertaRows(nr); }}
                          onPaste={e => {
                            e.preventDefault();
                            const text = e.clipboardData.getData('text');
                            const lines = text.split('\n').filter(l => l.trim());
                            const newRows = [...spreadsheetPesertaRows];
                            lines.forEach((line, li) => {
                              const cells = line.split('\t');
                              const idx = ri + li;
                              const rowData = { nik:cells[0]?.trim()||'', nama:cells[1]?.trim()||'', perusahaan:cells[2]?.trim()||'', kategori:cells[3]?.trim()||'Karyawan' };
                              if (idx < newRows.length) newRows[idx] = rowData;
                              else newRows.push(rowData);
                            });
                            setSpreadsheetPesertaRows(newRows);
                          }}
                          className="w-full px-2 py-1.5 outline-none focus:bg-[#EDE7FF] text-xs"
                        />
                      </td>
                      {(['nama','perusahaan'] as const).map(col => (
                        <td key={col} className="border border-[#E6E1E5] p-0">
                          <input value={row[col]}
                            onChange={e => { const nr=[...spreadsheetPesertaRows]; nr[ri]={...nr[ri],[col]:e.target.value}; setSpreadsheetPesertaRows(nr); }}
                            className="w-full px-2 py-1.5 outline-none focus:bg-[#EDE7FF] text-xs" />
                        </td>
                      ))}
                      <td className="border border-[#E6E1E5] p-0">
                        <select value={row.kategori}
                          onChange={e => { const nr=[...spreadsheetPesertaRows]; nr[ri]={...nr[ri],kategori:e.target.value}; setSpreadsheetPesertaRows(nr); }}
                          className="w-full px-2 py-1.5 outline-none text-xs bg-transparent">
                          {['Karyawan','Magang','Visitor','Kontraktor'].map(k=><option key={k}>{k}</option>)}
                        </select>
                      </td>
                      <td className="border border-[#E6E1E5] text-center">
                        <button onClick={() => setSpreadsheetPesertaRows(rows=>rows.filter((_,i)=>i!==ri))} className="p-1 text-[#CAC4D0] hover:text-[#B3261E]"><X size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between gap-3 flex-shrink-0">
              <button onClick={() => setSpreadsheetPesertaRows(r => [...r, ...Array.from({length:5},emptyPesertaRow)])}
                className="px-4 py-2 rounded-xl border border-[#E6E1E5] text-sm font-medium hover:bg-[#F3F0F5] flex items-center gap-2">
                <Plus size={16}/> Tambah 5 Baris
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#49454F]">{spreadsheetPesertaRows.filter(r=>r.nik&&r.nama&&r.perusahaan).length} baris valid</span>
                <button onClick={() => setShowSpreadsheetPeserta(false)} className="px-5 py-2.5 rounded-xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
                <button onClick={handleSaveSpreadsheetPeserta} disabled={savingSpreadsheet}
                  className="px-6 py-2.5 rounded-xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50 flex items-center gap-2">
                  <Save size={16}/>{savingSpreadsheet ? 'Menyimpan...' : 'Simpan Semua'}
                </button>
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
                <p className="text-xs text-[#49454F] mt-0.5">
                  Jenis: <span className="font-bold text-[#6750A4]">{jenisUjian.find(j=>j.id===spreadsheetJenisId)?.nama}</span>
                  {' · Baris kosong diabaikan · '}
                  <span className="text-[#006A6A] font-medium">Paste dari Excel langsung ke kolom Pertanyaan</span>
                </p>
              </div>
              <button onClick={() => setShowSpreadsheetSoal(false)} className="p-2 hover:bg-[#F3F0F5] rounded-full flex-shrink-0"><X size={20}/></button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <table className="border-collapse text-sm" style={{minWidth:'1000px', width:'100%'}}>
                <thead>
                  <tr className="bg-[#006A6A] text-white">
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40] w-10">#</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'280px'}}>Pertanyaan *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'140px'}}>Pilihan A *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'140px'}}>Pilihan B *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'140px'}}>Pilihan C *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'140px'}}>Pilihan D *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40] w-20">Jawaban *</th>
                    <th className="px-2 py-2.5 border border-[#004D40] w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetSoalRows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-[#F0FAFA]'}>
                      <td className="px-3 py-1 border border-[#E6E1E5] text-[#9CA3AF] text-center text-xs">{ri+1}</td>
                      <td className="border border-[#E6E1E5] p-0">
                        <input value={row.pertanyaan} placeholder="Paste Excel di sini"
                          onChange={e => { const nr=[...spreadsheetSoalRows]; nr[ri]={...nr[ri],pertanyaan:e.target.value}; setSpreadsheetSoalRows(nr); }}
                          onPaste={e => {
                            e.preventDefault();
                            const text = e.clipboardData.getData('text');
                            const lines = text.split('\n').filter(l => l.trim());
                            const newRows = [...spreadsheetSoalRows];
                            lines.forEach((line, li) => {
                              const cells = line.split('\t');
                              const idx = ri + li;
                              const rowData = { pertanyaan:cells[0]?.trim()||'', pilihan_a:cells[1]?.trim()||'', pilihan_b:cells[2]?.trim()||'', pilihan_c:cells[3]?.trim()||'', pilihan_d:cells[4]?.trim()||'', jawaban_benar:(cells[5]?.trim().toUpperCase()||'A') };
                              if (idx < newRows.length) newRows[idx] = rowData;
                              else newRows.push(rowData);
                            });
                            setSpreadsheetSoalRows(newRows);
                          }}
                          className="w-full px-2 py-1.5 outline-none focus:bg-[#E0F2F1] text-xs" />
                      </td>
                      {(['pilihan_a','pilihan_b','pilihan_c','pilihan_d'] as const).map(col => (
                        <td key={col} className="border border-[#E6E1E5] p-0">
                          <input value={row[col]}
                            onChange={e => { const nr=[...spreadsheetSoalRows]; nr[ri]={...nr[ri],[col]:e.target.value}; setSpreadsheetSoalRows(nr); }}
                            className="w-full px-2 py-1.5 outline-none focus:bg-[#E0F2F1] text-xs" />
                        </td>
                      ))}
                      <td className="border border-[#E6E1E5] p-0">
                        <select value={row.jawaban_benar}
                          onChange={e => { const nr=[...spreadsheetSoalRows]; nr[ri]={...nr[ri],jawaban_benar:e.target.value}; setSpreadsheetSoalRows(nr); }}
                          className="w-full px-2 py-1.5 outline-none text-xs bg-transparent font-bold text-[#006A6A]">
                          {['A','B','C','D'].map(v=><option key={v}>{v}</option>)}
                        </select>
                      </td>
                      <td className="border border-[#E6E1E5] text-center">
                        <button onClick={() => setSpreadsheetSoalRows(rows=>rows.filter((_,i)=>i!==ri))} className="p-1 text-[#CAC4D0] hover:text-[#B3261E]"><X size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between gap-3 flex-shrink-0">
              <button onClick={() => setSpreadsheetSoalRows(r => [...r, ...Array.from({length:5},emptySoalRow)])}
                className="px-4 py-2 rounded-xl border border-[#E6E1E5] text-sm font-medium hover:bg-[#F3F0F5] flex items-center gap-2">
                <Plus size={16}/> Tambah 5 Baris
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#49454F]">{spreadsheetSoalRows.filter(r=>r.pertanyaan&&r.pilihan_a&&r.pilihan_b&&r.pilihan_c&&r.pilihan_d).length} baris valid</span>
                <button onClick={() => setShowSpreadsheetSoal(false)} className="px-5 py-2.5 rounded-xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
                <button onClick={handleSaveSpreadsheetSoal} disabled={savingSpreadsheet}
                  className="px-6 py-2.5 rounded-xl bg-[#006A6A] text-white font-bold shadow-md hover:bg-[#004D40] disabled:opacity-50 flex items-center gap-2">
                  <Save size={16}/>{savingSpreadsheet ? 'Menyimpan...' : 'Simpan Semua'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
