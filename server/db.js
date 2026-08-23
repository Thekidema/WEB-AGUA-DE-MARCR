const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
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

/* settings: SOLO contenido público (whatsapp/instagram). Nunca mezclar acá
   credenciales — el endpoint público /api/site-content hace SELECT por key
   explícito, y si esta tabla algún día tuviera datos sensibles, un simple
   error de copy/paste podría filtrarlos. Ver server/routes/adminCredentials
   (Fase B2) para dónde vive la contraseña del admin. */
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('whatsapp', '50683425634');
db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('instagram', 'https://www.instagram.com/aguademarbeachwearcr');

db.exec(`
  CREATE TABLE IF NOT EXISTS faqs (
    id         TEXT PRIMARY KEY,
    question   TEXT NOT NULL,
    answer     TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

/* bootstrap con las FAQ que ya vivían hardcoded en data.js, para no dejar
   la sección vacía en el primer deploy de esta tabla */
const faqCount = db.prepare('SELECT COUNT(*) AS n FROM faqs').get().n;
if (faqCount === 0) {
  const seedFaqs = [
    ['¿Cómo elijo mi talla?', 'Cada pieza incluye una tabla de medidas en centímetros. Si estás entre dos tallas, escribinos por WhatsApp con tus medidas y te recomendamos la mejor opción. Nuestras telas tienen buena recuperación, así que ceden lo justo sin deformarse.'],
    ['¿Hacen envíos a todo el país?', 'Sí. Enviamos a toda Costa Rica con entrega de 2 a 4 días hábiles. En el GAM coordinamos entrega exprés. El costo de envío se calcula al finalizar tu pedido por WhatsApp.'],
    ['¿Puedo cambiar o devolver una prenda?', 'Tenés 15 días para cambios siempre que la prenda esté sin uso, con etiquetas y forro higiénico intacto. Por higiene, no aceptamos devoluciones de bottoms una vez retirado el forro.'],
    ['¿De qué está hecha la tela?', 'Trabajamos con un tejido de poliamida reciclada y elastano, resistente al cloro, al agua salada y al protector solar. Es de secado rápido y mantiene el color estación tras estación.'],
    ['¿Cómo cuido mi traje de baño?', 'Enjuagá con agua dulce después de cada uso, lavá a mano con jabón neutro y secá a la sombra. Evitá la secadora y el contacto prolongado con superficies rugosas. Así te dura años.'],
  ];
  const insertFaq = db.prepare('INSERT INTO faqs (id, question, answer, sort_order) VALUES (?, ?, ?, ?)');
  seedFaqs.forEach(([question, answer], i) => insertFaq.run(crypto.randomUUID(), question, answer, i));
}

module.exports = db;
