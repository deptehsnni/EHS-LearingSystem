import React from 'react';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { RemedialRequest, JenisUjian } from '../../types';

interface RemedialRequestsProps {
  requests: RemedialRequest[];
  jenisUjian: JenisUjian[];
  handleApproveRequest: (id: string) => void;
  handleRejectRequest: (id: string) => void;
}

export const RemedialRequests: React.FC<RemedialRequestsProps> = ({
  requests,
  jenisUjian,
  handleApproveRequest,
  handleRejectRequest,
}) => {
  return (
    <div className="bg-white rounded-[32px] border border-[#E6E1E5] shadow-sm overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="bg-[#F3F0F5] text-[#49454F] text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">Waktu Request</th>
              <th className="px-6 py-4 font-bold">Peserta</th>
              <th className="px-6 py-4 font-bold">Perusahaan</th>
              <th className="px-6 py-4 font-bold">Jenis Ujian</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E1E5]">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-[#FDFCFB] transition-colors">
                <td className="px-6 py-4 text-sm">
                  {format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-[#1C1B1F]">{r.nama}</p>
                  <p className="text-xs text-[#49454F] font-mono">{r.nik || '-'}</p>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {r.perusahaan || '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {jenisUjian.find(j => j.id === r.jenis_ujian_id)?.nama || 'Unknown'}
                </td>
                <td className="px-6 py-4">
                  <span className={clsx(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                    r.status === 'pending' ? "bg-[#FFF8E1] text-[#F57F17]" :
                    r.status === 'approved' ? "bg-[#E8F5E9] text-[#2E7D32]" :
                    "bg-[#F9DEDC] text-[#B3261E]"
                  )}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleApproveRequest(r.id)}
                        className="p-2 text-[#2E7D32] hover:bg-[#E8F5E9] rounded-lg transition-all"
                        title="Setujui"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => handleRejectRequest(r.id)}
                        className="p-2 text-[#B3261E] hover:bg-[#F9DEDC] rounded-lg transition-all"
                        title="Tolak"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#49454F]">
                  Tidak ada request remedial saat ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
