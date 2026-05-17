-- 007_notifications_trigger.sql
-- PostgreSQL NOTIFY trigger so backend SSE can push real-time updates
CREATE OR REPLACE FUNCTION notify_incident_change()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('incident_updates', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incident_change_trigger
AFTER INSERT OR UPDATE ON incidents
FOR EACH ROW EXECUTE FUNCTION notify_incident_change();

CREATE OR REPLACE FUNCTION notify_incident_update_insert()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('timeline_updates', row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incident_update_trigger
AFTER INSERT ON incident_updates
FOR EACH ROW EXECUTE FUNCTION notify_incident_update_insert();