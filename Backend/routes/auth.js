const express = require('express');
const router = express.Router();
const db = require('../db');

// Simple login (password stored in plaintext as requested)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  db.get('SELECT id, username FROM usuarios WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    // Basic session-less response: send user data
    res.json({ id: user.id, username: user.username });
  });
});
module.exports = router;
