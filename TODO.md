# TODO: Implementasi Fitur Ujian Umum & Ujian Khusus

## Langkah-langkah:

- [x] Baca dan pahami semua file yang relevan
- [x] Step 1: Update `src/types.ts` - Tambah `tipe_ujian` ke interface JenisUjian & PesertaMaster
- [x] Step 2: Update `supabase_schema.sql` - Tambah SQL migration untuk kolom `tipe_ujian`
- [x] Step 3: Update `src/pages/AdminDashboard.tsx`:
  - [x] Tambah `tipe_ujian` ke state `newJenis` & reset setelah save
  - [x] Tambah `tipe_ujian` ke `handleEditJenis` & `handleUpdateJenis`
  - [x] Tambah badge tipe di mobile card (🌐 Umum / 🔒 Khusus)
  - [x] Tambah kolom "Tipe" di tabel desktop (header + td)
  - [x] Tambah field pilihan tipe di form Tambah Jenis Ujian
  - [x] Tambah field pilihan tipe di form Edit Jenis Ujian
- [x] Step 4: Update `src/pages/LandingPage.tsx`:
  - [x] Cek tipe_ujian sebelum peserta_master lookup
  - [x] Jika Ujian Umum: skip peserta_master, simpan data minimal, navigate ke /induction
- [x] Step 5: Update `src/pages/ParticipantFlow.tsx`:
  - [x] Tambah state `umumFormData` (nama, departemen)
  - [x] Tambah konstanta `isUmum`
  - [x] Skip session update untuk Ujian Umum
  - [x] Skip session check untuk Ujian Umum
  - [x] Modifikasi `submitExam` untuk data Ujian Umum
  - [x] Progress bar 3 langkah untuk Ujian Umum
  - [x] Step 1: Form sederhana (Nama + Departemen) untuk Ujian Umum
  - [x] Sembunyikan tombol Remedial untuk Ujian Umum
  - [x] Update watermark dengan data Ujian Umum

## ⚠️ SQL Migration yang WAJIB dijalankan di Supabase Dashboard:

**Migration 1** - Tambah kolom tipe_ujian (sudah dijalankan):
```sql
ALTER TABLE jenis_ujian ADD COLUMN IF NOT EXISTS tipe_ujian TEXT CHECK (tipe_ujian IN ('khusus', 'umum')) DEFAULT 'khusus';
```

**Migration 2** - Drop FK constraint hasil_ujian.nik (WAJIB untuk Ujian Umum):
```sql
ALTER TABLE hasil_ujian DROP CONSTRAINT IF EXISTS hasil_ujian_nik_fkey;
```
> Tanpa migration ini, insert hasil ujian untuk peserta Ujian Umum akan GAGAL karena ID bebas tidak ada di tabel peserta_master.

## Catatan Penting:
- Ujian Khusus: perilaku TIDAK berubah sama sekali ✅
- Ujian Umum: aktif jika tipe_ujian = 'umum' DAN diakses via URL ?exam=ID
- Flow Ujian Umum: Input ID → Form Nama+Dept → Ujian langsung (skip step 2 profil+komitmen)
- Flow Ujian Khusus: Input NIK → Verifikasi identitas → Profil+Komitmen → Ujian
- hasil_ujian: kolom `nik` berisi ID yang diketik user saat login (bukan null)
- Remedial: tidak tersedia untuk Ujian Umum
- Session management: dilewati untuk Ujian Umum
