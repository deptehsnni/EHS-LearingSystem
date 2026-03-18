import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, LogIn, AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export const LandingPage: React.FC = () => {
  const [nik, setNik] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemedialModal, setShowRemedialModal] = useState(false);
  const [remedialData, setRemedialData] = useState<{nik: string, nama: string, perusahaan: string, examId: string} | null>(null);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [inactiveExamName, setInactiveExamName] = useState('');
  const [landingConfig, setLandingConfig] = useState({
    judul: 'Induksi & Keselamatan Kerja',
    deskripsi: 'Platform ujian induksi keselamatan kerja profesional. Pastikan setiap pekerja memahami standar K3 sebelum memasuki area kerja.'
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const examId = searchParams.get('exam');
    if (examId) {
      localStorage.setItem('preferred_exam', examId);
    }
  }, [searchParams]);

  useEffect(() => {
    supabase
      .from('landing_config')
      .select('*')
      .eq('id', 'main')
      .single()
      .then(({ data }) => {
        if (data) {
          setLandingConfig({
            judul: data.judul || 'Induksi & Keselamatan Kerja',
            deskripsi: data.deskripsi || 'Platform ujian induksi keselamatan kerja profesional. Pastikan setiap pekerja memahami standar K3 sebelum memasuki area kerja.'
          });
        }
      });
  }, []);

  const handleParticipantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('peserta_master')
        .select('*')
        .eq('nik', nik)
        .single();

      if (fetchError || !data) {
        setError('NIK / No. ID tidak terdaftar. Silakan hubungi Admin.');
      } else {
        // Check for daily limit before proceeding
        const preferredExamId = localStorage.getItem('preferred_exam');
        const examId = preferredExamId || data.allowed_jenis_id;

        if (examId) {
          const { data: jenisData } = await supabase
            .from('jenis_ujian')
            .select('*')
            .eq('id', examId)
            .single();

          // Cek apakah ujian sedang aktif
          if (jenisData && !jenisData.is_active) {
            setInactiveExamName(jenisData.nama || 'Ujian');
            setShowInactiveModal(true);
            setLoading(false);
            return;
          }

          const isLimitEnabled = jenisData && (jenisData.limit_one_per_day === true || jenisData.timer_minutes < 0);
          if (isLimitEnabled) {
            // Hitung awal hari WIB (UTC+7)
            const now = new Date();
            const offsetMs = 7 * 60 * 60 * 1000;
            const wibNow = new Date(now.getTime() + offsetMs);
            wibNow.setUTCHours(0, 0, 0, 0);
            const todayStart = new Date(wibNow.getTime() - offsetMs).toISOString();

            const { data: previousAttempts, error: attemptsError } = await supabase
              .from('hasil_ujian')
              .select('id')
              .eq('nik', nik)
              .eq('jenis_ujian_id', examId)
              .gte('waktu_selesai', todayStart);

            if (attemptsError) console.error('Cek attempts error:', attemptsError.message);

            if (previousAttempts && previousAttempts.length > 0) {
              // Hitung total slot yang pernah diberikan (approved + used) hari ini
              const { data: allRemedial } = await supabase
                .from('remedial_requests')
                .select('id, status')
                .eq('nik', nik)
                .eq('jenis_ujian_id', examId)
                .in('status', ['approved', 'used'])
                .gte('created_at', todayStart);

              const totalSlotDiberikan = allRemedial?.length || 0;
              const approvedSlot = allRemedial?.filter(r => r.status === 'approved') || [];

              // Blokir jika attempts >= 1 (ujian awal) + total slot yang pernah diberikan
              if (previousAttempts.length >= 1 + totalSlotDiberikan) {
                setRemedialData({ nik: data.nik, nama: data.nama, perusahaan: data.perusahaan, examId });
                setShowRemedialModal(true);
                setLoading(false);
                return;
              }

              // Ada slot approved yang belum dipakai → tandai used, izinkan masuk
              if (approvedSlot.length > 0) {
                await supabase
                  .from('remedial_requests')
                  .update({ status: 'used' })
                  .eq('id', approvedSlot[0].id);
              }
              data.is_remedial = true;
            }
          }
        }

        // Store participant session in localStorage for simplicity in this demo
        localStorage.setItem('ehs_participant', JSON.stringify(data));
        navigate('/induction');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRemedial = async () => {
    if (!remedialData) return;
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('remedial_requests')
        .select('*')
        .eq('nik', remedialData.nik)
        .eq('jenis_ujian_id', remedialData.examId)
        .eq('status', 'pending');

      if (existing && existing.length > 0) {
        alert('Permintaan remedial Anda sedang diproses oleh Admin.');
        setShowRemedialModal(false);
        return;
      }

      const { error: insertError } = await supabase.from('remedial_requests').insert([{
        nik: remedialData.nik,
        nama: remedialData.nama,
        perusahaan: remedialData.perusahaan,
        jenis_ujian_id: remedialData.examId,
        status: 'pending'
      }]);

      if (insertError) throw insertError;
      alert('Permintaan remedial telah dikirim ke Admin.');
      setShowRemedialModal(false);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim permintaan remedial.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { icon: '01', label: 'Masukkan NIK / No. ID', desc: 'NIK KTP atau ID Karyawan' },
    { icon: '02', label: 'Isi Data Diri', desc: 'Lengkapi profil & komitmen' },
    { icon: '03', label: 'Ikuti Ujian', desc: 'Kerjakan soal dengan jujur' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      {/* Background grid pattern */}
      <div className="fixed inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#E6A620 1px, transparent 1px), linear-gradient(90deg, #E6A620 1px, transparent 1px)', backgroundSize: '40px 40px'}} />

      {/* Modals */}
      <AnimatePresence>
        {showInactiveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#1A1A1A] border border-[#B3261E]/40 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-[#B3261E]/20 text-[#F87171] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-3">Sesi Ujian Belum Dibuka</h3>
              <p className="text-[#9CA3AF] text-center mb-2 text-sm">
                Ujian <span className="font-bold text-white">{inactiveExamName}</span> saat ini belum aktif.
              </p>
              <p className="text-[#6B7280] text-center text-xs mb-8">Hubungi Admin untuk membuka sesi, atau coba lagi nanti.</p>
              <button onClick={() => setShowInactiveModal(false)}
                className="w-full py-3.5 bg-[#B3261E] text-white rounded-2xl font-bold hover:bg-[#8C1D18] transition-all"
              >Tutup</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRemedialModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-[#1A1A1A] border border-[#E6A620]/30 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-[#E6A620]/10 text-[#E6A620] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-3">Batas Ujian Tercapai</h3>
              <p className="text-[#9CA3AF] text-center text-sm mb-8">
                Anda sudah mengikuti ujian hari ini. Ujian hanya dapat dilakukan <span className="text-white font-semibold">1 kali per hari</span>.<br/><br/>
                Kirim permintaan ke Admin untuk mendapatkan akses ujian ulang.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handleRequestRemedial} disabled={loading}
                  className="w-full py-3.5 bg-[#E6A620] text-[#0F0F0F] rounded-2xl font-bold hover:bg-[#F5B800] transition-all disabled:opacity-50"
                >{loading ? 'Mengirim...' : 'Minta Akses Remedial'}</button>
                <button onClick={() => setShowRemedialModal(false)}
                  className="w-full py-3.5 bg-white/5 text-[#9CA3AF] border border-white/10 rounded-2xl font-medium hover:bg-white/10 transition-all"
                >Tutup</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1 flex flex-col-reverse lg:flex-row">
        {/* Left panel - Branding (tampil di bawah di mobile) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16 lg:min-h-screen"
        >
          {/* Branding - kiri di desktop */}
          <div className="flex items-center gap-4 mb-auto">
            <img src="/logo.svg" alt="Logo" className="w-14 h-14 lg:w-20 lg:h-20 object-contain" referrerPolicy="no-referrer" />
            <p className="text-[#E6A620] font-black tracking-wide text-xl lg:text-2xl leading-tight">EHS Learning System</p>
          </div>

          <div className="py-8 lg:py-0 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 bg-[#E6A620]/10 border border-[#E6A620]/20 rounded-full px-4 py-1.5 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E6A620] animate-pulse" />
                <span className="text-[#E6A620] text-xs font-semibold uppercase tracking-wider">Sistem Aktif</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6 whitespace-pre-line">
                {landingConfig.judul.includes('&') ? (
                  <>
                    {landingConfig.judul.split('&')[0].trim()} &<br />
                    <span className="text-[#E6A620]">{landingConfig.judul.split('&')[1]?.trim()}</span>
                  </>
                ) : (
                  <span className="text-[#E6A620]">{landingConfig.judul}</span>
                )}
              </h1>
              <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-md">
                {landingConfig.deskripsi}
              </p>
            </motion.div>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10 space-y-4"
            >
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#E6A620] text-xs font-black">{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{s.label}</p>
                    <p className="text-[#6B7280] text-xs">{s.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="mt-auto pt-8 hidden lg:block">
            <p className="text-[#374151] text-xs">© {new Date().getFullYear()} EHS Learning System</p>
          </div>
        </motion.div>

        {/* Right panel - Login form (tampil di atas di mobile) */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Logo hanya tampil di mobile */}
            <div className="flex flex-col items-center gap-3 mb-8 lg:hidden text-center">
              <img src="/logo.svg" alt="Logo" className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
              <p className="text-[#E6A620] font-black tracking-wide text-xl leading-tight">EHS Learning System</p>
            </div>

            <div className="bg-[#161616] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1">Masuk ke Sistem</h2>
                <p className="text-[#6B7280] text-sm">Masukkan NIK KTP atau No. ID Karyawan Anda</p>
              </div>

              <form onSubmit={handleParticipantLogin} className="space-y-5">
                <div>
                  <label htmlFor="nik" className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">
                    NIK KTP / No. ID Karyawan
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#4B5563]">
                      <User size={18} />
                    </div>
                    <input
                      id="nik"
                      type="text"
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      placeholder="Contoh: 3271XXXXXXXXXX / EMP-001"
                      className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#E6A620]/50 focus:border-[#E6A620]/50 transition-all text-white placeholder-[#374151] outline-none"
                      required
                    />
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 text-[#F87171] text-xs bg-[#B3261E]/10 border border-[#B3261E]/20 p-3 rounded-xl"
                    >
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E6A620] text-[#0F0F0F] py-4 rounded-2xl font-bold text-base hover:bg-[#F5B800] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#E6A620]/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0F0F0F]/30 border-t-[#0F0F0F] rounded-full animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>Mulai Induksi <ChevronRight size={18} /></>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                <button
                  onClick={() => navigate('/admin/login')}
                  className="text-[#4B5563] text-sm hover:text-[#9CA3AF] transition-colors flex items-center gap-2"
                >
                  <LogIn size={15} />
                  Admin Login
                </button>
              </div>
            </div>

            <p className="text-[#374151] text-xs text-center mt-6 lg:hidden">© {new Date().getFullYear()} EHS Learning System</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
