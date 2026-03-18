-- ══════════════════════════════════════════════════════════════════
--  ПУСЗ Оаза — Doctor Priem, Chronic Therapy & Logs Schema
--  Run in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Doctor priem data (extends clients table) ─────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS priem_dijagnoza_kod     text,
  ADD COLUMN IF NOT EXISTS priem_dijagnoza_opis    text,
  ADD COLUMN IF NOT EXISTS priem_anamneza          text,
  ADD COLUMN IF NOT EXISTS priem_naod              text,
  ADD COLUMN IF NOT EXISTS priem_notes             text,
  -- Vital parameters on admission
  ADD COLUMN IF NOT EXISTS priem_kp_sistolicen     integer,   -- mmHg
  ADD COLUMN IF NOT EXISTS priem_kp_dijastolicen   integer,   -- mmHg
  ADD COLUMN IF NOT EXISTS priem_puls              integer,   -- bpm
  ADD COLUMN IF NOT EXISTS priem_temperatura       numeric(4,1), -- °C
  ADD COLUMN IF NOT EXISTS priem_spo2              integer,   -- %
  ADD COLUMN IF NOT EXISTS priem_respiracii        integer,   -- breaths/min
  ADD COLUMN IF NOT EXISTS priem_tezina            numeric(5,1), -- kg
  ADD COLUMN IF NOT EXISTS priem_seker             numeric(5,1), -- mmol/L
  ADD COLUMN IF NOT EXISTS priem_bolka             integer CHECK (priem_bolka BETWEEN 0 AND 10);

-- ── 2. Chronic diagnoses (one-to-many per client) ─────────────────
CREATE TABLE IF NOT EXISTS public.client_chronic_diagnoses (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid  NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  kod         text  NOT NULL,
  opis        text,
  added_by    uuid  REFERENCES auth.users(id),
  added_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chronic_diag_client_idx ON public.client_chronic_diagnoses(client_id);

-- ── 3. Chronic therapy (master list per client, with history) ─────
CREATE TABLE IF NOT EXISTS public.client_chronic_therapy (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid  NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  drug_id     uuid  REFERENCES public.drugs(id),
  drug_name   text  NOT NULL,   -- stored directly in case drug DB changes
  dosage      text  NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  added_by    uuid  REFERENCES auth.users(id),
  added_at    timestamptz NOT NULL DEFAULT now(),
  stopped_by  uuid  REFERENCES auth.users(id),
  stopped_at  timestamptz
);
CREATE INDEX IF NOT EXISTS therapy_client_idx    ON public.client_chronic_therapy(client_id);
CREATE INDEX IF NOT EXISTS therapy_client_active ON public.client_chronic_therapy(client_id, active);

-- ── 4. Logs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_logs (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid  NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by      uuid  NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- Current diagnosis for this log
  dijagnoza_kod   text,
  dijagnoza_opis  text,

  -- Clinical fields
  anamneza        text,
  naod            text,

  -- Vital parameters
  kp_sistolicen   integer,
  kp_dijastolicen integer,
  puls            integer,
  temperatura     numeric(4,1),
  spo2            integer,
  respiracii      integer,
  tezina          numeric(5,1),
  seker           numeric(5,1),
  bolka           integer CHECK (bolka BETWEEN 0 AND 10),

  -- Parenteral therapy applied in this log
  parenteralna    text
);
CREATE INDEX IF NOT EXISTS logs_client_idx    ON public.client_logs(client_id);
CREATE INDEX IF NOT EXISTS logs_created_idx   ON public.client_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS logs_created_by_idx ON public.client_logs(created_by);

-- ── 5. RLS ────────────────────────────────────────────────────────
ALTER TABLE public.client_chronic_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_chronic_therapy   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_logs              ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Auth read chronic_diagnoses" ON public.client_chronic_diagnoses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read chronic_therapy"   ON public.client_chronic_therapy   FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth read logs"              ON public.client_logs              FOR SELECT TO authenticated USING (true);

-- Only doctor can insert/update logs and therapy
CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.portal_users WHERE id = auth.uid() AND username = 'Doktor');
$$;

CREATE OR REPLACE FUNCTION public.is_doctor_or_privileged()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.portal_users WHERE id = auth.uid() AND username IN ('Doktor','Menadzer','GlavnaSestra'));
$$;

CREATE POLICY "Doctor inserts logs"             ON public.client_logs FOR INSERT TO authenticated WITH CHECK (public.is_doctor());
CREATE POLICY "Doctor updates logs"             ON public.client_logs FOR UPDATE TO authenticated USING (public.is_doctor());
CREATE POLICY "Doctor inserts chronic_diag"     ON public.client_chronic_diagnoses FOR INSERT TO authenticated WITH CHECK (public.is_doctor());
CREATE POLICY "Doctor inserts chronic_therapy"  ON public.client_chronic_therapy   FOR INSERT TO authenticated WITH CHECK (public.is_doctor());
CREATE POLICY "Doctor updates chronic_therapy"  ON public.client_chronic_therapy   FOR UPDATE TO authenticated USING (public.is_doctor());
CREATE POLICY "Doctor updates client priem"     ON public.clients FOR UPDATE TO authenticated USING (public.is_doctor_or_privileged());
