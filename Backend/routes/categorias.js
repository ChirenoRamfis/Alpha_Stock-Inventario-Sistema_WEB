const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all categorias
router.get('/', (req, res) => {
  db.all('SELECT * FROM categorias ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create categoria
router.post('/', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre required' });
  db.run('INSERT INTO categorias(nombre) VALUES (?)', [nombre], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nombre });
  });
});

// PUT update categoria
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  db.run('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ id: Number(id), nombre });
  });
});

// DELETE categoria
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM categorias WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found or restricted by FK' });
    res.json({ deletedId: Number(id) });
  });
});

module.exports = router;
