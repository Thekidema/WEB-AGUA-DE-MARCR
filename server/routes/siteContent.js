const express = require('express');
const db = require('../db');

const router = express.Router();

/* whitelist explícito de keys — nunca SELECT * FROM settings.
   Si se agregan faqs/testimonials más adelante, se suman acá como
   secciones propias, no como filas de settings. */
router.get('/', (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key IN ('whatsapp', 'instagram')").all();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json({
    whatsapp: settings.whatsapp || '',
    instagram: settings.instagram || '',
  });
});

module.exports = router;
