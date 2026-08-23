const express = require('express');
const db = require('../db');

const router = express.Router();

/* whitelist explícito de keys — nunca SELECT * FROM settings.
   Si se agregan faqs/testimonials más adelante, se suman acá como
   secciones propias, no como filas de settings. */
router.get('/', (req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings WHERE key IN ('whatsapp', 'instagram')").all();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const faqs = db.prepare('SELECT question, answer FROM faqs ORDER BY sort_order ASC, created_at ASC').all();
  const testimonials = db.prepare('SELECT id, image, alt FROM testimonials ORDER BY sort_order ASC, created_at ASC').all()
    .map((t) => ({ ...t, image: `/assets/images/testimonials/${t.image}` }));

  res.json({
    whatsapp: settings.whatsapp || '',
    instagram: settings.instagram || '',
    faqs,
    testimonials,
  });
});

module.exports = router;
