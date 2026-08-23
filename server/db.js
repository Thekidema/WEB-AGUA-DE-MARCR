const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@libsql/client');

/* sin TURSO_DATABASE_URL (dev local) usa un archivo SQLite local, rápido y
   offline; en producción (Railway) se setean TURSO_DATABASE_URL/TURSO_AUTH_TOKEN
   y apunta a la base gestionada en la nube — mismo cliente, mismo código */
const LOCAL_DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'aguademar.sqlite');
const url = process.env.TURSO_DATABASE_URL || `file:${LOCAL_DB_PATH}`;
if (url.startsWith('file:')) fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

/* capa fina que imita la forma de la API anterior (better-sqlite3) pero
   async — mantiene las rutas legibles (db.get(sql, ...args)) sin repetir
   { sql, args: [...] } en cada llamada de todo el proyecto */
const db = {
  async run(sql, ...args) {
    return client.execute({ sql, args });
  },
  async get(sql, ...args) {
    const res = await client.execute({ sql, args });
    return res.rows[0];
  },
  async all(sql, ...args) {
    const res = await client.execute({ sql, args });
    return res.rows;
  },
};

async function initDb() {
  await client.execute(`
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
  const pragma = await client.execute('PRAGMA table_info(products)');
  const productCols = pragma.rows.map((c) => c.name);
  if (!productCols.includes('active')) {
    await client.execute('ALTER TABLE products ADD COLUMN active INTEGER NOT NULL DEFAULT 1');
  }
  if (!productCols.includes('featured')) {
    await client.execute('ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0');
  }

  /* settings: SOLO contenido público (whatsapp/instagram). Nunca mezclar acá
     credenciales — el endpoint público /api/site-content hace SELECT por key
     explícito, y si esta tabla algún día tuviera datos sensibles, un simple
     error de copy/paste podría filtrarlos. */
  await client.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  await client.execute({ sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', args: ['whatsapp', '50683425634'] });
  await client.execute({ sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', args: ['instagram', 'https://www.instagram.com/aguademarbeachwearcr'] });

  await client.execute(`
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
  const faqCountRes = await client.execute('SELECT COUNT(*) AS n FROM faqs');
  if (faqCountRes.rows[0].n === 0) {
    const seedFaqs = [
      ['¿Cómo elijo mi talla?', 'Cada pieza incluye una tabla de medidas en centímetros. Si estás entre dos tallas, escribinos por WhatsApp con tus medidas y te recomendamos la mejor opción. Nuestras telas tienen buena recuperación, así que ceden lo justo sin deformarse.'],
      ['¿Hacen envíos a todo el país?', 'Sí. Enviamos a toda Costa Rica con entrega de 2 a 4 días hábiles. En el GAM coordinamos entrega exprés. El costo de envío se calcula al finalizar tu pedido por WhatsApp.'],
      ['¿Puedo cambiar o devolver una prenda?', 'Tenés 15 días para cambios siempre que la prenda esté sin uso, con etiquetas y forro higiénico intacto. Por higiene, no aceptamos devoluciones de bottoms una vez retirado el forro.'],
      ['¿De qué está hecha la tela?', 'Trabajamos con un tejido de poliamida reciclada y elastano, resistente al cloro, al agua salada y al protector solar. Es de secado rápido y mantiene el color estación tras estación.'],
      ['¿Cómo cuido mi traje de baño?', 'Enjuagá con agua dulce después de cada uso, lavá a mano con jabón neutro y secá a la sombra. Evitá la secadora y el contacto prolongado con superficies rugosas. Así te dura años.'],
    ];
    for (let i = 0; i < seedFaqs.length; i++) {
      const [question, answer] = seedFaqs[i];
      await client.execute({
        sql: 'INSERT INTO faqs (id, question, answer, sort_order) VALUES (?, ?, ?, ?)',
        args: [crypto.randomUUID(), question, answer, i],
      });
    }
  }

  /* pedidos por WhatsApp: NO son ventas confirmadas (el pago se coordina fuera
     del sitio), son intención de compra al momento de tocar "Coordinar por
     WhatsApp". items guarda un snapshot (id/type/color/price/qty) tomado en
     ese momento, así el ranking sigue siendo válido aunque el producto se
     edite o borre después. Sin datos personales del visitante. */
  await client.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id         TEXT PRIMARY KEY,
      items      TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { db, client, initDb };
