const express = require('express');
const router = express.Router();
const { requireLogin, requireManager } = require('../middlewares/auth');

// GET /settings - Redirect to users settings
router.get('/', requireLogin, requireManager, (req, res) => {
  res.redirect('/users');
});

module.exports = router;
