import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  CheckCircle2, 
  User, 
  FileText, 
  ClipboardCheck, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { PesertaMaster } from '../types';

export const ParticipantFlow: React.FC = () => {
  const [step, setStep] = useState(1);
  const [participant, setParticipant] = useState<PesertaMaster | null>(null);
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);
  const [profileData, setProfileData] = useState({
    status: 'Belum Menikah',
    agama: '',
    tanggalLahir: '',
    pendidikan: 'SMA sederajat',
    kontakDarurat: ''
  });
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentJenis, setCurrentJenis] = useState<any>(null);
  const [examResult, setExamResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [screenshotViolations, setScreenshotViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationType, setViolationType] = useState<'tab' | 'screenshot' | 'copy'>('tab');
  const [isObscured, setIsObscured] = useState(false);
  const [copyViolations, setCopyViolations] = useState(0);
  const [totalViolations, setTotalViolations] = useState(0);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyCountdown, setPenaltyCountdown] = useState(0);
  const [penaltyTargetTime, setPenaltyTargetTime] = useState<number>(0);
  const [sessionInactive, setSessionInactive] = useState(false);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [kickedByOtherDevice, setKickedByOtherDevice] = useState(false);
  const [umumFormData, setUmumFormData] = useState({ nama: '', departemen: '' });

  const navigate = useNavigate();

  // Fungsi pencatat pelanggaran dengan penalti bertingkat
  const recordViolation = React.useCallback((type: 'tab' | 'screenshot' | 'copy') => {
    if (type === 'tab') setTabViolations(v => v + 1);
    else if (type === 'screenshot') setScreenshotViolations(v => v + 1);
    else setCopyViolations(v => v + 1);

    setTotalViolations(prev => {
      const next = prev + 1;
      setViolationType(type);
      
      let sec = 0;
      if (next === 4) sec = 120;
      else if (next === 5) sec = 240;
      else if (next >= 6) sec = 600;
        
      if (sec > 0) {
        setPenaltyTargetTime(Date.now() + (sec * 1000));
        setPenaltyCountdown(sec);
        setShowPenaltyModal(true);
      } else {
        setShowViolationWarning(true);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('ehs_participant');
    if (!stored) {
      navigate('/');
      return;
    }
    const p = JSON.parse(stored);
    setParticipant(p);

    // Update last_active segera saat halaman dibuka agar sesi dianggap aktif
    // Skip untuk Ujian Umum (nik null, tidak ada sesi)
    const localToken = localStorage.getItem('ehs_session_token');
    if (localToken && p.nik && p.tipe_ujian !== 'umum') {
      supabase
        .from('peserta_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('nik', p.nik)
        .eq('token', localToken)
        .then(() => {});
    }

    // Fetch jenis ujian lebih awal agar commitment_content tampil di step 2
    const examId = localStorage.getItem('preferred_exam') || p.allowed_jenis_id;
    if (examId) {
      supabase
        .from('jenis_ujian')
        .select('*')
        .eq('id', examId)
        .single()
        .then(({ data }) => {
          if (data) {
            setCurrentJenis(data);
            
            // Hydrate state from localStorage
            const savedKey = `ehs_exam_state_${p.nik || 'umum'}`;
            const savedState = localStorage.getItem(savedKey);
            
            if (savedState) {
              try {
                const parsed = JSON.parse(savedState);
                if (parsed.activeExamId === examId || !parsed.activeExamId) {
                  setQuestions(parsed.questions || []);
                  setAnswers(parsed.answers || {});
                  setTimeLeft(parsed.timeLeft !== undefined ? parsed.timeLeft : Math.abs(data.timer_minutes) * 60);
                  setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
                  setTabViolations(parsed.tabViolations || 0);
                  setScreenshotViolations(parsed.screenshotViolations || 0);
                  setCopyViolations(parsed.copyViolations || 0);
                  setTotalViolations(parsed.totalViolations || 0);
                  setExamStarted(parsed.examStarted || false);
                  if (parsed.step) setStep(parsed.step);
                  if (parsed.activeExamId) setActiveExamId(parsed.activeExamId);

                  // Jika dipulihkan di Step 4 tapi data hasil kosong, ambil dari DB
                  if (parsed.step === 4 && !examResult) {
                    setLoading(true);
                    supabase
                      .from('hasil_ujian')
                      .select('*')
                      .eq('nik', p.nik)
                      .order('waktu_selesai', { ascending: false })
                      .limit(1)
                      .single()
                      .then(({ data: lastResult }) => {
                        if (lastResult) setExamResult(lastResult);
                      })
                      .catch(err => console.error("Error restoring result:", err))
                      .finally(() => setLoading(false));
                  }
                  
                  if (parsed.penaltyTargetTime && parsed.penaltyTargetTime > Date.now()) {
                    const rem = Math.ceil((parsed.penaltyTargetTime - Date.now()) / 1000);
                    setPenaltyCountdown(rem);
                    setPenaltyTargetTime(parsed.penaltyTargetTime);
                    setShowPenaltyModal(true);
                  } else {
                    setPenaltyTargetTime(0);
                    setPenaltyCountdown(0);
                    setShowPenaltyModal(false);
                  }
                  return; // State loaded successfully
                }
              } catch (err) {
                console.error("Failed to parse saved progress state", err);
              }
            }
            
            setTimeLeft(Math.abs(data.timer_minutes) * 60);
          }
        });
    }
  }, [navigate]);

  // Timer effect
  useEffect(() => {
    if (examStarted && timeLeft > 0 && !examResult && !showPenaltyModal) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [examStarted, timeLeft, examResult, showPenaltyModal]);

  // Penalty countdown effect
  useEffect(() => {
    if (penaltyCountdown > 0) {
      const t = setInterval(() => setPenaltyCountdown(prev => {
        if (prev <= 1) { clearInterval(t); setShowPenaltyModal(false); return 0; }
        return prev - 1;
      }), 1000);
      return () => clearInterval(t);
    }
  }, [penaltyCountdown]);

  // Sync progress to LocalStorage
  useEffect(() => {
    if (examStarted && participant) {
      const stateToSave = {
        activeExamId,
        examStarted,
        step,
        questions,
        answers,
        timeLeft,
        currentQuestionIndex,
        tabViolations,
        screenshotViolations,
        copyViolations,
        totalViolations,
        penaltyTargetTime
      };
      localStorage.setItem(`ehs_exam_state_${participant.nik || 'umum'}`, JSON.stringify(stateToSave));
    }
  }, [examStarted, step, questions, answers, timeLeft, currentQuestionIndex, tabViolations, screenshotViolations, copyViolations, totalViolations, penaltyTargetTime, participant, activeExamId]);

  // Cek sesi ujian masih aktif setiap 30 detik
  useEffect(() => {
    if (!examStarted || examResult || !currentJenis) return;
    // Skip session check untuk Ujian Umum
    if (participant?.tipe_ujian === 'umum') return;
    const localToken = localStorage.getItem('ehs_session_token');

    const checkSession = async () => {
      try {
        // Cek is_active ujian
        const { data: jenisRes } = await supabase
          .from('jenis_ujian')
          .select('is_active')
          .eq('id', currentJenis.id)
          .single();

        if (jenisRes && !jenisRes.is_active) {
          setSessionInactive(true);
          return;
        }

        // Update last_active agar device lain tidak bisa login
        if (localToken && participant?.nik) {
          await supabase
            .from('peserta_sessions')
            .update({ last_active: new Date().toISOString() })
            .eq('nik', participant.nik)
            .eq('token', localToken);
        }
      } catch (err) {
        // Abaikan error network sementara, jangan crash polling
        console.error('Session check error:', err);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [examStarted, examResult, currentJenis, participant]);

  // Anti-Cheat Effects
  useEffect(() => {
    if (examStarted && !examResult) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          setIsObscured(true);
          recordViolation('tab');
        } else {
          setIsObscured(false);
        }
      };

      const handleBlur = () => {
        setTimeout(() => {
          if (!document.hasFocus() && !examResult) {
            setIsObscured(true);
            recordViolation('tab');
            setTimeout(() => setIsObscured(false), 1500);
          }
        }, 100);
      };

      const triggerObscure = () => {
        setIsObscured(true);
        setTimeout(() => setIsObscured(false), 1000);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        // PrintScreen
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          e.preventDefault();
          triggerObscure();
          recordViolation('screenshot');
          return false;
        }
        
        // Common screenshot/dev shortcuts
        if (
          (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
          (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '3' || e.key === '5')) || // Mac shortcuts
          (e.ctrlKey && (e.key === 'u' || e.key === 'p' || e.key === 's'))
        ) {
          e.preventDefault();
          triggerObscure();
          recordViolation('screenshot');
          return false;
        }
      };

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        recordViolation('copy');
      };

      const handleCut = (e: ClipboardEvent) => {
        e.preventDefault();
        recordViolation('copy');
      };

      const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('copy', handleCopy);
      document.addEventListener('cut', handleCut);
      document.addEventListener('paste', handlePaste);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('cut', handleCut);
        document.removeEventListener('paste', handlePaste);
      };
    }
  }, [examStarted, examResult]);

  if (!participant) return null;

  const isUmum = (participant as any)?.tipe_ujian === 'umum';

  const handleLogout = () => {
    const token = localStorage.getItem('ehs_session_token');
    if (token && participant?.nik) {
      supabase.from('peserta_sessions').delete().eq('nik', participant.nik).then(() => {});
    }
    localStorage.removeItem(`ehs_exam_state_${participant?.nik || 'umum'}`);
    localStorage.removeItem('ehs_participant');
    localStorage.removeItem('ehs_session_token');
    localStorage.removeItem('preferred_exam');
    navigate('/');
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const nextStep = () => { setStep(prev => prev + 1); scrollToTop(); };
  const prevStep = () => { setStep(prev => prev - 1); scrollToTop(); };

  const startExam = async () => {
    const preferredExamId = localStorage.getItem('preferred_exam');
    const examId = preferredExamId || participant?.allowed_jenis_id;

    if (!examId) {
      alert('Anda belum mendapatkan izin untuk mengikuti ujian apapun. Silakan hubungi Admin.');
      return;
    }

    setLoading(true);
    try {
      // Fetch specific jenis_ujian to get timer and limits
      const { data: jenisData } = await supabase
        .from('jenis_ujian')
        .select('*')
        .eq('id', examId)
        .single();
      
      if (jenisData) {
        setCurrentJenis(jenisData);
        setActiveExamId(examId);
        const actualTimer = Math.abs(jenisData.timer_minutes);
        setTimeLeft(actualTimer * 60);
      }

      const { data } = await supabase
        .from('soal')
        .select('*')
        .eq('jenis_ujian_id', examId);

      if (data && data.length > 0) {
        // Shuffle questions and take the specified count
        const displayCount = jenisData?.soal_display_count || 20;
        const shuffledQuestions = [...data].sort(() => Math.random() - 0.5).slice(0, displayCount);
        
        // Shuffle options for each question
        const questionsWithShuffledOptions = shuffledQuestions.map(q => {
          // Get the original correct text
          const correctText = q[`pilihan_${q.jawaban_benar.toLowerCase()}` as keyof typeof q] as string;
          
          // Create array of original options
          const originalOptions = [
            { id: 'A', text: q.pilihan_a },
            { id: 'B', text: q.pilihan_b },
            { id: 'C', text: q.pilihan_c },
            { id: 'D', text: q.pilihan_d }
          ];
          
          // Shuffle the options
          const shuffled = [...originalOptions].sort(() => Math.random() - 0.5);
          
          // Map to the new labels A, B, C, D
          const options = shuffled.map((opt, index) => ({
            label: String.fromCharCode(65 + index), // A, B, C, D
            text: opt.text
          }));
          
          // Find the new label for the correct answer
          const newCorrectLabel = options.find(opt => opt.text === correctText)?.label || 'A';
          
          return { 
            ...q, 
            shuffledOptions: options,
            jawaban_benar: newCorrectLabel // Update the correct answer label to match the shuffled position
          };
        });

        setQuestions(questionsWithShuffledOptions);
      } else {
        alert('Soal untuk jenis ujian ini belum tersedia.');
        return;
      }
      setExamStarted(true);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memulai ujian.');
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async () => {
    // Validasi semua soal sudah dijawab
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(`Masih ada ${unanswered.length} soal yang belum dijawab. Yakin ingin mengirimkan jawaban sekarang?`);
      if (!confirm) return;
    }

    // Cek sesi masih aktif sebelum submit
    if (currentJenis) {
      const { data: jenisCheck } = await supabase
        .from('jenis_ujian')
        .select('is_active')
        .eq('id', currentJenis.id)
        .single();
      if (jenisCheck && !jenisCheck.is_active) {
        setSessionInactive(true);
        return;
      }
    }

    setLoading(true);
    let correctCount = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.jawaban_benar) correctCount++;
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passingScore = currentJenis?.passing_score || 70;
    const isLulus = score >= passingScore;

    const isUmumSubmit = (participant as any)?.tipe_ujian === 'umum';
    const result = {
      nik: participant?.nik,
      nama: isUmumSubmit ? umumFormData.nama : participant?.nama,
      perusahaan: isUmumSubmit ? (umumFormData.departemen || '-') : participant?.perusahaan,
      nilai: score,
      status_lulus: isLulus,
      profil_data: {
        ...profileData,
        tab_violations: tabViolations,
        screenshot_violations: screenshotViolations,
        copy_violations: copyViolations,
        is_remedial: participant?.is_remedial || false,
        ...(isUmumSubmit ? {
          departemen: umumFormData.departemen,
          tipe_ujian: 'umum'
        } : {})
      },
      jenis_ujian_id: activeExamId || currentJenis?.id || participant?.allowed_jenis_id,
      waktu_selesai: new Date().toISOString()
    };

    try {
      const { error: insertError } = await supabase.from('hasil_ujian').insert([result]);
      if (insertError) {
        console.error('Gagal simpan hasil:', insertError.message, insertError.details);
        // Tetap lanjutkan ke halaman hasil meski gagal simpan
      }

      // Increment stats — jangan blokir jika gagal
      try {
        await supabase.rpc('increment_stat', { stat_id: 'total_ujian_selesai' });
        if (isLulus) {
          await supabase.rpc('increment_stat', { stat_id: 'total_lulus' });
        } else {
          await supabase.rpc('increment_stat', { stat_id: 'total_gagal' });
        }
      } catch (_) { /* increment_stat opsional, abaikan jika gagal */ }

      setExamResult(result);
      setExamStarted(false); // Matikan agar tidak memicu sync localStorage lagi
      localStorage.removeItem(`ehs_exam_state_${participant?.nik || 'umum'}`);
      localStorage.removeItem('preferred_exam');
      setStep(4);
      scrollToTop();
    } catch (err) {
      console.error(err);
      setExamResult(result);
      setExamStarted(false);
      localStorage.removeItem(`ehs_exam_state_${participant?.nik || 'umum'}`);
      setStep(4);
      scrollToTop();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRemedial = async (specificExamId?: string) => {
    if (!participant) return;
    const examId = specificExamId || currentJenis?.id || (questions.length > 0 ? questions[0].jenis_ujian_id : null);
    
    if (!examId) {
      alert('Data ujian tidak ditemukan.');
      return;
    }

    setLoading(true);
    try {
      // Check if there's already a pending request
      const { data: existing } = await supabase
        .from('remedial_requests')
        .select('*')
        .eq('nik', participant.nik)
        .eq('jenis_ujian_id', examId)
        .eq('status', 'pending');

      if (existing && existing.length > 0) {
        alert('Permintaan remedial Anda sedang diproses oleh Admin.');
        return;
      }

      const isUmumReq = (participant as any).tipe_ujian === 'umum';
      const reqNama = isUmumReq ? umumFormData.nama : participant.nama;
      const reqPerusahaan = isUmumReq ? (umumFormData.departemen || '-') : participant.perusahaan;

      const { error } = await supabase.from('remedial_requests').insert([{
        nik: participant.nik,
        nama: reqNama,
        perusahaan: reqPerusahaan,
        jenis_ujian_id: examId,
        status: 'pending'
      }]);

      if (error) throw error;
      alert('Permintaan remedial telah dikirim ke Admin.');
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim permintaan remedial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Induksi Keselamatan Kerja">
      {/* CSS anti-screenshot multi-layer */}
      {examStarted && !examResult && (
        <style>{`
          @media print {
            body > * { display: none !important; }
            body::before {
              content: '' !important;
              display: block !important;
              position: fixed !important;
              inset: 0 !important;
              background: #000 !important;
              z-index: 999999 !important;
            }
          }
          .exam-protected {
            -webkit-user-select: none !important;
            user-select: none !important;
          }
          @keyframes secureFlicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.99; }
          }
          .exam-protected * {
            animation: secureFlicker 0.1s infinite;
          }
        `}</style>
      )}

      <div className={`max-w-4xl mx-auto px-2 sm:px-4 ${examStarted && !examResult ? 'select-none' : ''}`}>
        {/* Anti-Screenshot Overlay - muncul saat tab hidden atau screenshot mobile */}
        <AnimatePresence>
          {isObscured && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center gap-6 p-8"
            >
              <div className="w-20 h-20 bg-[#B3261E]/20 rounded-full flex items-center justify-center">
                <AlertTriangle size={40} className="text-[#F87171]" />
              </div>
              <h1 className="text-white text-2xl sm:text-4xl font-black text-center">SCREENSHOT DILARANG!</h1>
              <p className="text-white/60 text-sm sm:text-base text-center max-w-sm">
                Pengambilan tangkapan layar tidak diizinkan selama ujian berlangsung. Tindakan ini telah dicatat.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Penalty Modal - tidak bisa ditutup sampai countdown selesai */}
        <AnimatePresence>
          {showPenaltyModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-[#B3261E]"
              >
                <div className="w-20 h-20 bg-[#F9DEDC] text-[#B3261E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-black text-[#B3261E] mb-2">PENALTI KECURANGAN!</h3>
                <p className="text-[#49454F] mb-2">
                  Anda telah melakukan <span className="font-black text-[#B3261E]">{totalViolations} kali</span> pelanggaran.
                  Anda mendapat penalti dan harus menunggu sebelum melanjutkan ujian.
                </p>
                <div className="my-6 p-4 bg-[#F9DEDC] rounded-2xl">
                  <p className="text-xs text-[#B3261E] font-bold uppercase tracking-wider mb-1">Waktu Tunggu</p>
                  <p className="text-5xl font-black text-[#B3261E] font-mono">
                    {String(Math.floor(penaltyCountdown / 60)).padStart(2,'0')}:{String(penaltyCountdown % 60).padStart(2,'0')}
                  </p>
                </div>
                <p className="text-xs text-[#49454F]">
                  {totalViolations === 4 ? 'Penalti 1: 2 menit tunggu' :
                   totalViolations === 5 ? 'Penalti 2: 4 menit tunggu' :
                   'Penalti 3+: 10 menit tunggu'}
                  {' '}— Tombol aktif setelah countdown selesai.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session Inactive Modal */}
        <AnimatePresence>
          {sessionInactive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-[#F57F17]"
              >
                <div className="w-20 h-20 bg-[#FFF8E1] text-[#F57F17] rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-black text-[#F57F17] mb-3">Sesi Ujian Ditutup</h3>
                <p className="text-[#49454F] mb-6">
                  Admin telah menonaktifkan sesi ujian ini. Jawaban Anda tidak dapat dikirimkan. Silakan hubungi Admin untuk informasi lebih lanjut.
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full py-4 bg-[#F57F17] text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-[#E65100] transition-all"
                >
                  Keluar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {kickedByOtherDevice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-[#B3261E]"
              >
                <div className="w-20 h-20 bg-[#F9DEDC] text-[#B3261E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-black text-[#B3261E] mb-3">Sesi Diakhiri</h3>
                <p className="text-[#49454F] mb-6">
                  Akun Anda telah login di perangkat lain. Untuk keamanan, sesi ini telah diakhiri secara otomatis.
                  <br /><br />
                  Jika bukan Anda yang melakukan ini, segera hubungi Admin.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-4 bg-[#B3261E] text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-[#8C1D18] transition-all"
                >
                  Kembali ke Halaman Utama
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showViolationWarning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-[#B3261E]"
              >
                <div className="w-20 h-20 bg-[#F9DEDC] text-[#B3261E] rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-2xl font-black text-[#B3261E] mb-4">PERINGATAN PELANGGARAN!</h3>
                <p className="text-[#49454F] mb-4 text-lg">
                  {violationType === 'tab' 
                    ? 'Anda terdeteksi berpindah tab atau meninggalkan layar ujian.' 
                    : violationType === 'copy'
                    ? 'Dilarang menyalin (copy) teks soal!'
                    : 'Dilarang melakukan screenshot atau menyalin konten ujian!'}
                </p>
                <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-3 mb-6">
                  <p className="text-sm text-[#F57F17] font-bold">
                    Pelanggaran ke-{totalViolations} dari 3 sebelum penalti.
                    {totalViolations < 3 
                      ? ` Sisa ${3 - totalViolations} pelanggaran lagi sebelum Anda mendapat penalti tunggu.`
                      : ' Pelanggaran berikutnya akan dikenakan PENALTI waktu tunggu!'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowViolationWarning(false)}
                  className="w-full py-4 bg-[#B3261E] text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-[#8C1D18] transition-all"
                >
                  SAYA MENGERTI & KEMBALI
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        {isUmum ? (
          /* Ujian Umum: 3 langkah (Data → Ujian → Hasil) */
          <div className="mb-6 sm:mb-12 relative px-2 sm:px-4">
            <div className="absolute top-4 sm:top-5 left-6 sm:left-9 right-6 sm:right-9 h-[2px] bg-[#E6E1E5]" />
            <div
              className="absolute top-4 sm:top-5 left-6 sm:left-9 h-[2px] bg-[#E65100] transition-all duration-500"
              style={{ width: step === 1 ? '0%' : step === 3 ? '50%' : '100%' }}
            />
            <div className="flex items-center justify-between relative z-10">
              {[
                { s: 1, label: 'Data' },
                { s: 3, label: 'Ujian' },
                { s: 4, label: 'Hasil' }
              ].map(({ s, label }, idx) => (
                <div key={s} className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500 text-sm sm:text-base ${
                    step >= s ? 'bg-[#E65100] text-white' : 'bg-[#E6E1E5] text-[#49454F]'
                  }`}>
                    {step > s ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] mt-1 sm:mt-2 font-medium uppercase tracking-wider ${
                    step >= s ? 'text-[#E65100]' : 'text-[#49454F]'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Ujian Khusus: 4 langkah (Verifikasi → Data → Ujian → Hasil) */
          <div className="mb-6 sm:mb-12 relative px-2 sm:px-4">
            <div className="absolute top-4 sm:top-5 left-6 sm:left-9 right-6 sm:right-9 h-[2px] bg-[#E6E1E5]" />
            <div
              className="absolute top-4 sm:top-5 left-6 sm:left-9 h-[2px] bg-[#6750A4] transition-all duration-500"
              style={{
                width: step === 1 ? '0%' :
                       step === 2 ? '33.33%' :
                       step === 3 ? '66.66%' : '100%'
              }}
            />
            <div className="flex items-center justify-between relative z-10">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex flex-col items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-500 text-sm sm:text-base ${
                    step >= s ? 'bg-[#6750A4] text-white' : 'bg-[#E6E1E5] text-[#49454F]'
                  }`}>
                    {step > s ? <CheckCircle2 size={16} /> : s}
                  </div>
                  <span className={`text-[9px] sm:text-[10px] mt-1 sm:mt-2 font-medium uppercase tracking-wider ${
                    step >= s ? 'text-[#6750A4]' : 'text-[#49454F]'
                  }`}>
                    {['Verifikasi', 'Data', 'Ujian', 'Hasil'][s-1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Verification (Khusus) / Data Form (Umum) */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-[#E6E1E5]"
            >
              {isUmum ? (
                /* Ujian Umum: Form sederhana (Nama + Departemen) */
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-3">
                    <User className="text-[#E65100]" /> Data Peserta
                  </h2>
                  <p className="text-[#49454F] text-sm mb-6">Isi data diri Anda untuk memulai ujian.</p>

                  {currentJenis && (
                    <div className="bg-[#E65100] rounded-2xl p-4 mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-xs uppercase tracking-wider font-semibold">🌐 Ujian Umum</p>
                        <p className="text-white font-black text-base sm:text-lg leading-tight truncate">{currentJenis.nama}</p>
                        <p className="text-white/70 text-xs mt-0.5">{Math.abs(currentJenis.timer_minutes)} menit · Skor lulus: {currentJenis.passing_score || 70}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); startExam(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#49454F] mb-2">
                        Nama Lengkap <span className="text-[#B3261E]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={umumFormData.nama}
                        onChange={e => setUmumFormData({ ...umumFormData, nama: e.target.value })}
                        placeholder="Masukkan nama lengkap Anda"
                        className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#E65100] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#49454F] mb-2">
                        Departemen / Instansi
                      </label>
                      <input
                        type="text"
                        value={umumFormData.departemen}
                        onChange={e => setUmumFormData({ ...umumFormData, departemen: e.target.value })}
                        placeholder="Contoh: Departemen Produksi / PT. ABC"
                        className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#E65100] outline-none"
                      />
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button type="button" onClick={handleLogout} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#B3261E] flex items-center justify-center gap-2">
                        <LogOut size={18} /> Keluar
                      </button>
                      <button
                        type="submit"
                        disabled={!umumFormData.nama.trim() || loading}
                        className="flex-[2] py-4 rounded-2xl bg-[#E65100] text-white font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                      >
                        {loading ? 'Menyiapkan...' : <><span>Mulai Ujian</span> <ChevronRight size={18} /></>}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* Ujian Khusus: Konfirmasi identitas dari peserta_master */
                <>
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-3">
                    <User className="text-[#6750A4]" /> Konfirmasi Identitas
                  </h2>

                  {currentJenis && (
                    <div className="bg-[#6750A4] rounded-2xl p-4 mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-xs uppercase tracking-wider font-semibold">Jenis Ujian</p>
                        <p className="text-white font-black text-base sm:text-lg leading-tight truncate">{currentJenis.nama}</p>
                        <p className="text-white/70 text-xs mt-0.5">{Math.abs(currentJenis.timer_minutes)} menit · Skor lulus: {currentJenis.passing_score || 70}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#F3F0F5] p-4 sm:p-6 rounded-2xl space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    <div className="flex justify-between border-b border-[#E6E1E5] pb-3">
                      <span className="text-[#49454F]">Nama Lengkap</span>
                      <span className="font-bold text-sm sm:text-lg text-right">{participant.nama}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#E6E1E5] pb-3">
                      <span className="text-[#49454F]">NIK KTP / No. ID Karyawan</span>
                      <span className="font-mono font-bold text-sm sm:text-lg">{participant.nik}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#49454F]">Perusahaan</span>
                      <span className="font-bold text-sm sm:text-lg text-right">{participant.perusahaan}</span>
                    </div>
                  </div>
                  <p className="text-[#49454F] mb-8 italic">
                    *Pastikan data di atas sudah sesuai dengan KTP Anda sebelum melanjutkan.
                  </p>
                  <div className="flex gap-4">
                    <button onClick={handleLogout} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#B3261E] flex items-center justify-center gap-2">
                      <LogOut size={18} /> Keluar
                    </button>
                    <button onClick={nextStep} className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold flex items-center justify-center gap-2 shadow-md">
                      Data Sudah Benar <ChevronRight size={18} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Step 2: Profile & Commitment */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm border border-[#E6E1E5]"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-3">
                <FileText className="text-[#6750A4]" /> Data Diri & Komitmen
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Status Perkawinan</label>
                  <select 
                    value={profileData.status}
                    onChange={e => setProfileData({...profileData, status: e.target.value})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  >
                    <option>Belum Menikah</option>
                    <option>Menikah</option>
                    <option>Cerai Hidup</option>
                    <option>Cerai Mati</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Agama</label>
                  <input 
                    type="text" 
                    value={profileData.agama}
                    onChange={e => setProfileData({...profileData, agama: e.target.value})}
                    placeholder="Contoh: Islam"
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    value={profileData.tanggalLahir}
                    onChange={e => setProfileData({...profileData, tanggalLahir: e.target.value})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Pendidikan Terakhir</label>
                  <select 
                    value={profileData.pendidikan}
                    onChange={e => setProfileData({...profileData, pendidikan: e.target.value})}
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  >
                    <option>SD sederajat</option>
                    <option>SMP sederajat</option>
                    <option>SMA sederajat</option>
                    <option>D3</option>
                    <option>S1</option>
                    <option>S2</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#49454F] mb-2">Kontak Darurat (Nama - No HP)</label>
                  <input 
                    type="text" 
                    value={profileData.kontakDarurat}
                    onChange={e => setProfileData({...profileData, kontakDarurat: e.target.value})}
                    placeholder="Contoh: Ibu Budi - 08123456789"
                    className="w-full p-4 bg-[#F3F0F5] border-none rounded-2xl focus:ring-2 focus:ring-[#6750A4]"
                  />
                </div>
              </div>

              <div className="w-full h-px bg-[#E6E1E5] mb-8" />

              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ClipboardCheck className="text-[#6750A4]" size={20} /> {currentJenis?.commitment_title || 'Pakta Integritas Keselamatan'}
              </h3>
              <div className="prose prose-sm max-w-none bg-[#FDFCFB] p-6 rounded-2xl border border-[#E6E1E5] mb-8">
                <div className="whitespace-pre-wrap text-[#49454F]">
                  {currentJenis?.commitment_content
                    ? currentJenis.commitment_content
                    : (
                      <>
                        <p>Saya yang bertanda tangan di bawah ini menyatakan berkomitmen untuk:</p>
                        <ul className="list-disc pl-5 space-y-2">
                          <li>Mematuhi seluruh peraturan K3LH yang berlaku di area kerja.</li>
                          <li>Menggunakan Alat Pelindung Diri (APD) yang dipersyaratkan secara benar.</li>
                          <li>Melaporkan setiap kondisi tidak aman (Unsafe Condition) dan tindakan tidak aman (Unsafe Action).</li>
                          <li>Menjaga kebersihan dan kerapihan area kerja (5S/5R).</li>
                          <li>Tidak melakukan tindakan yang membahayakan diri sendiri maupun orang lain.</li>
                        </ul>
                      </>
                    )
                  }
                </div>
              </div>

              <label className="flex items-center gap-4 p-4 bg-[#F3F0F5] rounded-2xl cursor-pointer mb-8 transition-all hover:bg-[#EADDFF]">
                <input 
                  type="checkbox" 
                  checked={commitmentAccepted}
                  onChange={(e) => setCommitmentAccepted(e.target.checked)}
                  className="w-6 h-6 rounded border-[#6750A4] text-[#6750A4] focus:ring-[#6750A4]"
                />
                <span className="font-medium text-[#1C1B1F]">
                  {currentJenis?.commitment_checkbox_text || 'Saya telah mengisi data dengan benar dan menyetujui pakta integritas.'}
                </span>
              </label>

              <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 rounded-2xl border border-[#E6E1E5] font-bold text-[#49454F]">
                  Kembali
                </button>
                <button 
                  onClick={startExam} 
                  disabled={!profileData.agama || !profileData.tanggalLahir || !profileData.kontakDarurat || !commitmentAccepted || loading}
                  className="flex-[2] py-4 rounded-2xl bg-[#6750A4] text-white font-bold shadow-md disabled:opacity-50"
                >
                  {loading ? 'Menyiapkan Ujian...' : 'Lanjut ke Ujian'}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Exam */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Anti-Cheat Watermark - Multi Layer */}
              {/* Layer 1: diagonal teks rapat */}
              <div className="fixed inset-0 pointer-events-none z-[49] overflow-hidden select-none"
                style={{ opacity: 0.12 }}>
                <div className="absolute inset-0 flex flex-col gap-8 pt-4" style={{ transform: 'rotate(-35deg) scale(1.5)', transformOrigin: 'center' }}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="flex gap-8 whitespace-nowrap">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <span key={j} className="text-sm font-bold text-[#6750A4] shrink-0">
                          {isUmum ? umumFormData.nama : participant.nama} · {participant.nik} · {isUmum ? (umumFormData.departemen || '-') : participant.perusahaan}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* Layer 2: center watermark besar */}
              <div className="fixed inset-0 pointer-events-none z-[48] overflow-hidden select-none flex items-center justify-center"
                style={{ opacity: 0.06 }}>
                <div className="text-center" style={{ transform: 'rotate(-35deg)' }}>
                  <p className="text-5xl sm:text-8xl font-black text-[#6750A4] leading-tight">{isUmum ? umumFormData.nama : participant.nama}</p>
                  <p className="text-3xl sm:text-5xl font-black text-[#6750A4]">{participant.nik}</p>
                  <p className="text-xl sm:text-3xl font-bold text-[#6750A4]">{isUmum ? (umumFormData.departemen || '-') : participant.perusahaan}</p>
                </div>
              </div>

              {/* Timer & Progress */}
              <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-[#E6E1E5] flex items-center justify-between sticky top-2 sm:top-20 z-40 gap-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${timeLeft < 300 ? 'bg-[#F9DEDC] text-[#B3261E]' : 'bg-[#EADDFF] text-[#6750A4]'}`}>
                    <Clock size={16} />
                  </div>
                  <span className={`text-base sm:text-xl font-mono font-bold ${timeLeft < 300 ? 'text-[#B3261E]' : 'text-[#1C1B1F]'}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-1 mx-2">
                  <div className="flex-1 h-2 bg-[#E6E1E5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6750A4] transition-all duration-300"
                      style={{ width: `${(Object.keys(answers).length / (questions.length || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[#49454F] text-xs font-medium whitespace-nowrap">
                    {Object.keys(answers).length}/{questions.length}
                  </span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 sm:space-y-8" onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()}>
                {questions.map((q, index) => (
                  <div key={q.id} className="relative bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-md border border-[#E6E1E5] select-none overflow-hidden">
                    {/* Watermark per kartu soal */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center" style={{opacity: 0.045}}>
                      <p className="text-xl sm:text-3xl font-black text-[#6750A4] whitespace-nowrap" style={{transform: 'rotate(-35deg)'}}>
                        {isUmum ? umumFormData.nama : participant.nama} · {participant.nik} · {isUmum ? (umumFormData.departemen || '-') : participant.perusahaan}
                      </p>
                    </div>
                    <div className="flex items-start gap-3 mb-4 sm:mb-6">
                      <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-[#6750A4] text-white flex items-center justify-center font-bold flex-shrink-0 text-xs sm:text-base">
                        {index + 1}
                      </div>
                      <p className="text-sm sm:text-xl font-medium text-[#1C1B1F] leading-relaxed pt-0.5">
                        {q.pertanyaan}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:gap-4">
                      {q.shuffledOptions.map((optObj: any) => {
                        const isSelected = answers[q.id] === optObj.label;
                        return (
                          <button
                            key={optObj.label}
                            onClick={() => setAnswers({...answers, [q.id]: optObj.label})}
                            className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl text-left border-2 transition-all flex items-center gap-2 sm:gap-4 ${
                              isSelected
                                ? 'border-[#6750A4] bg-[#EADDFF] shadow-sm'
                                : 'border-[#E6E1E5] hover:border-[#CAC4D0] bg-white'
                            }`}
                          >
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isSelected ? 'bg-[#6750A4] text-white' : 'bg-[#F3F0F5] text-[#49454F]'
                            }`}>
                              {optObj.label}
                            </div>
                            <span className="text-xs sm:text-lg leading-snug">{optObj.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Section */}
              <div className="pt-6 pb-10 sm:pt-12 sm:pb-20 flex flex-col items-center gap-4">
                <div className="w-full h-px bg-[#E6E1E5]" />
                <button
                  onClick={submitExam}
                  disabled={loading}
                  className="w-full max-w-md py-4 sm:py-6 rounded-[20px] sm:rounded-[24px] bg-[#6750A4] text-white font-bold text-lg sm:text-2xl shadow-xl hover:bg-[#4F378B] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? 'Mengirim Jawaban...' : 'Selesai & Kirim Jawaban'}
                </button>
                {Object.keys(answers).length < questions.length && (
                  <div className="flex items-center gap-2 text-[#B3261E] bg-[#F9DEDC] px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-xs sm:text-base animate-pulse text-center">
                    <AlertTriangle size={18} />
                    <span>Selesaikan semua soal ({Object.keys(answers).length}/{questions.length})</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Result */}
          {step === 4 && examResult && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[32px] p-6 sm:p-10 shadow-2xl border border-[#E6E1E5] text-center"
            >
              <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full mx-auto flex items-center justify-center mb-4 sm:mb-6 ${
                examResult.status_lulus ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#F9DEDC] text-[#B3261E]'
              }`}>
                {examResult.status_lulus ? <CheckCircle2 size={64} /> : <AlertTriangle size={64} />}
              </div>
              
              <h2 className="text-xl sm:text-3xl font-bold mb-2">
                {examResult.status_lulus ? 'Selamat, Anda Lulus!' : 'Maaf, Anda Belum Lulus'}
              </h2>
              <p className="text-[#49454F] mb-8">
                Hasil ujian induksi keselamatan kerja Anda telah dicatat.
              </p>

              <div className="bg-[#F3F0F5] p-5 rounded-3xl mb-6 text-left" id="hasil-ujian-evidence">
                <div className="flex justify-between items-center border-b border-[#E6E1E5] pb-3 mb-3">
                  <span className="text-sm font-medium text-[#49454F]">Waktu Selesai</span>
                  <span className="font-bold text-[#1C1B1F]">{new Date(examResult.waktu_selesai).toLocaleString('id-ID')}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-[#49454F] mb-1">NIK / ID</span>
                    <span className="font-bold text-[#1C1B1F]">{examResult.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-[#49454F] mb-1">Nama</span>
                    <span className="font-bold text-[#1C1B1F]">{examResult.nama}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-[#49454F] mb-1">Departemen / Perusahaan</span>
                    <span className="font-bold text-[#1C1B1F]">{examResult.perusahaan}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-xs text-[#49454F] mb-1">Jenis Ujian</span>
                    <span className="font-bold text-[#1C1B1F]">{currentJenis?.nama || 'Ujian Induksi'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#F3F0F5] p-6 rounded-3xl">
                  <span className="block text-sm text-[#49454F] mb-1">Skor Akhir</span>
                  <span className="text-4xl font-black text-[#6750A4]">{examResult.nilai}</span>
                </div>
                <div className="bg-[#F3F0F5] p-6 rounded-3xl">
                  <span className="block text-sm text-[#49454F] mb-1">Status</span>
                  <span className={`text-xl font-bold ${examResult.status_lulus ? 'text-[#2E7D32]' : 'text-[#B3261E]'}`}>
                    {examResult.status_lulus ? 'LULUS' : 'TIDAK LULUS'}
                  </span>
                </div>
              </div>

              {/* Violation Stats */}
              <div className="bg-[#F9DEDC] p-6 rounded-3xl border border-[#F2B8B5] mb-10 text-left">
                <h4 className="font-bold text-[#B3261E] flex items-center gap-2 mb-4">
                  <AlertTriangle size={18} /> Catatan Pelanggaran Keamanan
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#49454F] text-sm">Upaya Pindah Tab/Aplikasi:</span>
                    <span className="font-bold text-[#B3261E]">{examResult.profil_data.tab_violations || 0} kali</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#49454F] text-sm">Upaya Screenshot:</span>
                    <span className="font-bold text-[#B3261E]">{examResult.profil_data.screenshot_violations || 0} kali</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#49454F] text-sm">Upaya Copy Teks:</span>
                    <span className="font-bold text-[#B3261E]">{examResult.profil_data.copy_violations || 0} kali</span>
                  </div>
                </div>
              </div>

              {!examResult.status_lulus && (
                <div className="bg-[#FFF8E1] p-6 rounded-2xl border border-[#FFE082] mb-8 text-left">
                  <h4 className="font-bold text-[#F57F17] flex items-center gap-2 mb-2">
                    <AlertTriangle size={18} /> Remedial
                  </h4>
                  <p className="text-sm text-[#795548]">
                    Batas nilai kelulusan adalah {currentJenis?.passing_score || 70}. Silakan hubungi Admin untuk meminta akses ujian ulang (Remedial).
                  </p>
                  <button
                    onClick={() => handleRequestRemedial()}
                    disabled={loading}
                    className="mt-4 w-full py-3 bg-[#F57F17] text-white rounded-xl font-bold text-sm shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Mengirim...' : 'Minta Akses Remedial'}
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setLoading(true);
                    
                    const wrapperId = 'ehs-cert-export-wrapper';
                    let wrapper = document.getElementById(wrapperId);
                    if (!wrapper) {
                      wrapper = document.createElement('div');
                      wrapper.id = wrapperId;
                      wrapper.style.position = 'absolute';
                      wrapper.style.left = '-9999px';
                      wrapper.style.top = '-9999px';
                      wrapper.style.width = '600px';
                      wrapper.style.backgroundColor = '#ffffff';
                      wrapper.style.fontFamily = 'sans-serif';
                      wrapper.style.padding = '40px';
                      wrapper.style.color = '#1C1B1F';
                      document.body.appendChild(wrapper);
                    }
                    
                    wrapper.innerHTML = `
                      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #E6A620; padding-bottom: 20px;">
                        <h2 style="margin: 0; color: #1C1B1F; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">EHS Learning System</h2>
                        <p style="color: #6B7280; font-size: 14px; margin-top: 8px;">Bukti Kelulusan Ujian Induksi Keselamatan Kerja</p>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                        <span style="color: #6B7280; font-size: 14px;">Waktu Selesai</span>
                        <span style="font-weight: bold; color: #1C1B1F; font-size: 16px;">${new Date(examResult.waktu_selesai).toLocaleString('id-ID')}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                        <span style="color: #6B7280; font-size: 14px;">NIK / ID</span>
                        <span style="font-weight: bold; color: #1C1B1F; font-size: 16px;">${examResult.nik || '-'}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                        <span style="color: #6B7280; font-size: 14px;">Nama</span>
                        <span style="font-weight: bold; color: #1C1B1F; font-size: 16px;">${examResult.nama}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                        <span style="color: #6B7280; font-size: 14px;">Perusahaan / Dept</span>
                        <span style="font-weight: bold; color: #1C1B1F; font-size: 16px;">${examResult.perusahaan || '-'}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                        <span style="color: #6B7280; font-size: 14px;">Jenis Ujian</span>
                        <span style="font-weight: bold; color: #1C1B1F; font-size: 16px;">${currentJenis?.nama || 'Ujian Induksi'}</span>
                      </div>
                      <div style="margin-top: 40px; padding: 30px; border-radius: 12px; text-align: center; border: 2px solid ${examResult.status_lulus ? '#C8E6C9' : '#F2B8B5'}; background-color: ${examResult.status_lulus ? '#E8F5E9' : '#F9DEDC'}; color: ${examResult.status_lulus ? '#2E7D32' : '#B3261E'};">
                        <div style="font-size: 28px; font-weight: 900; margin-bottom: 10px;">${examResult.status_lulus ? 'LULUS' : 'TIDAK LULUS'}</div>
                        <div style="font-size: 48px; font-weight: 900;">Skor: ${examResult.nilai}</div>
                      </div>
                      <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px dashed #ccc; padding-top: 20px;">
                        Dokumen ini dicetak secara otomatis oleh sistem pencatatan hasil ujian EHS.
                      </div>
                    `;

                    const loadAndCapture = () => {
                      // @ts-ignore
                      window.html2canvas(wrapper, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
                        const link = document.createElement('a');
                        link.download = `Sertifikat_EHS_${examResult.nama.replace(/\s+/g, '_')}.jpg`;
                        link.href = canvas.toDataURL('image/jpeg', 0.9);
                        link.click();
                        setLoading(false);
                      }).catch((err: any) => {
                        console.error(err);
                        setLoading(false);
                        alert('Gagal mendownload gambar. Silakan coba lagi.');
                      });
                    };

                    if (!(window as any).html2canvas) {
                      const script = document.createElement('script');
                      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                      script.onload = loadAndCapture;
                      document.body.appendChild(script);
                    } else {
                      loadAndCapture();
                    }
                  }}
                  className="w-full py-4 rounded-2xl bg-[#E6A620] text-[#0F0F0F] font-bold text-lg shadow-lg hover:bg-[#F5B800] transition-all"
                >
                  {loading ? 'Menyiapkan Gambar...' : 'Simpan Hasil (.JPG)'}
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 rounded-2xl bg-white border-2 border-[#E6E1E5] text-[#49454F] font-bold text-md hover:bg-[#F3F0F5] transition-all"
                >
                  Selesai & Keluar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};
