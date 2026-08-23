const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { COOKIE_NAME, signAdminToken, cookieOptions, requireAdmin } = require('../middleware/auth');
const { db } = require('../db');
const { serializeProduct } = require('../productSerializer');
const { upload, deleteUploadedImage } = require('../upload');
const { asyncHandler } = require('../asyncHandler');

const router = express.Router();
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
});

/* multer envuelto para responder JSON en vez de la página HTML de error por default */
function handleImageUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Error al subir la imagen' });
    next();
  });
}

function validateProductFields(body) {
  const errors = [];
  const { type, color, tone, desc } = body;
  const price = Number(body.price);
  let sizes;
  try {
    sizes = JSON.parse(body.sizes);
  } catch (e) {
    sizes = null;
  }

  if (!type || typeof type !== 'string') errors.push('type es requerido');
  if (!color || typeof color !== 'string') errors.push('color es requerido');
  if (!tone || typeof tone !== 'string') errors.push('tone es requerido');
  if (!desc || typeof desc !== 'string') errors.push('desc es requerido');
  if (!Number.isInteger(price) || price <= 0) errors.push('price debe ser un entero positivo');
  if (!Array.isArray(sizes) || sizes.length === 0 || !sizes.every((s) => typeof s === 'string')) {
    errors.push('sizes debe ser un array JSON de strings, no vacío');
  }

  return { errors, type, color, tone, desc, price, sizes };
}

router.post('/login', loginLimiter, express.json(), (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  const validUser = username === process.env.ADMIN_USERNAME;
  const validPass = validUser && bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH || '');
  if (!validUser || !validPass) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  const token = signAdminToken(username);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ username });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

router.get('/session', requireAdmin, (req, res) => {
  res.json({ username: req.admin.sub });
});

router.get('/products', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await db.all('SELECT * FROM products ORDER BY created_at DESC');
  res.json(rows.map(serializeProduct));
}));

router.post('/products', requireAdmin, handleImageUpload, asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'La imagen es requerida' });

  const { errors, type, color, tone, desc, price, sizes } = validateProductFields(req.body);
  if (errors.length) {
    deleteUploadedImage(req.file.filename);
    return res.status(400).json({ error: errors.join(', ') });
  }

  const id = crypto.randomUUID();
  await db.run(
    `INSERT INTO products (id, type, color, price, sizes, tone, desc, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, type, color, price, JSON.stringify(sizes), tone, desc, req.file.filename
  );

  const row = await db.get('SELECT * FROM products WHERE id = ?', id);
  res.status(201).json(serializeProduct(row));
}));

router.put('/products/:id', requireAdmin, handleImageUpload, asyncHandler(async (req, res) => {
  const existing = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!existing) {
    if (req.file) deleteUploadedImage(req.file.filename);
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const { errors, type, color, tone, desc, price, sizes } = validateProductFields(req.body);
  if (errors.length) {
    if (req.file) deleteUploadedImage(req.file.filename);
    return res.status(400).json({ error: errors.join(', ') });
  }

  const image = req.file ? req.file.filename : existing.image;
  await db.run(
    `UPDATE products SET type=?, color=?, price=?, sizes=?, tone=?, desc=?, image=? WHERE id=?`,
    type, color, price, JSON.stringify(sizes), tone, desc, image, req.params.id
  );

  if (req.file) deleteUploadedImage(existing.image);

  const row = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  res.json(serializeProduct(row));
}));

router.delete('/products/:id', requireAdmin, asyncHandler(async (req, res) => {
  const existing = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  await db.run('DELETE FROM products WHERE id = ?', req.params.id);
  deleteUploadedImage(existing.image);
  res.json({ ok: true });
}));

function togglePatch(column) {
  return asyncHandler(async (req, res) => {
    const existing = await db.get('SELECT id FROM products WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
    if (typeof req.body.value !== 'boolean') {
      return res.status(400).json({ error: 'value debe ser boolean' });
    }
    await db.run(`UPDATE products SET ${column} = ? WHERE id = ?`, req.body.value ? 1 : 0, req.params.id);
    const row = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
    res.json(serializeProduct(row));
  });
}

router.patch('/products/:id/active', requireAdmin, express.json(), togglePatch('active'));
router.patch('/products/:id/featured', requireAdmin, express.json(), togglePatch('featured'));

/* ===== Configuración pública (WhatsApp / Instagram) ===== */
router.get('/settings', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await db.all("SELECT key, value FROM settings WHERE key IN ('whatsapp', 'instagram')");
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({ whatsapp: settings.whatsapp || '', instagram: settings.instagram || '' });
}));

router.put('/settings', requireAdmin, express.json(), asyncHandler(async (req, res) => {
  const { whatsapp, instagram } = req.body || {};
  const errors = [];

  if (!/^\d{8,15}$/.test(whatsapp || '')) {
    errors.push('WhatsApp debe ser solo dígitos (código de país + número, sin +, espacios ni guiones)');
  }
  if (!/^https:\/\/(www\.)?instagram\.com\/.+/.test(instagram || '')) {
    errors.push('Instagram debe ser una URL de instagram.com (ej. https://www.instagram.com/tuusuario)');
  }
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  const upsertSql = 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value';
  await db.run(upsertSql, 'whatsapp', whatsapp);
  await db.run(upsertSql, 'instagram', instagram);
  res.json({ whatsapp, instagram });
}));

/* ===== FAQ ===== */
router.get('/faqs', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await db.all('SELECT * FROM faqs ORDER BY sort_order ASC, created_at ASC');
  res.json(rows);
}));

function validateFaqFields(body) {
  const errors = [];
  const question = (body.question || '').trim();
  const answer = (body.answer || '').trim();
  const sortOrder = Number.isInteger(Number(body.sort_order)) ? Number(body.sort_order) : 0;
  if (!question) errors.push('question es requerido');
  if (!answer) errors.push('answer es requerido');
  return { errors, question, answer, sortOrder };
}

router.post('/faqs', requireAdmin, express.json(), asyncHandler(async (req, res) => {
  const { errors, question, answer, sortOrder } = validateFaqFields(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  const id = crypto.randomUUID();
  await db.run('INSERT INTO faqs (id, question, answer, sort_order) VALUES (?, ?, ?, ?)', id, question, answer, sortOrder);
  res.status(201).json(await db.get('SELECT * FROM faqs WHERE id = ?', id));
}));

router.put('/faqs/:id', requireAdmin, express.json(), asyncHandler(async (req, res) => {
  const existing = await db.get('SELECT id FROM faqs WHERE id = ?', req.params.id);
  if (!existing) return res.status(404).json({ error: 'FAQ no encontrada' });

  const { errors, question, answer, sortOrder } = validateFaqFields(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  await db.run('UPDATE faqs SET question=?, answer=?, sort_order=? WHERE id=?', question, answer, sortOrder, req.params.id);
  res.json(await db.get('SELECT * FROM faqs WHERE id = ?', req.params.id));
}));

router.delete('/faqs/:id', requireAdmin, asyncHandler(async (req, res) => {
  const existing = await db.get('SELECT id FROM faqs WHERE id = ?', req.params.id);
  if (!existing) return res.status(404).json({ error: 'FAQ no encontrada' });
  await db.run('DELETE FROM faqs WHERE id = ?', req.params.id);
  res.json({ ok: true });
}));

/* ===== Pedidos por WhatsApp (intención de compra, no venta confirmada) ===== */
router.get('/orders/stats', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await db.all('SELECT items FROM orders');
  const counts = new Map();

  for (const row of rows) {
    let items;
    try { items = JSON.parse(row.items); } catch (e) { continue; }
    const seenInThisOrder = new Set();
    for (const item of items) {
      if (!item?.id || seenInThisOrder.has(item.id)) continue; // "veces pedido" = # de pedidos distintos, no # de líneas
      seenInThisOrder.add(item.id);
      const existing = counts.get(item.id);
      if (existing) existing.count += 1;
      else counts.set(item.id, { id: item.id, type: item.type, color: item.color, count: 1 });
    }
  }

  const ranked = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10);
  const withImage = [];
  for (const r of ranked) {
    const product = await db.get('SELECT image FROM products WHERE id = ?', r.id);
    withImage.push({ ...r, image: product ? `${R2_PUBLIC_URL}/${product.image}` : null });
  }
  res.json(withImage);
}));

router.get('/orders', requireAdmin, asyncHandler(async (req, res) => {
  const rows = await db.all('SELECT id, items, created_at FROM orders ORDER BY created_at DESC LIMIT 50');
  res.json(rows.map((r) => ({ id: r.id, items: JSON.parse(r.items), created_at: r.created_at })));
}));

module.exports = router;
