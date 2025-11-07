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
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0,
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

-- TABLA DE HISTORIAL DE VENTAS
CREATE TABLE IF NOT EXISTS ventas (
    id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_venta DATETIME NOT NULL DEFAULT (datetime('now')),
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    ganancia_total DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- TABLA DE DETALLE DE VENTAS
CREATE TABLE IF NOT EXISTS detalle_Venta (
    id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    ganancia DECIMAL(10,2) NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
    FOREIGN KEY (id_producto) REFERENCES Productos(id)
);


-- ==============================================
-- DATOS DE PRUEBA
-- ==============================================

-- Usuario inicial
INSERT INTO usuarios(username, password, pregunta_seguridad, respuesta_seguridad)
VALUES ('admin', '1234','¿Como usted se llama?','Carolina');


