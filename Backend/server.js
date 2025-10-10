const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para leer JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Conexión a la base de datos
const db = new sqlite3.Database('inventario.db', (err) => {
  if (err) console.error('Error al conectar con la base de datos:', err.message);
  else console.log('✅ Conectado a la base de datos SQLite.');
});

// Ruta de login real
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });

  const sql = 'SELECT * FROM usuarios WHERE username = ? AND password = ?';
  db.get(sql, [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos.' });
    if (!row) return res.status(401).json({ error: 'Credenciales incorrectas.' });
    
    res.json({ success: true, message: `Bienvenido ${row.username}` });
  });
});

// ==========================
// Recuperar contraseña
// ==========================

// Obtener pregunta de seguridad por usuario
app.post('/get-question', (req, res) => {
  const { username } = req.body;

  if (!username)
    return res.status(400).json({ error: 'Falta el nombre de usuario.' });

  const sql = 'SELECT pregunta_seguridad FROM usuarios WHERE username = ?';
  db.get(sql, [username], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos.' });
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ question: row.pregunta_seguridad });
  });
});

// Cambiar contraseña
app.post('/recover-password', (req, res) => {
  const { username, securityAnswer, newPassword } = req.body;

  if (!username || !securityAnswer || !newPassword)
    return res.status(400).json({ error: 'Datos incompletos.' });

  const sql = 'SELECT respuesta_seguridad FROM usuarios WHERE username = ?';
  db.get(sql, [username], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error en la base de datos.' });
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado.' });

    if (row.respuesta_seguridad.toLowerCase() !== securityAnswer.toLowerCase()) {
      return res.status(401).json({ error: 'Respuesta incorrecta.' });
    }

    const updateSql = 'UPDATE usuarios SET password = ? WHERE username = ?';
    db.run(updateSql, [newPassword, username], function (updateErr) {
      if (updateErr) return res.status(500).json({ error: 'Error al actualizar contraseña.' });
      res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
    });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'login.html'));
});


// Servir archivos del frontend
app.use(express.static(path.join(__dirname, '../Frontend')));


// Iniciar el servidor
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
