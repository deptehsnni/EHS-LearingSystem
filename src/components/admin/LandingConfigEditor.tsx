import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export const LandingConfigEditor: React.FC = () => {
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('landing_config').select('*').eq('id', 'main').single()
      .then(({ data }) => {
        if (data) { 
          setJudul(data.judul || ''); 
          setDeskripsi(data.deskripsi || ''); 
        } else { 
          setJudul('Induksi & Keselamatan Kerja'); 
          setDeskripsi('Platform ujian induksi keselamatan kerja profesional.'); 
        }
      });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await supabase.from('landing_config').upsert([{ id: 'main', judul, deskripsi }], { onConflict: 'id' });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) { 
      console.error(err); 
      alert('Gagal menyimpan konfigurasi.');
    } finally { 
      setLoading(false); 
    }
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
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#49454F] mb-1">Judul Utama</label>
          <input 
            type="text"
            value={judul}
            onChange={e => setJudul(e.target.value)}
            className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
            placeholder="Contoh: Induksi & Keselamatan Kerja"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#49454F] mb-1">Deskripsi Singkat</label>
          <textarea 
            rows={3}
            value={deskripsi}
            onChange={e => setDeskripsi(e.target.value)}
            className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
            placeholder="Deskripsi platform..."
          />
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-[#6750A4] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4F378B] transition-all disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : 'Update Tampilan'}
        </button>
      </div>
    </div>
  );
};
