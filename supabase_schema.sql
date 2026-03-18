/*
  SQL Schema for Supabase

  -- Admin Users Table
  CREATE TABLE users_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK (role IN ('super_admin', 'admin')) DEFAULT 'admin',
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Peserta Master Table (Whitelist)
  CREATE TABLE peserta_master (
    nik TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    perusahaan TEXT NOT NULL,
    kategori TEXT CHECK (kategori IN ('Karyawan', 'Magang', 'Visitor', 'Kontraktor')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Jenis Ujian Table
  CREATE TABLE jenis_ujian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama TEXT NOT NULL,
    timer_minutes INTEGER DEFAULT 30,
    has_commitment BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    limit_one_per_day BOOLEAN DEFAULT FALSE,
    soal_display_count INTEGER DEFAULT 20,
    passing_score INTEGER DEFAULT 70,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Bank Soal Table
  CREATE TABLE soal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jenis_ujian_id UUID REFERENCES jenis_ujian(id) ON DELETE CASCADE,
    pertanyaan TEXT NOT NULL,
    pilihan_a TEXT NOT NULL,
    pilihan_b TEXT NOT NULL,
    pilihan_c TEXT NOT NULL,
    pilihan_d TEXT NOT NULL,
    jawaban_benar TEXT CHECK (jawaban_benar IN ('A', 'B', 'C', 'D')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Hasil Ujian Table
  CREATE TABLE hasil_ujian (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nik TEXT REFERENCES peserta_master(nik),
    nama TEXT NOT NULL,
    jenis_ujian_id UUID REFERENCES jenis_ujian(id),
    nilai INTEGER NOT NULL,
    status_lulus BOOLEAN NOT NULL,
    waktu_selesai TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    profil_data JSONB NOT NULL,
    admin_pembuat TEXT
  );

  -- Request Retry Log Table
  CREATE TABLE request_retry_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nik TEXT REFERENCES peserta_master(nik),
    reason TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Persistent Stats Table (Lifetime Counters)
  CREATE TABLE persistent_stats (
    id TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Initialize stats
  INSERT INTO persistent_stats (id, count) VALUES 
    ('total_peserta', 0),
    ('total_ujian_selesai', 0),
    ('total_lulus', 0),
    ('total_gagal', 0)
  ON CONFLICT (id) DO NOTHING;
