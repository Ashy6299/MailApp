import Database from "better-sqlite3";

let db;

try {
  db = new Database("mailapp.db");
  console.log("SQLite DB connected: mailapp.db");
} catch (err) {
  console.error("Failed to connect to SQLite DB:", err.message);
  process.exit(1); // stop the app if DB is unavailable
}

// Create tables if they don't exist
db.exec(`
CREATE TABLE IF NOT EXISTS batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (datetime('now')),
  csv_name TEXT,
  subject TEXT,
  html_body TEXT,
  total INTEGER,
  sent INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  processed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress', -- 'in_progress','stopped','completed'
  stopped_at INTEGER,
  error TEXT
);

CREATE TABLE IF NOT EXISTS batch_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL,
  idx INTEGER NOT NULL,
  email TEXT,
  name TEXT,
  data_json TEXT, -- full CSV row as JSON
  status TEXT DEFAULT 'pending', -- 'pending','sent','error'
  attempt INTEGER DEFAULT 0,
  error TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(batch_id) REFERENCES batches(id)
);
`);

export default db;
