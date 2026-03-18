-- ══════════════════════════════════════════════════════════════════
--  ПУСЗ Оаза — Clients Schema
--  Run in: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Clients table ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Part 1: General / Admission info
  maticen_broj          text,                        -- Број од матична книга
  obrakanje             text,                        -- Обраќање (Г-дин / Г-ѓа / etc.)
  ime_prezime           text        NOT NULL,        -- Име и Презиме
  broj_soba             text,                        -- Број на соба
  adresa                text,                        -- Адреса на живеење
  embg                  text,                        -- ЕМБГ
  licna_karta_broj      text,                        -- Број на лична карта / пасош

  -- Registration workflow status
  -- 'draft'     → Part 1 saved, not yet submitted
  -- 'social'    → Awaiting social worker input
  -- 'doctor'    → Awaiting doctor input
  -- 'completed' → Прием завршен, logs enabled
  status                text        NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'social', 'doctor', 'completed')),

  -- Part 2: Social worker (placeholder — fields added later)
  social_notes          text,
  social_completed_at   timestamptz,
  social_completed_by   uuid REFERENCES auth.users(id),

  -- Part 3: Doctor (placeholder — fields added later)
  doctor_notes          text,
  doctor_completed_at   timestamptz,
  doctor_completed_by   uuid REFERENCES auth.users(id),

  -- Audit
  created_by            uuid        REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Srodstvo (next of kin) — separate table, one-to-many ──────
CREATE TABLE IF NOT EXISTS public.client_srodstvo (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid  NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  ime_prezime text,
  adresa      text,
  telefon     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 3. Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS clients_status_idx    ON public.clients(status);
CREATE INDEX IF NOT EXISTS clients_created_by_idx ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS srodstvo_client_idx   ON public.client_srodstvo(client_id);

-- ── 4. Updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS clients_updated_at ON public.clients;
CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── 5. Row Level Security ────────────────────────────────────────
ALTER TABLE public.clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_srodstvo ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read clients
CREATE POLICY "Auth users read clients"
  ON public.clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth users read srodstvo"
  ON public.client_srodstvo FOR SELECT TO authenticated USING (true);

-- Only Menadzer and GlavnaSestra can INSERT clients (enforced in app too)
CREATE POLICY "Privileged users insert clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email IN ('Menadzer@oaza.internal', 'GlavnaSestra@oaza.internal')
    )
  );

-- Anyone authenticated can insert srodstvo (tied to a client they can see)
CREATE POLICY "Auth users insert srodstvo"
  ON public.client_srodstvo FOR INSERT TO authenticated WITH CHECK (true);

-- Updates allowed for authenticated users (role checks done in app)
CREATE POLICY "Auth users update clients"
  ON public.clients FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth users update srodstvo"
  ON public.client_srodstvo FOR UPDATE TO authenticated USING (true);

-- Deletes: only privileged users
CREATE POLICY "Privileged users delete srodstvo"
  ON public.client_srodstvo FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email IN ('Menadzer@oaza.internal', 'GlavnaSestra@oaza.internal')
    )
  );
