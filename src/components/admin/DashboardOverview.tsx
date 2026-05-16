import React, { useMemo } from 'react';
import { 
  Users, 
  BarChart3, 
  Settings, 
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { HasilUjian, PesertaMaster, JenisUjian } from '../../types';

interface DashboardOverviewProps {
  results: HasilUjian[];
  peserta: PesertaMaster[];
  jenisUjian: JenisUjian[];
  dashboardFilterJenis: string | 'all';
  setDashboardFilterJenis: (val: string) => void;
  dashboardConfig: {
    showPieChart: boolean;
    showBarChartMonth: boolean;
    showBarChartYear: boolean;
    compactMode: boolean;
  };
  setShowDashboardSettings: (val: boolean) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  results,
  peserta,
  jenisUjian,
  dashboardFilterJenis,
  setDashboardFilterJenis,
  dashboardConfig,
  setShowDashboardSettings
}) => {

  // Analytics Logic (Moved from parent)
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

    const uniquePeserta = new Set(filteredResults.map(r => r.nik)).size;

    const now = new Date();
    const thisMonthCount = filteredResults.filter(r => {
      const d = new Date(r.waktu_selesai);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const uniqueTrainingDates = new Set(filteredResults.map(r => new Date(r.waktu_selesai).toISOString().split('T')[0]));
    const totalTrainingCount = uniqueTrainingDates.size;

    return {
      totalAttempts, totalLulus, totalGagal, lulusRate, avgNilai,
      uniquePeserta, thisMonthCount, totalTrainingCount,
      totalUjianSistem: jenisUjian.length
    };
  }, [results, jenisUjian, dashboardFilterJenis]);

  const pieData = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    const kategoris: Record<string, number> = {};
    filteredResults.forEach(r => {
      const p = peserta.find(p => p.nik === r.nik);
      const perusahaanStr = r.perusahaan || p?.perusahaan || '';
      const isKaryawan = /pt\.?\s*nni/i.test(String(perusahaanStr)) || String(perusahaanStr).trim().toUpperCase() === 'NNI';
      const normalizedKat = isKaryawan ? 'Karyawan' : 'Kontraktor';
      kategoris[normalizedKat] = (kategoris[normalizedKat] || 0) + 1;
    });
    return Object.entries(kategoris).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [peserta, results, dashboardFilterJenis]);

  const lulusDonutData = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    const lulus = filteredResults.filter(r => r.status_lulus).length;
    const gagal = filteredResults.length - lulus;
    return [
      { name: 'Lulus', value: lulus },
      { name: 'Tidak Lulus', value: gagal },
    ].filter(d => d.value > 0);
  }, [results, dashboardFilterJenis]);

  const topPerusahaanData = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
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

  const trendLulusData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
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

  const recentActivity = useMemo(() => {
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    return filteredResults.slice(0, 8);
  }, [results, dashboardFilterJenis]);

  const barChartMonthData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
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
    const filteredResults = dashboardFilterJenis === 'all' ? results : results.filter(r => r.jenis_ujian_id === dashboardFilterJenis);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months.map((name, i) => {
      const val = filteredResults.filter(r => {
        const d = new Date(r.waktu_selesai);
        return d.getFullYear() === currentYear && d.getMonth() === i;
      }).length;
      return { name, val };
    });
  }, [results, dashboardFilterJenis]);

  return (
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
            <button onClick={()=>setShowDashboardSettings(true)} className="p-2.5 rounded-xl transition-all" style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.7)'}}>
              <Settings size={18}/>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -5 }} className="relative overflow-hidden rounded-[24px] p-5 flex flex-col justify-between min-h-[140px]" style={{background:'linear-gradient(135deg,#6750A4 0%,#4F378B 100%)'}}>
          <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-15 bg-white"/>
          <div className="p-2 rounded-xl bg-white/20 w-fit"><Users size={16} className="text-white"/></div>
          <div>
            <h3 className="text-3xl font-black text-white">{stats.totalAttempts}</h3>
            <p className="text-xs font-bold text-white/80 mt-0.5">Total Peserta Ujian</p>
            <p className="text-[10px] text-white/50 mt-0.5">{stats.uniquePeserta} peserta unik</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="relative overflow-hidden rounded-[24px] p-5 flex flex-col justify-between min-h-[140px]" style={{background:'linear-gradient(135deg,#1B5E20 0%,#2E7D32 100%)'}}>
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
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="rounded-[24px] p-5 flex flex-col justify-between bg-white border border-[#E6E1E5] shadow-sm min-h-[140px]">
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
        </motion.div>

        <motion.div whileHover={{ y: -5 }} className="rounded-[24px] p-5 flex flex-col justify-between bg-white border border-[#E6E1E5] shadow-sm min-h-[140px]">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-[#FFF8E1]"><Clock size={16} className="text-[#F57F17]"/></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
              Aktif
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#1C1B1F]">{stats.totalTrainingCount}</h3>
            <p className="text-xs font-bold text-[#49454F] mt-0.5">Jumlah Pelaksanaan Training</p>
          </div>
        </motion.div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Donut Lulus vs Gagal */}
            <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
              <h4 className="text-sm font-bold text-[#1C1B1F] mb-4">Rasio Kelulusan</h4>
              <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={lulusDonutData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#2E7D32" />
                      <Cell fill="#B3261E" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-[#1C1B1F]">{stats.lulusRate}%</span>
                  <span className="text-[10px] text-[#49454F] uppercase font-bold">Lulus</span>
                </div>
              </div>
              <div className="mt-4 flex justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]"/>
                  <span className="text-[10px] font-bold text-[#49454F]">Lulus</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#B3261E]"/>
                  <span className="text-[10px] font-bold text-[#49454F]">Gagal</span>
                </div>
              </div>
            </div>

            {/* Pie Kategori */}
            {dashboardConfig.showPieChart && (
              <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
                <h4 className="text-sm font-bold text-[#1C1B1F] mb-4">Kategori Peserta</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                        <Cell fill="#6750A4" />
                        <Cell fill="#006A6A" />
                        <Cell fill="#E6A620" />
                        <Cell fill="#49454F" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
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
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-5">
          {/* Recent Activity Mini List */}
          <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
            <h4 className="text-sm font-bold text-[#1C1B1F] mb-4">Aktivitas Terkini</h4>
            <div className="space-y-4">
              {recentActivity.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
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

          {/* Top Perusahaan */}
          {topPerusahaanData.length > 0 && (
            <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 rounded-full bg-[#F57F17]"/>
                <h4 className="text-sm font-bold text-[#1C1B1F]">Top Perusahaan</h4>
              </div>
              <div className="space-y-3 mt-4">
                {topPerusahaanData.map((p, i) => (
                  <div key={p.nama} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#1C1B1F] truncate mr-2">{p.nama}</span>
                      <span className="text-[#49454F] font-mono">{p.total}</span>
                    </div>
                    <div className="h-1 bg-[#F3F0F5] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#F57F17] transition-all" style={{width:`${topPerusahaanData[0].total>0?(p.total/topPerusahaanData[0].total)*100:0}%`}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tren & Bar Tahunan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Line Chart Tren Kelulusan */}
        <div className="bg-white rounded-[24px] border border-[#E6E1E5] shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-[#2E7D32]"/>
            <h4 className="text-sm font-bold text-[#1C1B1F]">Tren Kelulusan {new Date().getFullYear()}</h4>
          </div>
          <p className="text-[10px] text-[#9CA3AF] mb-4 ml-3">% kelulusan per bulan</p>
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
            <p className="text-[10px] text-[#9CA3AF] mb-4 ml-3">Jumlah ujian per bulan</p>
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

      {/* Ringkasan per Jenis Ujian Table */}
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
  );
};
