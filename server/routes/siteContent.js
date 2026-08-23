const express = require('express');
const { db } = require('../db');
const { asyncHandler } = require('../asyncHandler');

const router = express.Router();

/* whitelist explícito de keys — nunca SELECT * FROM settings.
   Si se agregan faqs/testimonials más adelante, se suman acá como
   secciones propias, no como filas de settings. */
router.get('/', asyncHandler(async (req, res) => {
  const rows = await db.all("SELECT key, value FROM settings WHERE key IN ('whatsapp', 'instagram')");
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const faqs = await db.all('SELECT question, answer FROM faqs ORDER BY sort_order ASC, created_at ASC');

  res.json({
    whatsapp: settings.whatsapp || '',
    instagram: settings.instagram || '',
    faqs,
  });
}));

module.exports = router;
