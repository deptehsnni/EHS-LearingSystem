import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

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
      // In a real app, use Supabase Auth or a secure password check
      // For this demo, we check the users_admin table
      const { data, error: fetchError } = await supabase
        .from('users_admin')
        .select('*')
        .eq('username', cleanUsername)
        .single();

      if (fetchError || !data) {
        setError('Username tidak ditemukan.');
      } else if (data.password_hash !== cleanPassword) {
        setError('Password salah. Silakan periksa kembali (Default: admin99).');
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

  return (
    <Layout showNav={false}>
      <div className="max-w-md mx-auto mt-12 sm:mt-20">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-[#49454F] hover:text-[#6750A4] transition-colors"
        >
          <ArrowLeft size={18} /> Kembali ke Beranda
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[28px] p-6 md:p-8 shadow-xl border border-[#E6E1E5]"
        >
          <div className="flex flex-col items-center mb-8">
            <img src="/logo.svg" alt="Logo" className="w-24 h-24 object-contain mb-4" referrerPolicy="no-referrer" />
            <h2 className="text-xl md:text-3xl font-bold text-[#E6A620]">EHS Learning System</h2>
            <p className="text-[#49454F] text-xs md:text-sm mt-1 font-medium text-center">Admin Dashboard - Pengelolaan Sistem Induksi</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#49454F] mb-2 ml-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#49454F]">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#F3F0F5] border-none rounded-xl focus:ring-2 focus:ring-[#6750A4]"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#49454F] mb-2 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#49454F]">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#F3F0F5] border-none rounded-xl focus:ring-2 focus:ring-[#6750A4]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#B3261E] text-sm bg-[#F9DEDC] p-3 rounded-xl">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1C1B1F] text-white py-4 rounded-xl font-bold shadow-md hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Login Admin'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-[#49454F]">
              Belum punya akun? <button className="text-[#6750A4] font-bold hover:underline">Daftar Admin</button>
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};
