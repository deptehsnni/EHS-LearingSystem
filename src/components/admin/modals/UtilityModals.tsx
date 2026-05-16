import React from 'react';
import { X, Trash2, Download, AlertTriangle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { HasilUjian, JenisUjian } from '../../../types';

interface UtilityModalsProps {
  // Confirm Modal
  showConfirmModal: {show: boolean, title: string, message: string, onConfirm: () => void};
  setShowConfirmModal: (val: any) => void;

  // QR Modal
  showQRModal: boolean;
  setShowQRModal: (val: boolean) => void;
  qrData: {url: string, name: string} | null;
  downloadQR: () => void;

  // Security Modal
  showSecurityModal: boolean;
  setShowSecurityModal: (val: boolean) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  handleChangePassword: (e: React.FormEvent) => void;

  // Export Modal
  showExportModal: boolean;
  setShowExportModal: (val: boolean) => void;
  exportFilters: {
    jenis_id: string;
    period: 'all' | 'daily' | 'monthly' | 'yearly';
    value: string;
  };
  setExportFilters: (val: any) => void;
  performExport: () => void;
  results: HasilUjian[];
  jenisUjian: JenisUjian[];

  // Dashboard Settings
  showDashboardSettings: boolean;
  setShowDashboardSettings: (val: boolean) => void;
  dashboardConfig: {
    showPieChart: boolean;
    showBarChartMonth: boolean;
    showBarChartYear: boolean;
    compactMode: boolean;
  };
  setDashboardConfig: (val: any) => void;
  handleResetData: () => void;

  // Reset Confirm
  showResetConfirmModal: boolean;
  setShowResetConfirmModal: (val: boolean) => void;
  resetPasswordInput: string;
  setResetPasswordInput: (val: string) => void;
  resetPasswordError: string;
  setResetPasswordError: (val: string) => void;
  handleConfirmReset: () => void;

  loading: boolean;
}

export const UtilityModals: React.FC<UtilityModalsProps> = (props) => {
  const {
    showConfirmModal, setShowConfirmModal,
    showQRModal, setShowQRModal, qrData, downloadQR,
    showSecurityModal, setShowSecurityModal, newPassword, setNewPassword, handleChangePassword,
    showExportModal, setShowExportModal, exportFilters, setExportFilters, performExport, results, jenisUjian,
    showDashboardSettings, setShowDashboardSettings, dashboardConfig, setDashboardConfig, handleResetData,
    showResetConfirmModal, setShowResetConfirmModal, resetPasswordInput, setResetPasswordInput, resetPasswordError, setResetPasswordError, handleConfirmReset,
    loading
  } = props;

  return (
    <>
      {/* Confirm Modal */}
      {showConfirmModal.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-xl font-bold mb-2">{showConfirmModal.title}</h3>
            <p className="text-[#49454F] mb-8">{showConfirmModal.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirmModal((prev: any) => ({ ...prev, show: false }))}
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

      {/* Security Modal */}
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

      {/* Export Modal */}
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
                      .sort((a, b) => b.localeCompare(a))
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
                      .sort((a, b) => b.localeCompare(a))
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
                      .sort((a, b) => b.localeCompare(a))
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
              {[
                { label: 'Tampilkan Pie Chart', key: 'showPieChart' },
                { label: 'Tampilkan Bar Chart Bulanan', key: 'showBarChartMonth' },
                { label: 'Tampilkan Bar Chart Tahunan', key: 'showBarChartYear' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-[#F3F0F5] rounded-2xl">
                  <span className="text-sm font-medium text-[#49454F]">{item.label}</span>
                  <input 
                    type="checkbox" 
                    checked={(dashboardConfig as any)[item.key]}
                    onChange={e => setDashboardConfig({...dashboardConfig, [item.key]: e.target.checked})}
                    className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]"
                  />
                </div>
              ))}
              
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
    </>
  );
};
