-- CAPI Events log (auditoría de eventos enviados a Meta Conversion API)
CREATE TABLE IF NOT EXISTS capi_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_time INTEGER NOT NULL,
  payload TEXT NOT NULL,
  meta_response TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_capi_event_id ON capi_events(event_id);
CREATE INDEX IF NOT EXISTS idx_capi_created ON capi_events(created_at);