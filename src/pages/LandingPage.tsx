import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { User, LogIn, AlertCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export const LandingPage: React.FC = () => {
  const [nik, setNik] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRemedialModal, setShowRemedialModal] = useState(false);
  const [remedialData, setRemedialData] = useState<{nik: string, nama: string, perusahaan: string, examId: string} | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const examId = searchParams.get('exam');
    if (examId) {
      localStorage.setItem('preferred_exam', examId);
    }
  }, [searchParams]);

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
        setError('NIK tidak terdaftar. Silakan hubungi Admin.');
      } else {
        // Check for daily limit before proceeding
        const preferredExamId = localStorage.getItem('preferred_exam');
        const examId = preferredExamId || data.allowed_jenis_id;

        if (examId) {
          const { data: jenisData, error: jenisError } = await supabase
            .from('jenis_ujian')
            .select('*')
            .eq('id', examId)
            .single();

          console.log('[DEBUG] examId:', examId);
          console.log('[DEBUG] jenisData:', jenisData);
          console.log('[DEBUG] jenisError:', jenisError);
          console.log('[DEBUG] limit_one_per_day:', jenisData?.limit_one_per_day);
          console.log('[DEBUG] timer_minutes:', jenisData?.timer_minutes);

          const isLimitEnabled = jenisData && (jenisData.limit_one_per_day === true || jenisData.timer_minutes < 0);
          console.log('[DEBUG] isLimitEnabled:', isLimitEnabled);

          if (isLimitEnabled) {
            const now = new Date();
            const offsetMs = 7 * 60 * 60 * 1000;
            const wibNow = new Date(now.getTime() + offsetMs);
            wibNow.setUTCHours(0, 0, 0, 0);
            const todayStart = new Date(wibNow.getTime() - offsetMs).toISOString();
            console.log('[DEBUG] todayStart:', todayStart);

            const { data: previousAttempts, error: attemptsError } = await supabase
              .from('hasil_ujian')
              .select('id')
              .eq('nik', nik)
              .eq('jenis_ujian_id', examId)
              .gte('waktu_selesai', todayStart);

            console.log('[DEBUG] previousAttempts:', previousAttempts);
            console.log('[DEBUG] attemptsError:', attemptsError);

            if (previousAttempts && previousAttempts.length > 0) {
              const { data: approvedRemedial, error: remError } = await supabase
                .from('remedial_requests')
                .select('id')
                .eq('nik', nik)
                .eq('jenis_ujian_id', examId)
                .eq('status', 'approved')
                .gte('created_at', todayStart);

              console.log('[DEBUG] approvedRemedial:', approvedRemedial);
              console.log('[DEBUG] remError:', remError);

              const approvedCount = approvedRemedial?.length || 0;
              console.log('[DEBUG] approvedCount:', approvedCount, '| attempts:', previousAttempts.length);

              if (previousAttempts.length >= 1 + approvedCount) {
                setRemedialData({ nik: data.nik, nama: data.nama, perusahaan: data.perusahaan, examId });
                setShowRemedialModal(true);
                setLoading(false);
                return;
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

  return (
    <Layout showNav={false}>
      <div className="max-w-md mx-auto mt-12 sm:mt-20">
        {/* Remedial Request Modal */}
        <AnimatePresence>
          {showRemedialModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#E6E1E5]"
              >
                <div className="w-20 h-20 bg-[#FFF8E1] text-[#F57F17] rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-bold text-[#1C1B1F] text-center mb-4">Batas Ujian Tercapai</h3>
                <p className="text-[#49454F] mb-8 text-center">
                  Anda sudah mengikuti ujian ini hari ini. Sesuai peraturan, ujian hanya dapat dilakukan 1 kali per hari.
                  <br /><br />
                  Silakan klik tombol di bawah untuk mengirim permintaan akses ujian ulang (Remedial) kepada Admin.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleRequestRemedial}
                    disabled={loading}
                    className="w-full py-4 bg-[#6750A4] text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-[#4F378B] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Mengirim Permintaan...' : 'Minta Akses Remedial'}
                  </button>
                  <button 
                    onClick={() => setShowRemedialModal(false)}
                    className="w-full py-4 bg-white text-[#49454F] border border-[#E6E1E5] rounded-2xl font-bold text-lg hover:bg-[#F3F0F5] transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[28px] p-6 md:p-8 shadow-xl border border-[#E6E1E5]"
        >
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.svg" alt="Logo" className="w-32 h-32 object-contain mb-4" referrerPolicy="no-referrer" />
            <h2 className="text-2xl md:text-4xl font-extrabold text-[#E6A620] text-center">EHS Learning System</h2>
            <p className="text-[#49454F] text-center mt-2 text-sm md:text-lg font-medium">Sistem Induksi & Keselamatan Kerja Profesional</p>
          </div>

          <form onSubmit={handleParticipantLogin} className="space-y-6">
            <div>
              <label htmlFor="nik" className="block text-sm font-medium text-[#49454F] mb-2 ml-1">
                Nomor Induk Karyawan (NIK)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#49454F]">
                  <User size={20} />
                </div>
                <input
                  id="nik"
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="Masukkan NIK sesuai KTP"
                  className="w-full pl-12 pr-4 py-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4] transition-all text-lg"
                  required
                />
              </div>
              {error && (
                <div className="mt-3 flex items-center gap-2 text-[#B3261E] text-sm bg-[#F9DEDC] p-3 rounded-xl">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6750A4] text-white py-4 rounded-2xl font-bold text-lg shadow-md hover:bg-[#4F378B] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Memverifikasi...' : 'Mulai Induksi'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-[#E6E1E5] flex flex-col items-center">
            <button
              onClick={() => navigate('/admin/login')}
              className="text-[#6750A4] font-semibold hover:underline flex items-center gap-2"
            >
              <LogIn size={18} />
              Admin Login
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};
