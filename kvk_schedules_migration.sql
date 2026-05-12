-- ============================================================
-- KvK Buff Scheduler — Supabase Migration
-- Run this in your Supabase SQL Editor (Database → SQL Editor)
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS kvk_schedules (
    id          TEXT PRIMARY KEY,          -- short shareable ID, e.g. "Ab3xY7Qz"
    name        TEXT NOT NULL DEFAULT '',  -- human-readable label
    day1        JSONB NOT NULL DEFAULT '[]'::jsonb,   -- array[48] of player|null
    day4        JSONB NOT NULL DEFAULT '[]'::jsonb,   -- array[48] of player|null
    queue       JSONB NOT NULL DEFAULT '[]'::jsonb,   -- unscheduled player objects
    version     INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Auto-update updated_at on every write
CREATE OR REPLACE FUNCTION update_kvk_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kvk_schedules_updated_at ON kvk_schedules;
CREATE TRIGGER kvk_schedules_updated_at
    BEFORE UPDATE ON kvk_schedules
    FOR EACH ROW EXECUTE FUNCTION update_kvk_updated_at();

-- 3. Enable Row Level Security (open read/write — same pattern as the rest of the site)
ALTER TABLE kvk_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read"   ON kvk_schedules;
DROP POLICY IF EXISTS "Allow public insert" ON kvk_schedules;
DROP POLICY IF EXISTS "Allow public update" ON kvk_schedules;

CREATE POLICY "Allow public read"
    ON kvk_schedules FOR SELECT USING (true);

CREATE POLICY "Allow public insert"
    ON kvk_schedules FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update"
    ON kvk_schedules FOR UPDATE USING (true);

-- 4. Enable Realtime for this table (required for live sync)
--    If you already have a publication, just add the table:
ALTER PUBLICATION supabase_realtime ADD TABLE kvk_schedules;
