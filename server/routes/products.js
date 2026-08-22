const express = require('express');
const db = require('../db');
const { serializeProduct } = require('../productSerializer');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC').all();
  res.json(rows.map(serializeProduct));
});

module.exports = router;
