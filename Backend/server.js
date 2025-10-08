const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const categoriasRouter = require('./routes/categorias');
const etiquetasRouter = require('./routes/etiquetas');
const productosRouter = require('./routes/productos');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend static files (assumes your frontend public folder is ../public relative to this backend)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/categorias', categoriasRouter);
app.use('/api/etiquetas', etiquetasRouter);
app.use('/api/productos', productosRouter);
app.use('/api/auth', authRouter);

// Fallback to index.html for SPA or simple frontend navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
