const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all products with category and tags
router.get('/', (req, res) => {
  const sql = `
    SELECT p.*, c.nombre as categoria_nombre
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    ORDER BY p.id DESC
  `;
  db.all(sql, [], (err, productos) => {
    if (err) return res.status(500).json({ error: err.message });
    // for each producto, fetch tags
    const tasks = productos.map(prod => {
      return new Promise((resolve, reject) => {
        db.all(`SELECT e.* FROM etiquetas e
                JOIN producto_etiqueta pe ON e.id = pe.etiqueta_id
                WHERE pe.producto_id = ?`, [prod.id], (err, tags) => {
          if (err) reject(err);
          prod.etiquetas = tags;
          resolve();
        });
      });
    });
    Promise.all(tasks)
      .then(() => res.json(productos))
      .catch(error => res.status(500).json({ error: error.message }));
  });
});

// GET single product by id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM productos WHERE id = ?', [id], (err, prod) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!prod) return res.status(404).json({ error: 'Not found' });
    db.all(`SELECT e.* FROM etiquetas e
            JOIN producto_etiqueta pe ON e.id = pe.etiqueta_id
            WHERE pe.producto_id = ?`, [id], (err, tags) => {
      if (err) return res.status(500).json({ error: err.message });
      prod.etiquetas = tags;
      res.json(prod);
    });
  });
});

// POST create producto
router.post('/', (req, res) => {
  const { nombre, descripcion, precio, categoria_id, etiqueta_ids } = req.body;
  if (!nombre || precio === undefined || !categoria_id) return res.status(400).json({ error: 'nombre, precio, categoria_id required' });
  db.run('INSERT INTO productos(nombre, descripcion, precio, categoria_id) VALUES (?, ?, ?, ?)', [nombre, descripcion || '', precio, categoria_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const newId = this.lastID;
    if (Array.isArray(etiqueta_ids) && etiqueta_ids.length) {
      const stmt = db.prepare('INSERT INTO producto_etiqueta(producto_id, etiqueta_id) VALUES (?, ?)');
      for (const eid of etiqueta_ids) stmt.run(newId, eid);
      stmt.finalize(err => {
        if (err) console.error(err);
        res.json({ id: newId, nombre });
      });
    } else {
      res.json({ id: newId, nombre });
    }
  });
});

// PUT update producto
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, categoria_id, etiqueta_ids } = req.body;
  db.run('UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, categoria_id = ? WHERE id = ?', [nombre, descripcion, precio, categoria_id, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // update tags: remove existing and insert new
    db.run('DELETE FROM producto_etiqueta WHERE producto_id = ?', [id], (err2) => {
      if (err2) console.error(err2);
      if (Array.isArray(etiqueta_ids) && etiqueta_ids.length) {
        const stmt = db.prepare('INSERT INTO producto_etiqueta(producto_id, etiqueta_id) VALUES (?, ?)');
        for (const eid of etiqueta_ids) stmt.run(id, eid);
        stmt.finalize(err => {
          if (err) console.error(err);
          res.json({ id: Number(id), nombre });
        });
      } else {
        res.json({ id: Number(id), nombre });
      }
    });
  });
});

// DELETE producto
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM productos WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deletedId: Number(id) });
  });
});

module.exports = router;
