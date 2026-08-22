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

/* migración idempotente: ALTER TABLE ADD COLUMN falla si la columna ya existe,
   así que se chequea PRAGMA table_info antes — seguro de correr en cada arranque */
const productCols = db.prepare("PRAGMA table_info(products)").all().map((c) => c.name);
if (!productCols.includes('active')) {
  db.exec('ALTER TABLE products ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
}
if (!productCols.includes('featured')) {
  db.exec('ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0');
}

module.exports = db;
