// routes/tests.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, test_code, test_name
	FROM tests
	ORDER BY test_name

    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load tests' });
  }
});

module.exports = router;
