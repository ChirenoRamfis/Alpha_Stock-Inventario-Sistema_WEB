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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'login.html'));
});


// Servir archivos del frontend
app.use(express.static(path.join(__dirname, '../Frontend')));


// Iniciar el servidor
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
