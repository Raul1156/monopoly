-- ============================================
-- Monopoly "Casino y Tapas" Schema Migration v2
-- MySQL 8.0 compatible
-- ============================================

-- 1. New columns in usuarios (safe: ignores if already exists)
SET @dbname = 'monopoly_db';

-- Add tiempo_jugado_minutos
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'tiempo_jugado_minutos');
SET @query = IF(@col_exists = 0, 'ALTER TABLE usuarios ADD COLUMN tiempo_jugado_minutos INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add racha_actual
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'racha_actual');
SET @query = IF(@col_exists = 0, 'ALTER TABLE usuarios ADD COLUMN racha_actual INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add mejor_racha
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'mejor_racha');
SET @query = IF(@col_exists = 0, 'ALTER TABLE usuarios ADD COLUMN mejor_racha INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add es_admin
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'es_admin');
SET @query = IF(@col_exists = 0, 'ALTER TABLE usuarios ADD COLUMN es_admin TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add two_factor_secret
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'two_factor_secret');
SET @query = IF(@col_exists = 0, 'ALTER TABLE usuarios ADD COLUMN two_factor_secret VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add two_factor_enabled
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'two_factor_enabled');
SET @query = IF(@col_exists = 0, 'ALTER TABLE usuarios ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. New columns in partida_usuarios
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'partida_usuarios' AND COLUMN_NAME = 'posicion_final');
SET @query = IF(@col_exists = 0, 'ALTER TABLE partida_usuarios ADD COLUMN posicion_final INT NULL', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'partida_usuarios' AND COLUMN_NAME = 'elo_ganado');
SET @query = IF(@col_exists = 0, 'ALTER TABLE partida_usuarios ADD COLUMN elo_ganado INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'partida_usuarios' AND COLUMN_NAME = 'moneda_ganada');
SET @query = IF(@col_exists = 0, 'ALTER TABLE partida_usuarios ADD COLUMN moneda_ganada INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'partida_usuarios' AND COLUMN_NAME = 'experiencia_ganada');
SET @query = IF(@col_exists = 0, 'ALTER TABLE partida_usuarios ADD COLUMN experiencia_ganada INT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Achievements table (matches tablas.sql exactly)
CREATE TABLE IF NOT EXISTS logros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(10),
  recompensa_pts INT NOT NULL DEFAULT 0,
  condicion VARCHAR(100) NOT NULL,
  valor_objetivo INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- 4. User achievements unlocked (matches tablas.sql exactly)
CREATE TABLE IF NOT EXISTS usuario_logros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  logro_id INT NOT NULL,
  desbloqueado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_usuario_logro (usuario_id, logro_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (logro_id) REFERENCES logros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Recompensas table (matches tablas.sql exactly)
-- Drop and recreate if schema is outdated (old migration_v2 had simplified schema)
-- First check if the table exists with the wrong schema
SET @has_gemas = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recompensas' AND COLUMN_NAME = 'gemas');
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recompensas');

-- If table exists but is missing gemas column, add the missing columns
-- Add gemas
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recompensas' AND COLUMN_NAME = 'gemas');
SET @query = IF(@table_exists > 0 AND @col_exists = 0, 'ALTER TABLE recompensas ADD COLUMN gemas INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add experiencia
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recompensas' AND COLUMN_NAME = 'experiencia');
SET @query = IF(@table_exists > 0 AND @col_exists = 0, 'ALTER TABLE recompensas ADD COLUMN experiencia INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add activa
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recompensas' AND COLUMN_NAME = 'activa');
SET @query = IF(@table_exists > 0 AND @col_exists = 0, 'ALTER TABLE recompensas ADD COLUMN activa BOOLEAN DEFAULT TRUE', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add dias_intervalo (if missing)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recompensas' AND COLUMN_NAME = 'dias_intervalo');
SET @query = IF(@table_exists > 0 AND @col_exists = 0, 'ALTER TABLE recompensas ADD COLUMN dias_intervalo INT DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add requiere_partida_jugada
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recompensas' AND COLUMN_NAME = 'requiere_partida_jugada');
SET @query = IF(@table_exists > 0 AND @col_exists = 0, 'ALTER TABLE recompensas ADD COLUMN requiere_partida_jugada BOOLEAN DEFAULT FALSE', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add creado_en
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'recompensas' AND COLUMN_NAME = 'creado_en');
SET @query = IF(@table_exists > 0 AND @col_exists = 0, 'ALTER TABLE recompensas ADD COLUMN creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create table if not exists (full schema matching tablas.sql)
CREATE TABLE IF NOT EXISTS recompensas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo ENUM('diaria', 'partida', 'logro', 'evento') NOT NULL,
  moneda_lobby INT DEFAULT 0,
  gemas INT DEFAULT 0,
  experiencia INT DEFAULT 0,
  requisito VARCHAR(255),
  activa BOOLEAN DEFAULT TRUE,
  dias_intervalo INT DEFAULT 1,
  requiere_partida_jugada BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tipo (tipo),
  INDEX idx_activa (activa)
) ENGINE=InnoDB;

-- 6. Historial recompensas (matches tablas.sql exactly)
-- Fix old migration that used fecha_reclamada instead of fecha
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'historial_recompensas');
SET @old_col = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'historial_recompensas' AND COLUMN_NAME = 'fecha_reclamada');
SET @query = IF(@table_exists > 0 AND @old_col > 0, 'ALTER TABLE historial_recompensas CHANGE COLUMN fecha_reclamada fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add moneda_recibida if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'historial_recompensas' AND COLUMN_NAME = 'moneda_recibida');
SET @query = IF(@table_exists > 0 AND @col_exists = 0, 'ALTER TABLE historial_recompensas ADD COLUMN moneda_recibida INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add gemas_recibidas if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'historial_recompensas' AND COLUMN_NAME = 'gemas_recibidas');
SET @query = IF(@table_exists > 0 AND @col_exists = 0, 'ALTER TABLE historial_recompensas ADD COLUMN gemas_recibidas INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add experiencia_recibida if missing
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'historial_recompensas' AND COLUMN_NAME = 'experiencia_recibida');
SET @query = IF(@table_exists > 0 AND @col_exists = 0, 'ALTER TABLE historial_recompensas ADD COLUMN experiencia_recibida INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Create table if not exists (full schema matching tablas.sql)
CREATE TABLE IF NOT EXISTS historial_recompensas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  recompensa_id INT NOT NULL,
  moneda_recibida INT DEFAULT 0,
  gemas_recibidas INT DEFAULT 0,
  experiencia_recibida INT DEFAULT 0,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (recompensa_id) REFERENCES recompensas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA
-- ============================================

-- Initial achievements (skip if already exist)
INSERT IGNORE INTO logros (nombre, descripcion, icono, recompensa_pts, condicion, valor_objetivo) VALUES
('Primera Victoria', 'Gana tu primera partida de Monopoly', '🏆', 100, 'primera_victoria', 1),
('Veterano', 'Juega 50 partidas', '🎖️', 500, 'veterano', 50),
('Racha de 5', 'Gana 5 partidas consecutivas', '🔥', 300, 'racha_5', 5),
('Racha de 10', 'Gana 10 partidas consecutivas', '💎', 1000, 'racha_10', 10),
('Millonario', 'Acumula 10.000 pts en tu cuenta', '💰', 500, 'millonario', 10000),
('Maestro del Casino', 'Acumula mas de 100 pts de casinos', '🎰', 200, 'maestro_casino', 100);

-- Initial daily rewards (skip if already exist)
INSERT IGNORE INTO recompensas (nombre, descripcion, tipo, moneda_lobby, requisito, dias_intervalo) VALUES
('Bono de Conexion', 'Recibe puntos por conectarte cada dia', 'diaria', 200, NULL, 1),
('Recompensa por Partida', 'Juega una partida para ganar puntos extra', 'partida', 150, 'jugar_partida', 1);

-- Promote first user to admin (optional)
-- UPDATE usuarios SET es_admin = 1 WHERE id = 1;

SELECT 'Migration v2 completed successfully!' AS result;
