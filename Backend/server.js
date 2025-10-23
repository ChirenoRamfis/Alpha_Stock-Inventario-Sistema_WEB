// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Ajusta la carpeta static según tu estructura; dejamos lo que tenías.
// Asegúrate de que ../Frontend contenga tu index.html (o cámbialo por la ruta correcta)
app.use(express.static(path.join(__dirname, "../Frontend")));

// Abrir DB (si no existe, debes tener el .db o crear las tablas)
const db = new sqlite3.Database(
  path.join(__dirname, "inventario.db"),
  (err) => {
    if (err) return console.error("No se pudo abrir DB:", err.message);
    console.log("DB abierta correctamente");
  }
);

// Activar llaves foráneas
db.run("PRAGMA foreign_keys = ON;");

// ---------------------- Helpers para asegurar tablas básicas ----------------------
// (Si ya tienes la DB con tablas, esto no dañará nada; crea solo si no existen)
const createTablesSQL = `
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  pregunta_seguridad TEXT,
  respuesta_seguridad TEXT
);

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS etiquetas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio REAL NOT NULL DEFAULT 0,
  cantidad INTEGER NOT NULL DEFAULT 1,
  categoria_id INTEGER,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY(categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS producto_etiqueta (
  producto_id INTEGER,
  etiqueta_id INTEGER,
  PRIMARY KEY(producto_id, etiqueta_id),
  FOREIGN KEY(producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY(etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
);
`;
db.exec(createTablesSQL, (err) => {
  if (err) console.error("Error creando tablas iniciales:", err.message);
});

// ==============================================
// USUARIOS (login y recuperación) -- se mantienen
// ==============================================
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM usuarios WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row)
        return res
          .status(401)
          .json({ error: "Usuario o contraseña incorrectos" });
      res.json({ success: true, user: { id: row.id, username: row.username } });
    }
  );
});

app.post("/get-question", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Falta username" });
  db.get(
    "SELECT pregunta_seguridad FROM usuarios WHERE username = ?",
    [username],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Usuario no encontrado" });
      res.json({ question: row.pregunta_seguridad });
    }
  );
});

app.post("/recover-password", (req, res) => {
  const { username, securityAnswer, newPassword } = req.body;
  if (!username || !securityAnswer || !newPassword)
    return res.status(400).json({ error: "Faltan datos" });

  db.get(
    "SELECT * FROM usuarios WHERE username = ? AND respuesta_seguridad = ?",
    [username, securityAnswer],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Respuesta incorrecta" });

      db.run(
        "UPDATE usuarios SET password = ? WHERE id = ?",
        [newPassword, row.id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({
            success: true,
            message: "Contraseña actualizada correctamente",
          });
        }
      );
    }
  );
});

// ==============================================
// CRUD Categorías
// Rutas: GET  /api/categories
//       POST /api/categories  { nombre }
//       PUT  /api/categories/:id { nombre }
//       DELETE /api/categories/:id
// ==============================================
app.get("/api/categories", (req, res) => {
  db.all("SELECT * FROM categorias ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/categories", (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta nombre" });
  db.run("INSERT INTO categorias(nombre) VALUES(?)", [nombre], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

app.put("/api/categories/:id", (req, res) => {
  const { nombre } = req.body;
  db.run(
    "UPDATE categorias SET nombre = ? WHERE id = ?",
    [nombre, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete("/api/categories/:id", (req, res) => {
  db.run(
    "DELETE FROM categorias WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ==============================================
// CRUD Etiquetas
// Rutas: GET  /api/tags
//       POST /api/tags  { nombre }
//       PUT  /api/tags/:id { nombre }
//       DELETE /api/tags/:id
// ==============================================
app.get("/api/tags", (req, res) => {
  db.all("SELECT * FROM etiquetas ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/tags", (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta nombre" });
  db.run("INSERT INTO etiquetas(nombre) VALUES(?)", [nombre], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

app.put("/api/tags/:id", (req, res) => {
  const { nombre } = req.body;
  db.run(
    "UPDATE etiquetas SET nombre = ? WHERE id = ?",
    [nombre, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete("/api/tags/:id", (req, res) => {
  db.run("DELETE FROM etiquetas WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ==============================================
// CRUD Productos
// Rutas: GET  /api/products
//       POST /api/products  { nombre, descripcion, precio, cantidad, categoria_id, etiquetas: [id,...] }
//       PUT  /api/products/:id  { nombre, descripcion, precio, cantidad, categoria_id, etiquetas: [id,...] }
//       DELETE /api/products/:id
// ==============================================
app.get("/api/products", (req, res) => {
  const sql = `
    SELECT p.id, p.nombre, p.descripcion, p.precio, p.cantidad, p.categoria_id, p.created_at,
           c.nombre as categoria
    FROM productos p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    ORDER BY p.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const productIds = rows.map((r) => r.id);
    if (productIds.length === 0) return res.json([]);
    const placeholders = productIds.map(() => "?").join(",");
    db.all(
      `SELECT pe.producto_id, e.id, e.nombre 
       FROM producto_etiqueta pe 
       JOIN etiquetas e ON pe.etiqueta_id = e.id 
       WHERE pe.producto_id IN (${placeholders})`,
      productIds,
      (err2, tags) => {
        if (err2) return res.status(500).json({ error: err2.message });
        const result = rows.map((p) => {
          p.etiquetas = tags
            .filter((t) => t.producto_id === p.id)
            .map((t) => ({ id: t.id, nombre: t.nombre }));
          return p;
        });
        res.json(result);
      }
    );
  });
});

app.post("/api/products", (req, res) => {
  const { nombre, descripcion, precio, categoria_id, cantidad, etiquetas } =
    req.body;
  if (!nombre || precio === undefined || categoria_id === undefined)
    return res.status(400).json({ error: "Faltan datos" });

  db.run(
    `INSERT INTO productos(nombre, descripcion, precio, cantidad, categoria_id) 
     VALUES(?,?,?,?,?)`,
    [nombre, descripcion || "", precio, cantidad || 1, categoria_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const productId = this.lastID;
      if (!Array.isArray(etiquetas) || etiquetas.length === 0)
        return res.json({ success: true, id: productId });
      const stmt = db.prepare(
        "INSERT INTO producto_etiqueta(producto_id, etiqueta_id) VALUES(?,?)"
      );
      etiquetas.forEach((tagId) => stmt.run(productId, tagId));
      stmt.finalize();
      res.json({ success: true, id: productId });
    }
  );
});

app.put("/api/products/:id", (req, res) => {
  const { nombre, descripcion, precio, categoria_id, cantidad, etiquetas } =
    req.body;
  const id = req.params.id;
  db.run(
    `UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, cantidad = ?, categoria_id = ? WHERE id = ?`,
    [nombre, descripcion || "", precio, cantidad || 1, categoria_id, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      // Actualizar etiquetas: eliminar las existentes y volver a insertar
      db.run(
        "DELETE FROM producto_etiqueta WHERE producto_id = ?",
        [id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          if (!Array.isArray(etiquetas) || etiquetas.length === 0)
            return res.json({ success: true });
          const stmt = db.prepare(
            "INSERT INTO producto_etiqueta(producto_id, etiqueta_id) VALUES(?,?)"
          );
          etiquetas.forEach((tagId) => stmt.run(id, tagId));
          stmt.finalize();
          res.json({ success: true });
        }
      );
    }
  );
});

app.delete("/api/products/:id", (req, res) => {
  db.run("DELETE FROM productos WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
