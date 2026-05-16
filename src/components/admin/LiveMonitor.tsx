import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity, XCircle, Trash2, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PesertaMaster, JenisUjian } from '../../types';

interface LiveMonitorProps {
  peserta: PesertaMaster[];
  jenisUjian: JenisUjian[];
}

interface SessionData {
  nik: string;
  token: string;
  last_active: string;
  jenis_ujian_id?: string;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({ peserta, jenisUjian }) => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [now, setNow] = useState(Date.now());
  const [showConfirmModal, setShowConfirmModal] = useState<{ show: boolean, nik: string, nama: string } | null>(null);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase.from('peserta_sessions').select('*');
      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 10000); // Polling every 10 seconds

    const timer = setInterval(() => setNow(Date.now()), 5000); // Update local time every 5s for UI

    // Realtime subscription (Optional enhancement, using polling as fallback)
    const channel = supabase
      .channel('live_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peserta_sessions' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setSessions(prev => {
            const exists = prev.find(s => s.nik === payload.new.nik);
            if (exists) return prev.map(s => s.nik === payload.new.nik ? payload.new as SessionData : s);
            return [...prev, payload.new as SessionData];
          });
        } else if (payload.eventType === 'DELETE') {
          setSessions(prev => prev.filter(s => s.nik !== payload.old.nik));
        }
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleForceKick = async (nik: string) => {
    try {
      const { error } = await supabase.from('peserta_sessions').delete().eq('nik', nik);
      if (error) throw error;
      setSessions(prev => prev.filter(s => s.nik !== nik));
      setShowConfirmModal(null);
    } catch (err) {
      console.error(err);
      alert('Gagal mengeluarkan peserta.');
    }
  };

  const getStatus = (lastActiveStr: string) => {
    const lastActive = new Date(lastActiveStr).getTime();
    const diffSeconds = (now - lastActive) / 1000;
    if (diffSeconds < 30) return 'online'; // Kurang dari 30 detik
    return 'offline';
  };

  const enrichedSessions = sessions.map(s => {
    const p = peserta.find(p => p.nik === s.nik);
    const j = jenisUjian.find(j => j.id === (s.jenis_ujian_id || p?.allowed_jenis_id));
    return {
      ...s,
      nama: p?.nama || 'Unknown',
      perusahaan: p?.perusahaan || '-',
      kategori: p?.kategori || '-',
      jenis_nama: j?.nama || 'Unknown Exam',
      status: getStatus(s.last_active)
    };
  });

  const filteredSessions = enrichedSessions.filter(s => 
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.nik.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineCount = enrichedSessions.filter(s => s.status === 'online').length;
  const offlineCount = enrichedSessions.filter(s => s.status === 'offline').length;

  return (
    <div className="space-y-6">
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[28px] max-w-sm w-full p-8 text-center shadow-2xl border border-[#E6E1E5]"
            >
              <div className="w-16 h-16 bg-[#F9DEDC] text-[#B3261E] rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#1C1B1F] mb-2">Force Kick Peserta?</h3>
              <p className="text-sm text-[#49454F] mb-6">
                Apakah Anda yakin ingin mengeluarkan paksa <span className="font-bold">{showConfirmModal.nama}</span> ({showConfirmModal.nik}) dari sesinya?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmModal(null)}
                  className="flex-1 py-3 bg-[#F3F0F5] text-[#49454F] font-bold rounded-xl hover:bg-[#E6E1E5]"
                >Batal</button>
                <button onClick={() => handleForceKick(showConfirmModal.nik)}
                  className="flex-1 py-3 bg-[#B3261E] text-white font-bold rounded-xl hover:bg-[#8C1D18]"
                >Keluarkan</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#E0F2F1] text-[#006A6A] rounded-2xl shadow-sm">
            <Activity size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#1C1B1F]">Live Monitor</h2>
            <p className="text-sm text-[#49454F]">Pantau aktivitas peserta ujian secara real-time</p>
          </div>
        </div>
        <button onClick={fetchSessions} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E6E1E5] rounded-xl text-sm font-bold text-[#6750A4] hover:bg-[#F3F0F5] shadow-sm">
          <RefreshCw size={16} /> Segarkan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E6E1E5] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-[#49454F] font-medium mb-1">Total Sesi Aktif</p>
            <p className="text-3xl font-black text-[#1C1B1F]">{enrichedSessions.length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#F3F0F5] flex items-center justify-center text-[#6750A4]">
            <Activity size={24} />
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#E6E1E5] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-[#49454F] font-medium mb-1">Sedang Mengerjakan</p>
            <p className="text-3xl font-black text-[#006A6A]">{onlineCount}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#E0F2F1] flex items-center justify-center text-[#006A6A]">
            <div className="w-4 h-4 rounded-full bg-[#006A6A] animate-pulse" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#E6E1E5] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-[#49454F] font-medium mb-1">Idle / Disconnected</p>
            <p className="text-3xl font-black text-[#B3261E]">{offlineCount}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#F9DEDC] flex items-center justify-center text-[#B3261E]">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#E6E1E5] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FDFCFB]">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#49454F]">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Cari NIK atau Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E6E1E5] rounded-xl focus:ring-2 focus:ring-[#6750A4] text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-[#49454F]">Memuat data...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center text-[#49454F]">
              <Activity size={48} className="text-[#CAC4D0] mb-4 opacity-50" />
              <p className="text-lg font-medium">Tidak ada sesi ujian yang sedang berjalan.</p>
              <p className="text-sm mt-1">Data akan muncul secara otomatis saat peserta masuk ke ujian.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F3F0F5] text-[#49454F]">
                <tr>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Peserta</th>
                  <th className="px-6 py-4 font-bold">Jenis Ujian</th>
                  <th className="px-6 py-4 font-bold">Update Terakhir</th>
                  <th className="px-6 py-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E1E5]">
                {filteredSessions.map((session) => (
                  <tr key={session.nik} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-6 py-4">
                      {session.status === 'online' ? (
                        <div className="inline-flex items-center gap-2 bg-[#E0F2F1] text-[#006A6A] px-3 py-1 rounded-full text-xs font-bold">
                          <div className="w-2 h-2 rounded-full bg-[#006A6A] animate-pulse" /> Online
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 bg-[#F9DEDC] text-[#B3261E] px-3 py-1 rounded-full text-xs font-bold">
                          <div className="w-2 h-2 rounded-full bg-[#B3261E]" /> Offline
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1C1B1F]">{session.nama}</span>
                        <span className="text-xs text-[#49454F] font-mono">{session.nik}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#6750A4]">{session.jenis_nama}</span>
                        <span className="text-xs text-[#49454F]">{session.perusahaan}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#49454F]">
                      {new Date(session.last_active).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setShowConfirmModal({ show: true, nik: session.nik, nama: session.nama })}
                        className="p-2 text-[#B3261E] bg-white border border-[#B3261E]/30 rounded-lg hover:bg-[#F9DEDC] transition-all group relative inline-flex items-center justify-center"
                        title="Force Kick"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
