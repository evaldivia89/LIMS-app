const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  res.json({ message: 'Create order endpoint coming next' });
});

module.exports = router;
