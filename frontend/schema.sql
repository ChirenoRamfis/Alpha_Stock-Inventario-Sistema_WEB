-- Activar llaves foráneas
PRAGMA foreign_keys = ON;

-- TABLA DE USUARIOS (login simple)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- TABLA DE CATEGORÍAS
CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
);

-- TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL,
    categoria_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
);

-- TABLA DE ETIQUETAS
CREATE TABLE IF NOT EXISTS etiquetas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
);

-- RELACIÓN PRODUCTOS <-> ETIQUETAS (muchos a muchos)
CREATE TABLE IF NOT EXISTS producto_etiqueta (
    producto_id INTEGER NOT NULL,
    etiqueta_id INTEGER NOT NULL,
    PRIMARY KEY (producto_id, etiqueta_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
);

-- ==============================================
-- DATOS DE PRUEBA
-- ==============================================

-- Usuario inicial
INSERT INTO usuarios(username, password)
VALUES ('admin', '1234');

-- Categorías
INSERT INTO categorias(nombre) VALUES ('Electrónica');
INSERT INTO categorias(nombre) VALUES ('Ropa');

-- Productos
INSERT INTO productos(nombre, descripcion, precio, categoria_id)
VALUES ('Laptop', 'Laptop de 15 pulgadas', 800.00, 1);

INSERT INTO productos(nombre, descripcion, precio, categoria_id)
VALUES ('Camiseta', 'Camiseta de algodón talla M', 15.00, 2);

-- Etiquetas
INSERT INTO etiquetas(nombre) VALUES ('Oferta');
INSERT INTO etiquetas(nombre) VALUES ('Nuevo');
INSERT INTO etiquetas(nombre) VALUES ('Popular');

-- Relación producto-etiqueta
-- Laptop con etiquetas "Nuevo" y "Popular"
INSERT INTO producto_etiqueta(producto_id, etiqueta_id) VALUES (1, 2);
INSERT INTO producto_etiqueta(producto_id, etiqueta_id) VALUES (1, 3);

-- Camiseta con etiqueta "Oferta"
INSERT INTO producto_etiqueta(producto_id, etiqueta_id) VALUES (2, 1);
