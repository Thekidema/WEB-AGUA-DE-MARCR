const express = require('express');
const { db } = require('../db');
const { serializeProduct } = require('../productSerializer');

const router = express.Router();

router.get('/', async (req, res) => {
  const rows = await db.all('SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC');
  res.json(rows.map(serializeProduct));
});

module.exports = router;
