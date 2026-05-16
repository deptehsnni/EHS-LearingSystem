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
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { DashboardOverview } from '../components/admin/DashboardOverview';
import { JenisUjianTable } from '../components/admin/JenisUjianTable';
import { PesertaManagement } from '../components/admin/PesertaManagement';
import { SoalManagement } from '../components/admin/SoalManagement';
import { HasilManagement } from '../components/admin/HasilManagement';
import { RemedialRequests } from '../components/admin/RemedialRequests';
import { LiveMonitor } from '../components/admin/LiveMonitor';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { ManagementModals } from '../components/admin/modals/ManagementModals';
import { UtilityModals } from '../components/admin/modals/UtilityModals';
import { ViewModals } from '../components/admin/modals/ViewModals';
import { SpreadsheetModals } from '../components/admin/modals/SpreadsheetModals';
import { emptyPesertaRow, emptySoalRow } from '../utils/adminUtils'; // Assuming I move these or keep them for now

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'peserta' | 'soal' | 'hasil' | 'settings' | 'jenis_ujian' | 'requests' | 'live_monitor'>('overview');
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
      
      // Increment persistent stat for total peserta (dibungkus try-catch agar tidak menyebabkan 500 error palsu)
      try {
        await supabase.rpc('increment_stat', { stat_id: 'total_peserta' });
      } catch (err) {
        console.warn('Gagal memanggil RPC increment_stat (diabaikan karena peserta sudah berhasil disimpan):', err);
      }

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

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex">
      <AdminSidebar 
        admin={admin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        requests={requests}
        handleLogout={handleLogout}
        scrollToTop={scrollToTop}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <AdminHeader 
          activeTab={activeTab}
          admin={admin}
          setIsSidebarOpen={setIsSidebarOpen}
          selectedJenis={selectedJenis}
          selectedPeserta={selectedPeserta}
          selectedSoal={selectedSoal}
          bulkDeleteJenis={bulkDeleteJenis}
          bulkDeletePeserta={bulkDeletePeserta}
          bulkDeleteSoal={bulkDeleteSoal}
          setShowGuideModal={setShowGuideModal}
          setShowAddJenisModal={setShowAddJenisModal}
          downloadTemplatePeserta={downloadTemplatePeserta}
          setShowUploadPesertaModal={setShowUploadPesertaModal}
          setShowAddPesertaModal={setShowAddPesertaModal}
          setSelectJenisMode={setSelectJenisMode}
          setShowSelectJenisModal={setShowSelectJenisModal}
          downloadTemplateSoal={downloadTemplateSoal}
          handleFileUploadSoal={handleFileUploadSoal}
          setShowAddSoalModal={setShowAddSoalModal}
          setShowExportModal={setShowExportModal}
        />

        {activeTab === 'overview' && (
          <DashboardOverview 
            results={results}
            peserta={peserta}
            jenisUjian={jenisUjian}
            dashboardFilterJenis={dashboardFilterJenis}
            setDashboardFilterJenis={setDashboardFilterJenis}
            dashboardConfig={dashboardConfig}
            setShowDashboardSettings={setShowDashboardSettings}
          />
        )}

        {activeTab === 'jenis_ujian' && (
          <JenisUjianTable 
            jenisUjian={jenisUjian}
            selectedJenis={selectedJenis}
            setSelectedJenis={setSelectedJenis}
            toggleJenisStatus={toggleJenisStatus}
            copyExamLink={copyExamLink}
            handleShowQR={handleShowQR}
            handleEditJenis={handleEditJenis}
            setViewingQuestionsJenis={setViewingQuestionsJenis}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'peserta' && (
          <PesertaManagement 
            peserta={peserta}
            jenisUjian={jenisUjian}
            selectedGroupJenis={selectedGroupJenis}
            setSelectedGroupJenis={setSelectedGroupJenis}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedPeserta={selectedPeserta}
            setSelectedPeserta={setSelectedPeserta}
            deletePeserta={deletePeserta}
          />
        )}

        {activeTab === 'live_monitor' && (
          <LiveMonitor 
            peserta={peserta}
            jenisUjian={jenisUjian}
          />
        )}

        {activeTab === 'soal' && (
          <SoalManagement 
            soal={soal}
            jenisUjian={jenisUjian}
            selectedSoalGroupJenis={selectedSoalGroupJenis}
            setSelectedSoalGroupJenis={setSelectedSoalGroupJenis}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedSoal={selectedSoal}
            setSelectedSoal={setSelectedSoal}
            deleteSoal={deleteSoal}
          />
        )}

        {activeTab === 'requests' && (
          <RemedialRequests 
            requests={requests}
            jenisUjian={jenisUjian}
            handleApproveRequest={handleApproveRequest}
            handleRejectRequest={handleRejectRequest}
          />
        )}

        {activeTab === 'hasil' && (
          <HasilManagement 
            results={results}
            jenisUjian={jenisUjian}
            peserta={peserta}
            showHasilDetail={showHasilDetail}
            setShowHasilDetail={setShowHasilDetail}
            selectedHasilJenis={selectedHasilJenis}
            setSelectedHasilJenis={setSelectedHasilJenis}
            selectedHasilDate={selectedHasilDate}
            setSelectedHasilDate={setSelectedHasilDate}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            deleteHasil={deleteHasil}
            setSelectedResultForCheating={setSelectedResultForCheating}
            setShowCheatingModal={setShowCheatingModal}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettingsTab 
            admins={admins}
            admin={admin}
            setShowAddAdminModal={setShowAddAdminModal}
            setShowSecurityModal={setShowSecurityModal}
            handleExportDatabase={handleExportDatabase}
            fetchData={fetchData}
          />
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

      <ManagementModals
        showAddPesertaModal={showAddPesertaModal}
        setShowAddPesertaModal={setShowAddPesertaModal}
        newPeserta={newPeserta}
        setNewPeserta={setNewPeserta}
        jenisUjian={jenisUjian}
        handleSavePeserta={handleSavePeserta}
        loading={loading}
        showAddAdminModal={showAddAdminModal}
        setShowAddAdminModal={setShowAddAdminModal}
        newAdmin={newAdmin}
        setNewAdmin={setNewAdmin}
        handleSaveAdmin={handleSaveAdmin}
        showAddSoalModal={showAddSoalModal}
        setShowAddSoalModal={setShowAddSoalModal}
        newSoal={newSoal}
        setNewSoal={setNewSoal}
        handleSaveSoal={handleSaveSoal}
        showAddJenisModal={showAddJenisModal}
        setShowAddJenisModal={setShowAddJenisModal}
        newJenis={newJenis}
        setNewJenis={setNewJenis}
        handleSaveJenis={handleSaveJenis}
        showEditJenisModal={showEditJenisModal}
        setShowEditJenisModal={setShowEditJenisModal}
        editingJenis={editingJenis}
        setEditingJenis={setEditingJenis}
        handleUpdateJenis={handleUpdateJenis}
      />

      <UtilityModals
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
        exportFilters={exportFilters}
        setExportFilters={setExportFilters}
        performExport={performExport}
        results={results}
        jenisUjian={jenisUjian}
        idLocale={id}
        showQRModal={showQRModal}
        setShowQRModal={setShowQRModal}
        qrData={qrData}
        downloadQR={downloadQR}
        showSecurityModal={showSecurityModal}
        setShowSecurityModal={setShowSecurityModal}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        handleChangePassword={handleChangePassword}
        loading={loading}
        showResetConfirmModal={showResetConfirmModal}
        setShowResetConfirmModal={setShowResetConfirmModal}
        resetPasswordInput={resetPasswordInput}
        setResetPasswordInput={setResetPasswordInput}
        resetPasswordError={resetPasswordError}
        setResetPasswordError={setResetPasswordError}
        handleConfirmReset={handleConfirmReset}
        showDashboardSettings={showDashboardSettings}
        setShowDashboardSettings={setShowDashboardSettings}
        dashboardConfig={dashboardConfig}
        setDashboardConfig={setDashboardConfig}
        handleResetData={handleResetData}
        showUploadPesertaModal={showUploadPesertaModal}
        setShowUploadPesertaModal={setShowUploadPesertaModal}
        targetJenisId={targetJenisId}
        setTargetJenisId={setTargetJenisId}
        handleFileUploadPeserta={handleFileUploadPeserta}
      />

      <ViewModals
        showGuideModal={showGuideModal}
        setShowGuideModal={setShowGuideModal}
        guidePage={guidePage}
        setGuidePage={setGuidePage}
        showCheatingModal={showCheatingModal}
        setShowCheatingModal={setShowCheatingModal}
        selectedResultForCheating={selectedResultForCheating}
        viewingQuestionsJenis={viewingQuestionsJenis}
        setViewingQuestionsJenis={setViewingQuestionsJenis}
        soal={soal}
      />

      <SpreadsheetModals
        showSelectJenisModal={showSelectJenisModal}
        setShowSelectJenisModal={setShowSelectJenisModal}
        selectJenisMode={selectJenisMode}
        spreadsheetJenisId={spreadsheetJenisId}
        setSpreadsheetJenisId={setSpreadsheetJenisId}
        jenisUjian={jenisUjian}
        showSpreadsheetPeserta={showSpreadsheetPeserta}
        setShowSpreadsheetPeserta={setShowSpreadsheetPeserta}
        spreadsheetPesertaRows={spreadsheetPesertaRows}
        setSpreadsheetPesertaRows={setSpreadsheetPesertaRows}
        showSpreadsheetSoal={showSpreadsheetSoal}
        setShowSpreadsheetSoal={setShowSpreadsheetSoal}
        spreadsheetSoalRows={spreadsheetSoalRows}
        setSpreadsheetSoalRows={setSpreadsheetSoalRows}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        anchorRow={anchorRow}
        setAnchorRow={setAnchorRow}
        isDraggingRef={isDraggingRef}
        bulkKategori={bulkKategori}
        setBulkKategori={setBulkKategori}
        savingSpreadsheet={savingSpreadsheet}
        handleSaveSpreadsheetPeserta={handleSaveSpreadsheetPeserta}
        handleSaveSpreadsheetSoal={handleSaveSpreadsheetSoal}
        emptyPesertaRow={emptyPesertaRow}
        emptySoalRow={emptySoalRow}
      />
    </div>
  );
};
