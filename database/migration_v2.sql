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

-- 3. Achievements table
CREATE TABLE IF NOT EXISTS logros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(10),
  recompensa_pts INT NOT NULL DEFAULT 0,
  condicion VARCHAR(100) NOT NULL,
  valor_objetivo INT NOT NULL DEFAULT 1
);

-- 4. User achievements unlocked
CREATE TABLE IF NOT EXISTS usuario_logros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  logro_id INT NOT NULL,
  desbloqueado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_usuario_logro (usuario_id, logro_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (logro_id) REFERENCES logros(id) ON DELETE CASCADE
);

-- 5. Daily rewards definition table
CREATE TABLE IF NOT EXISTS recompensas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(20) NOT NULL DEFAULT 'diaria',
  moneda_lobby INT NOT NULL DEFAULT 0,
  requisito VARCHAR(100),
  dias_intervalo INT NOT NULL DEFAULT 1
);

-- 6. Reward history (per user, per day)
CREATE TABLE IF NOT EXISTS historial_recompensas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  recompensa_id INT NOT NULL,
  fecha_reclamada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (recompensa_id) REFERENCES recompensas(id) ON DELETE CASCADE
);

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
