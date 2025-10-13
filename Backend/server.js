const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a la DB (ruta relativa dentro de Backend)
const db = new sqlite3.Database(path.join(__dirname, 'inventario.db'), (err) => {
  if (err) console.error('❌ Error al conectar con la base de datos:', err.message);
  else console.log('✅ Conectado a SQLite (inventario.db).');
});

// ---------------------------------
// Servir login en "/" primero
// ---------------------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/login.html'));
});

// ---------------------------------
// LOGIN (POST '/login')
// ---------------------------------
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });

  db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'Credenciales incorrectas.' });
    res.json({ success: true, username: row.username });
  });
});

// ---------------------------------
// API: CATEGORÍAS
// ---------------------------------
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categorias ORDER BY nombre', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/categories', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  db.run('INSERT INTO categorias(nombre) VALUES (?)', [nombre], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID, nombre });
  });
});

// Eliminar una categoría por ID
app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM categorias WHERE id = ?';
    db.run(sql, [id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Error al eliminar la categoría' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        res.json({ message: 'Categoría eliminada correctamente' });
    });
});


// ---------------------------------
// API: ETIQUETAS
// ---------------------------------
app.get('/api/tags', (req, res) => {
  db.all('SELECT * FROM etiquetas ORDER BY nombre', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/tags', (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  db.run('INSERT INTO etiquetas(nombre) VALUES (?)', [nombre], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID, nombre });
  });
});

// Eliminar una etiqueta por ID
app.delete('/api/tags/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM etiquetas WHERE id = ?';
    db.run(sql, [id], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Error al eliminar la etiqueta' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Etiqueta no encontrada' });
        }
        res.json({ message: 'Etiqueta eliminada correctamente' });
    });
});


// ---------------------------------
// API: PRODUCTOS (traer con categoría y etiquetas)
// ---------------------------------
app.get('/api/products', (req, res) => {
  const sql = `
    SELECT p.id, p.nombre, p.descripcion, p.precio, p.categoria_id, c.nombre AS categoria, p.created_at
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id 
    ORDER BY p.created_at DESC
  `;
  db.all(sql, [], (err, products) => {
    if (err) return res.status(500).json({ error: err.message });

    const productIds = products.map(p => p.id);
    if (productIds.length === 0) return res.json([]);

    const placeholders = productIds.map(() => '?').join(',');
    db.all(
      `
      SELECT pe.producto_id, e.id AS etiqueta_id, e.nombre AS etiqueta
      FROM producto_etiqueta pe
      JOIN etiquetas e ON pe.etiqueta_id = e.id
      WHERE pe.producto_id IN (${placeholders})
      `,
      productIds,
      (err2, tagRows) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // Mapear etiquetas por producto
        products.forEach(p => {
          p.etiquetas = tagRows.filter(t => t.producto_id === p.id).map(t => ({ id: t.etiqueta_id, nombre: t.etiqueta }));
        });

        res.json(products);
      }
    );
  });
});

app.post('/api/products', (req, res) => {
  const { nombre, descripcion, precio, categoria_id, etiquetas } = req.body;
  if (!nombre || !precio || !categoria_id) return res.status(400).json({ error: 'Campos requeridos faltantes' });

  db.run(
    'INSERT INTO productos(nombre, descripcion, precio, categoria_id) VALUES (?, ?, ?, ?)',
    [nombre, descripcion || '', precio, categoria_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const producto_id = this.lastID;

      // insertar relaciones etiquetas si vienen como array de ids
      if (Array.isArray(etiquetas) && etiquetas.length > 0) {
        const stmt = db.prepare('INSERT INTO producto_etiqueta(producto_id, etiqueta_id) VALUES (?, ?)');
        etiquetas.forEach(tagId => stmt.run(producto_id, tagId));
        stmt.finalize(err2 => {
          if (err2) console.error('Error insertando etiquetas:', err2.message);
        });
      }

      res.json({ success: true, id: producto_id });
    }
  );
});

// ==================== ELIMINAR PRODUCTO ====================
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;

  // Primero eliminar relaciones de etiquetas si existen
  db.run('DELETE FROM producto_etiqueta WHERE producto_id = ?', [id], function (err) {
    if (err) {
      console.error('Error eliminando etiquetas relacionadas:', err);
      return res.status(500).json({ error: 'Error eliminando etiquetas relacionadas' });
    }

    // Luego eliminar el producto en sí
    db.run('DELETE FROM productos WHERE id = ?', [id], function (err2) {
      if (err2) {
        console.error('Error eliminando producto:', err2);
        return res.status(500).json({ error: 'Error eliminando producto' });
      }

      // Si no existía ese producto
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      res.json({ success: true, message: 'Producto eliminado correctamente' });
    });
  });
});

// Obtener pregunta de seguridad
app.post('/get-question', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Usuario requerido.' });

  db.get('SELECT pregunta_seguridad FROM usuarios WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ question: row.pregunta_seguridad });
  });
});

// Recuperar y actualizar contraseña
app.post('/recover-password', (req, res) => {
  const { username, securityAnswer, newPassword } = req.body;
  if (!username || !securityAnswer || !newPassword)
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });

  db.get('SELECT respuesta_seguridad FROM usuarios WHERE username = ?', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (row.respuesta_seguridad !== securityAnswer) {
      return res.status(401).json({ error: 'Respuesta de seguridad incorrecta.' });
    }

    db.run('UPDATE usuarios SET password = ? WHERE username = ?', [newPassword, username], function(err2) {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
    });
  });
});


// ---------------------------------
// Servir archivos estáticos (Frontend)
// ---------------------------------
app.use(express.static(path.join(__dirname, '../Frontend')));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
