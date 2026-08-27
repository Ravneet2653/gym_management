const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Login
router.post('/login', async (req, res) => {
  const { uname, pwd } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM login WHERE uname = ?', [uname]);
    if (!rows.length) return res.json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(pwd, rows[0].pwd);
    if (!valid) return res.json({ success: false, message: 'Invalid credentials' });
    req.session.user = { id: rows[0].id, uname: rows[0].uname };
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check session
router.get('/check', (req, res) => {
  if (req.session.user) res.json({ loggedIn: true, user: req.session.user });
  else res.json({ loggedIn: false });
});

// Register (first-time setup)
router.post('/register', async (req, res) => {
  const { uname, pwd } = req.body;
  try {
    const hash = await bcrypt.hash(pwd, 10);
    await db.query('INSERT INTO login(uname, pwd) VALUES(?,?)', [uname, hash]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
