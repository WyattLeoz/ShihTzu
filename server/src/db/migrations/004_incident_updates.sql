-- 004_incident_updates.sql
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  update_type TEXT NOT NULL CHECK (update_type IN ('status_change','field_update','note','dispatch','notification','system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_updates_incident ON incident_updates(incident_id, created_at DESC);