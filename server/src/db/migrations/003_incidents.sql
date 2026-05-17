-- 003_incidents.sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number TEXT UNIQUE NOT NULL, -- e.g. INC-20260517-0042, generated server-side
  type TEXT NOT NULL CHECK (type IN ('medical','flood','fire','road','infrastructure','civil','other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_text TEXT NOT NULL,
  location_lat DECIMAL(9,6),
  location_lng DECIMAL(9,6),
  severity INTEGER NOT NULL CHECK (severity IN (1,2,3)), -- 1=critical, 2=high, 3=medium
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','triaging','dispatched','on_scene','resolved','closed')),
  reported_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  ai_triage_data JSONB,         -- stores full AI response
  approved_option INTEGER,      -- which option (1/2/3) was approved
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_search ON incidents USING gin(to_tsvector('english', title || ' ' || description));