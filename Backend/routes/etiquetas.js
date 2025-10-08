const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all etiquetas
router.get('/', (req, res) => {
  db.all('SELECT * FROM etiquetas ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create etiqueta
router.post('/', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre required' });
  db.run('INSERT INTO etiquetas(nombre) VALUES (?)', [nombre], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nombre });
  });
});

// DELETE etiqueta
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM etiquetas WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deletedId: Number(id) });
  });
});

module.exports = router;
