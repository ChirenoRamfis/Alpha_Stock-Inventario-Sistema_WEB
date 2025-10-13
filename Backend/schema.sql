-- Activar llaves foráneas
PRAGMA foreign_keys = ON;

-- TABLA DE USUARIOS (login simple)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    pregunta_seguridad TEXT,
    respuesta_seguridad TEXT
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
    cantidad INTEGER DEFAULT 1,
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
INSERT INTO usuarios(username, password, pregunta_seguridad, respuesta_seguridad)
VALUES ('admin', '1234','¿Como usted se llama?','Carolina');


