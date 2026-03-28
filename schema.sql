-- ============================================================
-- SkillForge AI — Supabase Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id                UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name         TEXT,
  email             TEXT,
  avatar_url        TEXT,
  current_position  TEXT,
  target_position   TEXT,
  experience_years  INTEGER DEFAULT 0,
  education_level   TEXT CHECK (education_level IN ('high_school','associate','bachelor','master','phd','bootcamp','self_taught','other')),
  location          TEXT,
  bio               TEXT,
  phone_number      TEXT,
  linkedin_url      TEXT,
  github_url        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SKILLS
-- ============================================================
CREATE TABLE skills (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  category   TEXT NOT NULL CHECK (category IN ('technical','soft','domain','tool','language','framework','other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_skills (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id         UUID REFERENCES skills(id) ON DELETE CASCADE,
  proficiency      TEXT CHECK (proficiency IN ('beginner','intermediate','advanced','expert')),
  years_experience NUMERIC(4,1),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- ============================================================
-- CHAT
-- ============================================================
CREATE TABLE chat_sessions (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT DEFAULT 'New Conversation',
  session_type TEXT DEFAULT 'general' CHECK (session_type IN ('general','skill_gap','job_advice','interview_prep','career_switch')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOBS
-- ============================================================
CREATE TABLE job_listings (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title               TEXT NOT NULL,
  company             TEXT NOT NULL,
  location            TEXT,
  job_type            TEXT CHECK (job_type IN ('full_time','part_time','contract','freelance','internship','remote')),
  experience_level    TEXT CHECK (experience_level IN ('entry','mid','senior','lead','executive')),
  salary_min          INTEGER,
  salary_max          INTEGER,
  description         TEXT,
  requirements        TEXT[],
  required_skills     TEXT[],
  nice_to_have_skills TEXT[],
  apply_url           TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  posted_at           TIMESTAMPTZ DEFAULT NOW(),
  expires_at          TIMESTAMPTZ
);

CREATE TABLE saved_jobs (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  job_id     UUID REFERENCES job_listings(id) ON DELETE CASCADE,
  notes      TEXT,
  status     TEXT DEFAULT 'saved' CHECK (status IN ('saved','applied','interviewing','offered','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- ============================================================
-- SKILL GAP ANALYSES
-- ============================================================
CREATE TABLE skill_gap_analyses (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_role     TEXT NOT NULL,
  current_skills  TEXT[],
  missing_skills  JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  match_score     INTEGER CHECK (match_score BETWEEN 0 AND 100),
  ai_summary      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MENTORSHIP SESSIONS
-- ============================================================
CREATE TABLE mentor_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id  TEXT,
  order_id    TEXT,
  amount      INTEGER,
  currency    TEXT DEFAULT 'INR',
  status      TEXT DEFAULT 'pending',
  preferences JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills             ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_listings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gap_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions    ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "own_profile_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own_profile_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Skills (public read)
CREATE POLICY "skills_public_read" ON skills FOR SELECT USING (TRUE);

-- User skills
CREATE POLICY "own_user_skills" ON user_skills FOR ALL USING (auth.uid() = user_id);

-- Chat sessions
CREATE POLICY "own_chat_sessions" ON chat_sessions FOR ALL USING (auth.uid() = user_id);

-- Chat messages (scoped via session ownership)
CREATE POLICY "own_chat_messages" ON chat_messages FOR ALL
  USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- Job listings (public read, backend writes)
CREATE POLICY "jobs_public_read" ON job_listings FOR SELECT USING (TRUE);
CREATE POLICY "jobs_service_write" ON job_listings FOR INSERT WITH CHECK (TRUE);

-- Saved jobs
CREATE POLICY "own_saved_jobs" ON saved_jobs FOR ALL USING (auth.uid() = user_id);

-- Skill gap analyses
CREATE POLICY "own_analyses" ON skill_gap_analyses FOR ALL USING (auth.uid() = user_id);

-- Mentor sessions
CREATE POLICY "own_mentor" ON mentor_sessions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA — Skills
-- ============================================================
INSERT INTO skills (name, category) VALUES
  ('JavaScript', 'language'), ('Python', 'language'), ('TypeScript', 'language'),
  ('Java', 'language'), ('C++', 'language'), ('Go', 'language'), ('Rust', 'language'),
  ('SQL', 'language'), ('HTML', 'language'), ('CSS', 'language'),
  ('React', 'framework'), ('Vue.js', 'framework'), ('Angular', 'framework'),
  ('Node.js', 'framework'), ('Django', 'framework'), ('FastAPI', 'framework'),
  ('Next.js', 'framework'), ('Express.js', 'framework'), ('Spring Boot', 'framework'),
  ('Docker', 'tool'), ('Kubernetes', 'tool'), ('Git', 'tool'), ('AWS', 'tool'),
  ('Azure', 'tool'), ('Google Cloud', 'tool'), ('PostgreSQL', 'tool'),
  ('MongoDB', 'tool'), ('Redis', 'tool'), ('Figma', 'tool'), ('Linux', 'tool'),
  ('Machine Learning', 'domain'), ('Data Analysis', 'domain'), ('System Design', 'domain'),
  ('Cybersecurity', 'domain'), ('DevOps', 'domain'), ('UI/UX Design', 'domain'),
  ('Product Management', 'domain'), ('Digital Marketing', 'domain'),
  ('Communication', 'soft'), ('Leadership', 'soft'), ('Problem Solving', 'soft'),
  ('Teamwork', 'soft'), ('Project Management', 'soft'), ('Agile/Scrum', 'soft'),
  ('Critical Thinking', 'soft'), ('Time Management', 'soft');