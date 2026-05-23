-- ============================================
-- MIGRACIÓN: FOTOS DE PERFIL EN LA TIENDA
-- ============================================
-- Este script inserta las fotos de perfil de la carpeta fotos-perfil
-- como productos de tipo 'avatar' en la tienda.
-- Ejecutar sobre la base de datos monopoly_db existente.

USE monopoly_db;

-- Insertar fotos de perfil como productos (avatar)
-- El campo 'preview' almacena solo el nombre del archivo.
-- Añade más INSERT por cada imagen nueva que agregues a fotos-perfil/

INSERT INTO productos (nombre, descripcion, precio, moneda, categoria, rareza, preview, disponible)
VALUES
('PSOE', 'Foto de perfil exclusiva del PSOE', 500, 'moneda_lobby', 'avatar', 'raro', 'psoe.jpg', TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);
