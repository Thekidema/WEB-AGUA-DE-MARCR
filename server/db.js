const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'aguademar.sqlite');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id         TEXT PRIMARY KEY,
    type       TEXT NOT NULL,
    color      TEXT NOT NULL,
    price      INTEGER NOT NULL,
    sizes      TEXT NOT NULL,
    tone       TEXT NOT NULL,
    desc       TEXT NOT NULL,
    image      TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
