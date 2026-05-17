-- 006_broadcasts.sql
CREATE TABLE broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('all','responders','zone')),
  zone TEXT,
  sent_by UUID NOT NULL REFERENCES users(id),
  incident_id UUID REFERENCES incidents(id),
  created_at TIMESTAMPTZ DEFAULT now()
);