export type UserRole = 'super_admin' | 'admin' | 'peserta';

export interface AdminUser {
  id: string;
  username: string;
  role: UserRole;
  is_approved: boolean;
  created_at: string;
}

export interface PesertaMaster {
  nik: string;
  nama: string;
  perusahaan: string;
  kategori: 'Karyawan' | 'Magang' | 'Visitor' | 'Kontraktor';
  allowed_jenis_id?: string;
  is_remedial?: boolean;
  created_at?: string;
  tipe_ujian?: 'umum'; // Hanya untuk peserta sementara Ujian Umum
}

export interface JenisUjian {
  id: string;
  nama: string;
  timer_minutes: number;
  has_commitment: boolean;
  is_active: boolean;
  created_by: string;
  limit_one_per_day?: boolean;
  commitment_title?: string;
  commitment_content?: string;
  tipe_ujian?: 'khusus' | 'umum'; // 'khusus' = peserta terdaftar, 'umum' = siapa saja
}

export interface Soal {
  id: string;
  jenis_ujian_id: string;
  pertanyaan: string;
  pilihan_a: string;
  pilihan_b: string;
  pilihan_c: string;
  pilihan_d: string;
  jawaban_benar: 'A' | 'B' | 'C' | 'D';
}

export interface HasilUjian {
  id: string;
  nik: string;
  nama: string;
  perusahaan?: string;
  jenis_ujian_id: string;
  nilai: number;
  status_lulus: boolean;
  waktu_selesai: string;
  profil_data: {
    status_perkawinan: string;
    agama: string;
    tanggal_lahir: string;
    pendidikan: string;
    kontak_darurat: string;
    tab_violations?: number;
    screenshot_violations?: number;
    is_remedial?: boolean;
  };
}

export interface RequestRetryLog {
  id: string;
  nik: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
