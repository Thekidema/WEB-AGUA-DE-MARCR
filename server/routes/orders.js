const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { db } = require('../db');
const { asyncHandler } = require('../asyncHandler');

const router = express.Router();

/* endpoint público (lo llama cualquier visitante al hacer checkout) —
   límite generoso para uso real, ajustado para frenar spam de datos falsas */
const ordersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados pedidos seguidos. Probá de nuevo en unos minutos.' },
});

router.post('/', ordersLimiter, express.json(), asyncHandler(async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!rawItems.length) return res.status(400).json({ error: 'items no puede estar vacío' });

  /* nunca confiar en type/color/price del cliente — se resuelven desde la
     base de datos por id, así el snapshot refleja el producto real */
  const snapshot = [];
  for (const raw of rawItems) {
    const qty = Number.isInteger(raw?.qty) && raw.qty > 0 && raw.qty < 1000 ? raw.qty : null;
    if (!raw?.id || !qty) continue;
    const product = await db.get('SELECT id, type, color, price FROM products WHERE id = ?', raw.id);
    if (!product) continue;
    snapshot.push({ id: product.id, type: product.type, color: product.color, price: product.price, qty });
  }
  if (!snapshot.length) return res.status(400).json({ error: 'Ningún producto válido en items' });

  await db.run('INSERT INTO orders (id, items) VALUES (?, ?)', crypto.randomUUID(), JSON.stringify(snapshot));
  res.status(201).json({ ok: true });
}));

module.exports = router;
