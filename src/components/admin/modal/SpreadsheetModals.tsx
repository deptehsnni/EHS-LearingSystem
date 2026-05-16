import React from 'react';
import { X, Table2, Plus, Trash2, Save, ChevronRight, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { JenisUjian } from '../../../types';

interface SpreadsheetModalsProps {
  // Selection
  showSelectJenisModal: boolean;
  setShowSelectJenisModal: (val: boolean) => void;
  selectJenisMode: 'peserta' | 'soal';
  spreadsheetJenisId: string;
  setSpreadsheetJenisId: (val: string) => void;
  jenisUjian: JenisUjian[];

  // Peserta Spreadsheet
  showSpreadsheetPeserta: boolean;
  setShowSpreadsheetPeserta: (val: boolean) => void;
  spreadsheetPesertaRows: any[];
  setSpreadsheetPesertaRows: (val: any[] | ((prev: any[]) => any[])) => void;
  
  // Soal Spreadsheet
  showSpreadsheetSoal: boolean;
  setShowSpreadsheetSoal: (val: boolean) => void;
  spreadsheetSoalRows: any[];
  setSpreadsheetSoalRows: (val: any[] | ((prev: any[]) => any[])) => void;

  // Interaction State
  selectedRows: Set<number>;
  setSelectedRows: (val: Set<number>) => void;
  anchorRow: number | null;
  setAnchorRow: (val: number | null) => void;
  isDraggingRef: React.MutableRefObject<boolean>;
  bulkKategori: string;
  setBulkKategori: (val: string) => void;
  savingSpreadsheet: boolean;

  // Handlers
  handleSaveSpreadsheetPeserta: () => void;
  handleSaveSpreadsheetSoal: () => void;
  emptyPesertaRow: () => any;
  emptySoalRow: () => any;
}

export const SpreadsheetModals: React.FC<SpreadsheetModalsProps> = (props) => {
  const {
    showSelectJenisModal, setShowSelectJenisModal, selectJenisMode, spreadsheetJenisId, setSpreadsheetJenisId, jenisUjian,
    showSpreadsheetPeserta, setShowSpreadsheetPeserta, spreadsheetPesertaRows, setSpreadsheetPesertaRows,
    showSpreadsheetSoal, setShowSpreadsheetSoal, spreadsheetSoalRows, setSpreadsheetSoalRows,
    selectedRows, setSelectedRows, anchorRow, setAnchorRow, isDraggingRef, bulkKategori, setBulkKategori, savingSpreadsheet,
    handleSaveSpreadsheetPeserta, handleSaveSpreadsheetSoal, emptyPesertaRow, emptySoalRow
  } = props;

  return (
    <>
      {/* Modal Pilih Jenis Ujian untuk Spreadsheet */}
      {showSelectJenisModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
            className="bg-white rounded-[28px] w-full max-w-md p-8 shadow-2xl border border-[#E6E1E5]">
            <h3 className="text-xl font-bold mb-2">Pilih Jenis {selectJenisMode === 'peserta' ? 'Pelatihan' : 'Ujian'}</h3>
            <p className="text-sm text-[#49454F] mb-6">
              {selectJenisMode === 'peserta' ? 'Peserta akan didaftarkan ke jenis pelatihan yang dipilih.' : 'Soal akan dimasukkan ke jenis ujian yang dipilih.'}
            </p>
            <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
              {jenisUjian.map(j => (
                <button key={j.id}
                  onClick={() => {
                    setSpreadsheetJenisId(j.id);
                    setShowSelectJenisModal(false);
                    if (selectJenisMode === 'peserta') {
                      setSpreadsheetPesertaRows(Array.from({length:10}, emptyPesertaRow));
                      setShowSpreadsheetPeserta(true);
                    } else {
                      setSpreadsheetSoalRows(Array.from({length:10}, emptySoalRow));
                      setShowSpreadsheetSoal(true);
                    }
                  }}
                  className="w-full p-4 rounded-2xl border-2 border-[#E6E1E5] hover:border-[#6750A4] hover:bg-[#F3F0F5] text-left transition-all flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-[#EADDFF] text-[#6750A4] flex items-center justify-center group-hover:bg-[#6750A4] group-hover:text-white transition-all flex-shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#1C1B1F]">{j.nama}</p>
                    <p className="text-xs text-[#49454F]">{Math.abs(j.timer_minutes)} menit · {j.is_active ? '🟢 Aktif' : '🔴 Nonaktif'}</p>
                  </div>
                  <ChevronRight size={18} className="text-[#CAC4D0] group-hover:text-[#6750A4]" />
                </button>
              ))}
              {jenisUjian.length === 0 && <p className="text-center text-[#49454F] py-4 text-sm">Belum ada jenis ujian. Buat jenis ujian terlebih dahulu.</p>}
            </div>
            <button onClick={() => setShowSelectJenisModal(false)}
              className="w-full py-3 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
          </motion.div>
        </div>
      )}

      {/* Spreadsheet Modal Peserta */}
      {showSpreadsheetPeserta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
          onMouseUp={() => { isDraggingRef.current = false; }}
          onMouseLeave={() => { isDraggingRef.current = false; }}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="bg-white rounded-[24px] w-full max-w-6xl shadow-2xl border border-[#E6E1E5] flex flex-col" style={{maxHeight:'95vh'}}>
            <div className="p-5 border-b border-[#E6E1E5] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Table2 size={20} className="text-[#006A6A]" /> Input Peserta via Spreadsheet</h3>
                <p className="text-xs text-[#49454F] mt-0.5">Jenis: <span className="font-bold text-[#6750A4]">{jenisUjian.find(j=>j.id===spreadsheetJenisId)?.nama}</span> · Klik sel lalu Ctrl+V untuk paste · <span className="text-[#006A6A] font-medium">Klik/drag nomor baris untuk blok · Shift+klik untuk range</span></p>
              </div>
              <button onClick={() => { setShowSpreadsheetPeserta(false); setSelectedRows(new Set()); setAnchorRow(null); }}
                className="p-2 hover:bg-[#F3F0F5] rounded-full flex-shrink-0"><X size={20}/></button>
            </div>
            {selectedRows.size > 0 && (
              <div className="px-5 py-3 bg-[#EDE7FF] border-b border-[#6750A4]/20 flex items-center gap-3 flex-wrap flex-shrink-0">
                <span className="text-xs font-bold text-white bg-[#6750A4] px-2.5 py-1 rounded-full">{selectedRows.size} baris dipilih</span>
                <span className="text-xs text-[#49454F]">Ubah kategori:</span>
                <div className="flex gap-1.5">
                  {['Karyawan','Magang','Visitor','Kontraktor'].map(k => (
                    <button key={k} onClick={() => { setBulkKategori(k); setSpreadsheetPesertaRows(rows => rows.map((r,i) => selectedRows.has(i) ? {...r, kategori:k} : r)); }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${bulkKategori===k?'bg-[#6750A4] text-white border-[#6750A4]':'bg-white text-[#6750A4] border-[#6750A4]/40 hover:border-[#6750A4] hover:bg-[#F3F0F5]'}`}>{k}</button>
                  ))}
                </div>
                <div className="ml-auto flex gap-2">
                  <button onClick={() => { setSpreadsheetPesertaRows(rows => rows.filter((_,i) => !selectedRows.has(i))); setSelectedRows(new Set()); setAnchorRow(null); }}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-[#B3261E] bg-white border border-[#B3261E]/30 hover:bg-[#F9DEDC] flex items-center gap-1"><Trash2 size={12}/> Hapus {selectedRows.size} baris</button>
                  <button onClick={() => { setSelectedRows(new Set()); setAnchorRow(null); setBulkKategori(''); }}
                    className="px-3 py-1 rounded-lg text-xs text-[#49454F] hover:bg-white border border-transparent hover:border-[#E6E1E5]">✕ Batal</button>
                </div>
              </div>
            )}
            <div className="overflow-auto flex-1 p-4">
              <table className="border-collapse text-sm" style={{minWidth:'700px',width:'100%',userSelect:'none'}}>
                <thead>
                  <tr className="bg-[#6750A4] text-white">
                    <th className="px-2 py-2.5 border border-[#4F378B] w-10 text-center cursor-pointer hover:bg-[#4F378B] text-xs"
                      onClick={() => { if (selectedRows.size===spreadsheetPesertaRows.length&&spreadsheetPesertaRows.length>0){setSelectedRows(new Set());setAnchorRow(null);}else{setSelectedRows(new Set(spreadsheetPesertaRows.map((_,i)=>i)));setAnchorRow(0);} setBulkKategori(''); }}>
                      {selectedRows.size===spreadsheetPesertaRows.length&&spreadsheetPesertaRows.length>0?'☑':'#'}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'150px'}}>NIK / No. ID *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'180px'}}>Nama Lengkap *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'160px'}}>Perusahaan *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#4F378B]" style={{minWidth:'120px'}}>Kategori</th>
                    <th className="px-2 py-2.5 border border-[#4F378B] w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetPesertaRows.map((row, ri) => {
                    const isSelected = selectedRows.has(ri);
                    const handleNumMouseDown = (e: React.MouseEvent) => {
                      e.preventDefault(); isDraggingRef.current = true;
                      if (e.shiftKey&&anchorRow!==null){const min=Math.min(anchorRow,ri);const max=Math.max(anchorRow,ri);const next=new Set<number>();for(let i=min;i<=max;i++)next.add(i);setSelectedRows(next);}
                      else if(e.ctrlKey||e.metaKey){const next=new Set(selectedRows);if(next.has(ri))next.delete(ri);else next.add(ri);setSelectedRows(next);setAnchorRow(ri);}
                      else{setSelectedRows(new Set([ri]));setAnchorRow(ri);}
                      setBulkKategori('');
                    };
                    const handleNumMouseEnter=()=>{if(!isDraggingRef.current)return;if(anchorRow!==null){const min=Math.min(anchorRow,ri);const max=Math.max(anchorRow,ri);const next=new Set<number>();for(let i=min;i<=max;i++)next.add(i);setSelectedRows(next);}};
                    const handlePaste=(col:string)=>(e:React.ClipboardEvent<HTMLInputElement>)=>{
                      e.preventDefault();const text=e.clipboardData.getData('text');
                      const lines=text.split('\n').map((l:string)=>l.replace(/\r/g,'')).filter((l:string)=>l.trim());
                      const colOrder=['nik','nama','perusahaan','kategori'];const startColIdx=colOrder.indexOf(col);
                      const newRows=[...spreadsheetPesertaRows];
                      lines.forEach((line:string,li:number)=>{const cells=line.split('\t');const idx=ri+li;const rowData:any=idx<newRows.length?{...newRows[idx]}:{...emptyPesertaRow()};
                        cells.forEach((cell:string,ci:number)=>{const tci=startColIdx+ci;if(tci<colOrder.length)rowData[colOrder[tci]]=cell.trim()||rowData[colOrder[tci]];});
                        if(idx<newRows.length)newRows[idx]=rowData;else newRows.push(rowData);});
                      setSpreadsheetPesertaRows(newRows);};
                    return (
                      <tr key={ri} className={isSelected?'bg-[#EDE7FF]':ri%2===0?'bg-white':'bg-[#FAFAFA]'}>
                        <td className="border border-[#E6E1E5] text-center cursor-pointer p-0" onMouseDown={handleNumMouseDown} onMouseEnter={handleNumMouseEnter}>
                          <div className={`w-full h-full px-2 py-1.5 flex items-center justify-center text-xs font-bold transition-all ${isSelected?'bg-[#6750A4] text-white':'text-[#9CA3AF] hover:bg-[#EADDFF] hover:text-[#6750A4]'}`}>{ri+1}</div>
                        </td>
                        {(['nik','nama','perusahaan'] as const).map(col=>(
                          <td key={col} className="border border-[#E6E1E5] p-0">
                            <input value={(row as any)[col]} placeholder={col==='nik'?'Klik lalu Ctrl+V':''} onChange={e=>{const nr=[...spreadsheetPesertaRows];nr[ri]={...nr[ri],[col]:e.target.value};setSpreadsheetPesertaRows(nr);}} onPaste={handlePaste(col)} style={{userSelect:'text'}} className={`w-full px-2 py-1.5 outline-none text-xs focus:bg-[#EDE7FF] ${isSelected?'bg-[#EDE7FF]':''}`}/>
                          </td>
                        ))}
                        <td className="border border-[#E6E1E5] p-0">
                          <select value={row.kategori} onChange={e=>{const nr=[...spreadsheetPesertaRows];nr[ri]={...nr[ri],kategori:e.target.value};setSpreadsheetPesertaRows(nr);}} className={`w-full px-2 py-1.5 outline-none text-xs bg-transparent ${isSelected?'bg-[#EDE7FF] font-bold text-[#6750A4]':''}`}>
                            {['Karyawan','Magang','Visitor','Kontraktor'].map(k=><option key={k}>{k}</option>)}
                          </select>
                        </td>
                        <td className="border border-[#E6E1E5] text-center p-0">
                          <button onClick={()=>{setSpreadsheetPesertaRows(rows=>rows.filter((_,i)=>i!==ri));const next=new Set(selectedRows);next.delete(ri);setSelectedRows(next);}} className="p-1.5 text-[#CAC4D0] hover:text-[#B3261E] transition-colors"><X size={14}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between gap-3 flex-shrink-0">
              <button onClick={()=>setSpreadsheetPesertaRows(r=>[...r,...Array.from({length:5},emptyPesertaRow)])}
                className="px-4 py-2 rounded-xl border border-[#E6E1E5] text-sm font-medium hover:bg-[#F3F0F5] flex items-center gap-2"><Plus size={16}/> Tambah 5 Baris</button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#49454F]">{spreadsheetPesertaRows.filter(r=>r.nik&&r.nama&&r.perusahaan).length} baris valid</span>
                <button onClick={()=>{setShowSpreadsheetPeserta(false); setSelectedRows(new Set()); setAnchorRow(null); setBulkKategori('');}} className="px-5 py-2.5 rounded-xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
                <button onClick={handleSaveSpreadsheetPeserta} disabled={savingSpreadsheet}
                  className="px-6 py-2.5 rounded-xl bg-[#6750A4] text-white font-bold shadow-md hover:bg-[#4F378B] disabled:opacity-50 flex items-center gap-2"><Save size={16}/>{savingSpreadsheet?'Menyimpan...':'Simpan Semua'}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Spreadsheet Modal Soal */}
      {showSpreadsheetSoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="bg-white rounded-[24px] w-full max-w-7xl shadow-2xl border border-[#E6E1E5] flex flex-col" style={{maxHeight:'95vh'}}>
            <div className="p-5 border-b border-[#E6E1E5] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2"><Table2 size={20} className="text-[#006A6A]" /> Input Soal via Spreadsheet</h3>
                <p className="text-xs text-[#49454F] mt-0.5">Jenis: <span className="font-bold text-[#6750A4]">{jenisUjian.find(j=>j.id===spreadsheetJenisId)?.nama}</span> · <span className="text-[#006A6A] font-medium">Paste dari Excel — kunci jawaban terdeteksi otomatis</span></p>
              </div>
              <button onClick={()=>setShowSpreadsheetSoal(false)} className="p-2 hover:bg-[#F3F0F5] rounded-full flex-shrink-0"><X size={20}/></button>
            </div>
            <div className="px-5 py-3 bg-[#F0FAFA] border-b border-[#006A6A]/10 flex-shrink-0">
              <p className="text-xs font-bold text-[#006A6A] mb-2">📋 Format Excel yang didukung:</p>
              <div className="flex flex-wrap gap-2">
                {[{label:'Format 1',desc:'Pertanyaan | A | B | C | D | A',color:'bg-[#E0F2F1] text-[#006A6A]',hint:'Kolom ke-6 = kunci'},{label:'Format 2',desc:'✓ atau * di depan pilihan benar',color:'bg-[#E8F5E9] text-[#2E7D32]',hint:'Contoh: ✓Jawaban benar'},{label:'Format 3',desc:'(benar) di akhir pilihan benar',color:'bg-[#FFF8E1] text-[#F57F17]',hint:'Contoh: Jawaban benar (benar)'}].map(f=>(
                  <div key={f.label} className={`px-3 py-1.5 rounded-lg ${f.color}`}>
                    <span className="text-[10px] font-bold">{f.label}:</span><span className="text-[10px]"> {f.desc}</span><span className="text-[10px] opacity-60"> — {f.hint}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <table className="border-collapse text-sm" style={{minWidth:'1000px',width:'100%'}}>
                <thead>
                  <tr className="bg-[#006A6A] text-white">
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40] w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'260px'}}>Pertanyaan * <span className="opacity-60 font-normal">← Paste di sini</span></th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan A *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan B *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan C *</th>
                    <th className="px-3 py-2.5 text-left text-xs border border-[#004D40]" style={{minWidth:'130px'}}>Pilihan D *</th>
                    <th className="px-3 py-2.5 text-center text-xs border border-[#004D40] w-24">Kunci Jawaban</th>
                    <th className="px-2 py-2.5 border border-[#004D40] w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetSoalRows.map((row,ri)=>{
                    const bgClass=ri%2===0?'bg-white':'bg-[#F0FAFA]';
                    const detectAndParse=(cells:string[])=>{
                      const markers=['✓','✔','*','(benar)','(correct)','(jawaban)','[benar]','[correct]'];
                      let answer='';
                      const cleaned=cells.slice(0,4).map((cell,idx)=>{let c=(cell||'').trim();for(const m of markers){if(c.toLowerCase().startsWith(m.toLowerCase())){if(!answer)answer=String.fromCharCode(65+idx);c=c.substring(m.length).trim();}else if(c.toLowerCase().endsWith(m.toLowerCase())){if(!answer)answer=String.fromCharCode(65+idx);c=c.substring(0,c.length-m.length).trim();}}return c;});
                      return{cleaned,answer};};
                    const handlePaste=(col:string)=>(e:React.ClipboardEvent<HTMLInputElement>)=>{
                      e.preventDefault();const raw=e.clipboardData.getData('text');
                      const lines=raw.split('\n').map((l:string)=>l.replace(/\r/g,'')).filter((l:string)=>l.trim());
                      const colOrder=['pertanyaan','pilihan_a','pilihan_b','pilihan_c','pilihan_d','jawaban_benar'];
                      const startColIdx=colOrder.indexOf(col);const newRows=[...spreadsheetSoalRows];
                      lines.forEach((line:string,li:number)=>{
                        const cells=line.split('\t');const idx=ri+li;
                        const rowData:any=idx<newRows.length?{...newRows[idx]}:{...emptySoalRow()};
                        if(col==='pertanyaan'&&cells.length>=5){
                          const lastCell=(cells[5]||cells[cells.length-1]||'').trim().toUpperCase();
                          const isExplicitAnswer=/^[ABCD]$/.test(lastCell)&&cells.length>=6;
                          const pilihanCells=cells.slice(1,5);const{cleaned,answer}=detectAndParse(pilihanCells);
                          rowData.pertanyaan=cells[0]?.trim()||'';rowData.pilihan_a=cleaned[0]||'';rowData.pilihan_b=cleaned[1]||'';rowData.pilihan_c=cleaned[2]||'';rowData.pilihan_d=cleaned[3]||'';
                          if(isExplicitAnswer)rowData.jawaban_benar=lastCell;else if(answer)rowData.jawaban_benar=answer;
                        }else if(col==='pertanyaan'&&cells.length===5){
                          const col5=(cells[4]||'').trim().toUpperCase();
                          if(/^[ABCD]$/.test(col5)){const{cleaned}=detectAndParse(cells.slice(1,4));rowData.pertanyaan=cells[0]?.trim()||'';rowData.pilihan_a=cleaned[0]||'';rowData.pilihan_b=cleaned[1]||'';rowData.pilihan_c=cleaned[2]||'';rowData.jawaban_benar=col5;}
                          else{const{cleaned,answer}=detectAndParse(cells.slice(1,5));rowData.pertanyaan=cells[0]?.trim()||'';rowData.pilihan_a=cleaned[0]||'';rowData.pilihan_b=cleaned[1]||'';rowData.pilihan_c=cleaned[2]||'';rowData.pilihan_d=cleaned[3]||'';if(answer)rowData.jawaban_benar=answer;}
                        }else{cells.forEach((cell:string,ci:number)=>{const tci=startColIdx+ci;if(tci<colOrder.length){const tc=colOrder[tci];rowData[tc]=tc==='jawaban_benar'?cell.trim().toUpperCase()||rowData[tc]:cell.trim()||rowData[tc];}});}
                        if(idx<newRows.length)newRows[idx]=rowData;else newRows.push(rowData);});
                      setSpreadsheetSoalRows(newRows);};
                    return(
                      <tr key={ri} className={bgClass}>
                        <td className="px-3 py-1 border border-[#E6E1E5] text-[#9CA3AF] text-center text-xs">{ri+1}</td>
                        {(['pertanyaan','pilihan_a','pilihan_b','pilihan_c','pilihan_d'] as const).map(col=>(
                          <td key={col} className="border border-[#E6E1E5] p-0">
                            <input value={(row as any)[col]} placeholder={col==='pertanyaan'?'Paste dari Excel di sini':''} onChange={e=>{const nr=[...spreadsheetSoalRows];nr[ri]={...nr[ri],[col]:e.target.value};setSpreadsheetSoalRows(nr);}} onPaste={handlePaste(col)} className="w-full px-2 py-1.5 outline-none focus:bg-[#E0F2F1] text-xs"/>
                          </td>
                        ))}
                        <td className="border border-[#E6E1E5] p-0">
                          <div className="flex items-center justify-center gap-0.5 px-1 py-1">
                            {['A','B','C','D'].map(v=>(
                              <button key={v} onClick={()=>{const nr=[...spreadsheetSoalRows];nr[ri]={...nr[ri],jawaban_benar:v};setSpreadsheetSoalRows(nr);}}
                                className={`w-7 h-7 rounded-lg text-[11px] font-black transition-all ${row.jawaban_benar===v?'bg-[#006A6A] text-white shadow-sm scale-110':'bg-[#F3F0F5] text-[#9CA3AF] hover:bg-[#E0F2F1] hover:text-[#006A6A]'}`}>{v}</button>
                            ))}
                          </div>
                        </td>
                        <td className="border border-[#E6E1E5] text-center p-0">
                          <button onClick={()=>setSpreadsheetSoalRows(rows=>rows.filter((_,i)=>i!==ri))} className="p-1.5 text-[#CAC4D0] hover:text-[#B3261E] transition-colors"><X size={14}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#E6E1E5] flex items-center justify-between gap-3 flex-shrink-0">
              <button onClick={()=>setSpreadsheetSoalRows(r=>[...r,...Array.from({length:5},emptySoalRow)])}
                className="px-4 py-2 rounded-xl border border-[#E6E1E5] text-sm font-medium hover:bg-[#F3F0F5] flex items-center gap-2"><Plus size={16}/> Tambah 5 Baris</button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#49454F]">{spreadsheetSoalRows.filter(r=>r.pertanyaan&&r.pilihan_a&&r.pilihan_b&&r.pilihan_c&&r.pilihan_d).length} baris valid</span>
                <button onClick={()=>setShowSpreadsheetSoal(false)} className="px-5 py-2.5 rounded-xl border border-[#E6E1E5] font-bold text-[#49454F] hover:bg-[#F3F0F5]">Batal</button>
                <button onClick={handleSaveSpreadsheetSoal} disabled={savingSpreadsheet}
                  className="px-6 py-2.5 rounded-xl bg-[#006A6A] text-white font-bold shadow-md hover:bg-[#004D40] disabled:opacity-50 flex items-center gap-2"><Save size={16}/>{savingSpreadsheet?'Menyimpan...':'Simpan Semua'}</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
