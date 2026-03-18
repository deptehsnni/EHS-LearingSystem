import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    try {
      const { data, error: fetchError } = await supabase
        .from('users_admin')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (fetchError || !data) {
        setError('Username tidak ditemukan.');
      } else if (data.password_hash !== cleanPassword) {
        setError('Password salah. Silakan periksa kembali.');
      } else if (!data.is_approved) {
        setError('Akun Anda belum disetujui oleh Super Admin.');
      } else {
        localStorage.setItem('ehs_admin', JSON.stringify(data));
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '01', label: 'Kelola Peserta', desc: 'Tambah & atur data peserta' },
    { icon: '02', label: 'Bank Soal', desc: 'Buat & kelola soal ujian' },
    { icon: '03', label: 'Laporan', desc: 'Pantau hasil & statistik' },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#E6A620 1px, transparent 1px), linear-gradient(90deg, #E6A620 1px, transparent 1px)', backgroundSize: '40px 40px'}} />

      <div className="relative flex-1 flex flex-col-reverse lg:flex-row">
        {/* Left panel - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-1/2 flex flex-col justify-between p-8 md:p-12 lg:p-16 lg:min-h-screen"
        >
          <div className="flex items-center gap-4 mb-auto">
            <img src="/logo.svg" alt="Logo" className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
            <div>
              <p className="text-[#E6A620] font-black tracking-wide text-xl leading-tight">EHS Learning</p>
              <p className="text-[#E6A620] font-black tracking-wide text-xl leading-tight">System</p>
            </div>
          </div>

          <div className="py-12 lg:py-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="inline-flex items-center gap-2 bg-[#E6A620]/10 border border-[#E6A620]/20 rounded-full px-4 py-1.5 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E6A620] animate-pulse" />
                <span className="text-[#E6A620] text-xs font-semibold uppercase tracking-wider">Admin Panel</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
                Dashboard &<br />
                <span className="text-[#E6A620]">Manajemen</span><br />
                Sistem
              </h1>
              <p className="text-[#6B7280] text-base md:text-lg leading-relaxed max-w-md">
                Kelola seluruh data ujian induksi, peserta, soal, dan laporan hasil dari satu panel terpusat.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-10 space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#E6A620] text-xs font-black">{f.icon}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{f.label}</p>
                    <p className="text-[#6B7280] text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="mt-auto pt-8 hidden lg:block">
            <p className="text-[#374151] text-xs">© {new Date().getFullYear()} EHS Learning System</p>
          </div>
        </motion.div>

        {/* Right panel - Login form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Logo mobile only */}
            <div className="flex items-center gap-4 mb-8 lg:hidden">
              <img src="/logo.svg" alt="Logo" className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
              <div>
                <p className="text-[#E6A620] font-black tracking-wide text-xl leading-tight">EHS Learning</p>
                <p className="text-[#E6A620] font-black tracking-wide text-xl leading-tight">System</p>
              </div>
            </div>

            <div className="bg-[#161616] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
              <div className="mb-8">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-1.5 text-[#4B5563] text-sm hover:text-[#9CA3AF] transition-colors mb-6"
                >
                  <ArrowLeft size={15} /> Kembali ke Beranda
                </button>
                <h2 className="text-2xl font-bold text-white mb-1">Login Admin</h2>
                <p className="text-[#6B7280] text-sm">Masuk ke panel pengelolaan sistem</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#4B5563]">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#E6A620]/50 focus:border-[#E6A620]/50 transition-all text-white placeholder-[#374151] outline-none"
                      placeholder="Masukkan username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#4B5563]">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[#E6A620]/50 focus:border-[#E6A620]/50 transition-all text-white placeholder-[#374151] outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-[#F87171] text-xs bg-[#B3261E]/10 border border-[#B3261E]/20 p-3 rounded-xl"
                    >
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#E6A620] text-[#0F0F0F] py-4 rounded-2xl font-bold text-base hover:bg-[#F5B800] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#E6A620]/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0F0F0F]/30 border-t-[#0F0F0F] rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>Login Admin <ChevronRight size={18} /></>
                  )}
                </button>
              </form>
            </div>

            <p className="text-[#374151] text-xs text-center mt-6 lg:hidden">© {new Date().getFullYear()} EHS Learning System</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
