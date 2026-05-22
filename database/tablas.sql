-- ============================================
-- BASE DE DATOS: MONOPOLY CASINO Y TAPAS
-- ============================================

DROP DATABASE IF EXISTS monopoly_db;
CREATE DATABASE monopoly_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE monopoly_db;

-- ==================================
-- USUARIOS Y PERFIL
-- ==================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(100) DEFAULT 'default',
    color VARCHAR(20) DEFAULT 'bg-red-500',
    elo INT DEFAULT 1000,
    moneda_lobby INT DEFAULT 0,
    gemas INT DEFAULT 0,
    nivel INT DEFAULT 1,
    experiencia INT DEFAULT 0,
    partidas_jugadas INT DEFAULT 0,
    partidas_ganadas INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    tiempo_jugado_minutos INT NOT NULL DEFAULT 0,
    racha_actual INT NOT NULL DEFAULT 0,
    mejor_racha INT NOT NULL DEFAULT 0,
    es_admin TINYINT(1) NOT NULL DEFAULT 0,
    two_factor_secret VARCHAR(255) NULL,
    two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
    ultimo_login TIMESTAMP NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_elo (elo)
) ENGINE=InnoDB;

-- ==================================
-- CASILLAS DEL TABLERO
-- ==================================

CREATE TABLE casillas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    posicion INT NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM(
    'SALIDA',
    'PROPIEDAD',
    'SUERTE',
    'COMUNIDAD',
    'CASINO',
    'CARCEL',
    'IR_CARCEL',
    'IMPUESTO',
    'ESTACION',
    'COMPANIA',
    'LOTERIA',
    'SERVICIOS'
    ) NOT NULL,
    descripcion TEXT,
    INDEX idx_posicion (posicion),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB;

-- ==================================
-- PROPIEDADES (LIGADAS A CASILLAS)
-- ==================================

CREATE TABLE propiedades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    casilla_id INT NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    precio INT NOT NULL,
    alquiler_base INT NOT NULL,
    alquiler_nivel_1 INT,
    alquiler_nivel_2 INT,
    alquiler_nivel_3 INT,
    alquiler_nivel_4 INT,
    alquiler_hotel INT,
    precio_mejora INT,
    color_grupo VARCHAR(50),
    FOREIGN KEY (casilla_id) REFERENCES casillas(id) ON DELETE CASCADE,
    INDEX idx_precio (precio),
    INDEX idx_color_grupo (color_grupo)
) ENGINE=InnoDB;

-- ==================================
-- TIENDA E INVENTARIO
-- ==================================

CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio INT NOT NULL,
    moneda ENUM('moneda_lobby', 'gemas') DEFAULT 'moneda_lobby',
    categoria ENUM('avatar', 'tema', 'power_up', 'otros') DEFAULT 'otros',
    rareza ENUM('comun', 'raro', 'epico', 'legendario') DEFAULT 'comun',
    preview VARCHAR(255),
    disponible BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_rareza (rareza),
    INDEX idx_disponible (disponible)
) ENGINE=InnoDB;

CREATE TABLE inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT DEFAULT 1,
    equipado BOOLEAN DEFAULT FALSE,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_producto (usuario_id, producto_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_equipado (equipado)
) ENGINE=InnoDB;

-- ==================================
-- RECOMPENSAS
-- ==================================

CREATE TABLE recompensas (
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

CREATE TABLE historial_recompensas (
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

-- ==================================
-- PARTIDAS
-- ==================================

CREATE TABLE partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_partida VARCHAR(20) UNIQUE,
    estado ENUM('esperando', 'en_curso', 'finalizada', 'cancelada') DEFAULT 'esperando',
    turno_actual INT DEFAULT 1,
    jugador_turno_id INT,
    ronda_actual INT DEFAULT 1,
    max_jugadores INT DEFAULT 4,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    ganador_id INT,
    FOREIGN KEY (ganador_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (jugador_turno_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_codigo (codigo_partida),
    INDEX idx_estado (estado),
    INDEX idx_fecha_inicio (fecha_inicio)
) ENGINE=InnoDB;

CREATE TABLE partida_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partida_id INT NOT NULL,
    usuario_id INT NOT NULL,
    orden_juego INT NOT NULL,
    posicion_actual INT DEFAULT 0,
    dinero_actual INT DEFAULT 1500,
    turnos_carcel INT DEFAULT 0,
    posicion_final INT,
    elo_ganado INT DEFAULT 0,
    moneda_ganada INT DEFAULT 0,
    experiencia_ganada INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_partida_usuario (partida_id, usuario_id),
    INDEX idx_partida (partida_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_orden (orden_juego)
) ENGINE=InnoDB;

-- ==================================
-- PROPIEDADES DURANTE LA PARTIDA
-- ==================================

CREATE TABLE propiedades_partida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partida_id INT NOT NULL,
    propiedad_id INT NOT NULL,
    propietario_id INT,
    nivel INT DEFAULT 0,
    hipotecada BOOLEAN DEFAULT FALSE,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
    FOREIGN KEY (propiedad_id) REFERENCES propiedades(id) ON DELETE CASCADE,
    FOREIGN KEY (propietario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    UNIQUE KEY unique_partida_propiedad (partida_id, propiedad_id),
    INDEX idx_partida (partida_id),
    INDEX idx_propietario (propietario_id)
) ENGINE=InnoDB;

-- ==================================
-- CARTAS (SUERTE / COMUNIDAD)
-- ==================================

CREATE TABLE cartas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('SUERTE', 'COMUNIDAD') NOT NULL,
    descripcion TEXT NOT NULL,
    efecto ENUM('ganar_dinero', 'perder_dinero', 'mover_posicion', 'ir_carcel', 'salir_carcel', 'pagar_jugadores', 'cobrar_jugadores') NOT NULL,
    valor INT DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    INDEX idx_tipo (tipo),
    INDEX idx_activa (activa)
) ENGINE=InnoDB;

-- ==================================
-- CASINOS Y JUEGOS
-- ==================================

CREATE TABLE casinos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    casilla_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    FOREIGN KEY (casilla_id) REFERENCES casillas(id) ON DELETE CASCADE,
    INDEX idx_casilla (casilla_id)
) ENGINE=InnoDB;

CREATE TABLE juegos_casino (
    id INT AUTO_INCREMENT PRIMARY KEY,
    casino_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('ruleta', 'dados', 'cartas', 'slots') NOT NULL,
    apuesta_minima INT DEFAULT 10,
    apuesta_maxima INT DEFAULT 1000,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (casino_id) REFERENCES casinos(id) ON DELETE CASCADE,
    INDEX idx_casino (casino_id),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB;

-- ==================================
-- HISTORIAL DE JUGADAS EN CASINO
-- ==================================

CREATE TABLE historial_casino (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partida_id INT NOT NULL,
    usuario_id INT NOT NULL,
    juego_id INT NOT NULL,
    apuesta INT NOT NULL,
    resultado ENUM('ganado', 'perdido') NOT NULL,
    ganancia INT DEFAULT 0,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (juego_id) REFERENCES juegos_casino(id) ON DELETE CASCADE,
    INDEX idx_partida (partida_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- ==================================
-- LOGROS (ACHIEVEMENTS)
-- ==================================

CREATE TABLE logros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(10),
    recompensa_pts INT NOT NULL DEFAULT 0,
    condicion VARCHAR(100) NOT NULL,
    valor_objetivo INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE usuario_logros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    logro_id INT NOT NULL,
    desbloqueado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_usuario_logro (usuario_id, logro_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (logro_id) REFERENCES logros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO casillas (posicion, nombre, tipo) VALUES
(0, 'SALIDA', 'SALIDA'),
(1, 'San José', 'PROPIEDAD'),
(2, 'Caja de Comunidad', 'COMUNIDAD'),
(3, 'Juan Ramón Jiménez', 'PROPIEDAD'),
(4, 'Impuesto sobre el Lujo', 'IMPUESTO'),
(5, 'Tram Metropolitano 1', 'ESTACION'),
(6, 'Perú', 'PROPIEDAD'),
(7, 'Suerte', 'SUERTE'),
(8, 'Nueva', 'PROPIEDAD'),
(9, 'Pintor Picasso', 'PROPIEDAD'),
(10, 'Cárcel', 'CARCEL'),
(11, 'Calle de la Plata', 'PROPIEDAD'),
(12, 'Iberdrola', 'COMPANIA'),
(13, 'Calle del Bronze', 'PROPIEDAD'),
(14, 'Calle de Alicante', 'PROPIEDAD'),
(15, 'Tram Metropolitano 2', 'ESTACION'),
(16, 'Calle de Castelar', 'PROPIEDAD'),
(17, 'Caja de Comunidad', 'COMUNIDAD'),
(18, 'Calle Relleu', 'PROPIEDAD'),
(19, 'Calle de los Postigos', 'PROPIEDAD'),
(20, 'Casino Central', 'CASINO'),
(21, 'San Nicolás', 'PROPIEDAD'),
(22, 'Suerte', 'SUERTE'),
(23, 'Av Juan Bautista La Folra', 'PROPIEDAD'),
(24, 'El Puerto', 'PROPIEDAD'),
(25, 'Tram Metropolitano 3', 'ESTACION'),
(26, 'Alfonso el Sabio', 'PROPIEDAD'),
(27, 'Av Federico Soto', 'PROPIEDAD'),
(28, 'Aquaservice', 'COMPANIA'),
(29, 'Canalejas', 'PROPIEDAD'),
(30, 'Vaya a la Cárcel', 'IR_CARCEL'),
(31, 'Costa Blanca', 'PROPIEDAD'),
(32, 'Av Oviedo', 'PROPIEDAD'),
(33, 'Caja de Comunidad', 'COMUNIDAD'),
(34, 'Av Mrto José Garberí', 'PROPIEDAD'),
(35, 'Tram Metropolitano 4', 'ESTACION'),
(36, 'Suerte', 'SUERTE'),
(37, 'Camino del Faro', 'PROPIEDAD'),
(38, 'Impuesto sobre el Patrimonio', 'IMPUESTO'),
(39, 'Calle de la Dorada', 'PROPIEDAD');

INSERT INTO propiedades (casilla_id, nombre, precio, alquiler_base, alquiler_nivel_1, alquiler_nivel_2, alquiler_nivel_3, alquiler_nivel_4, alquiler_hotel, precio_mejora, color_grupo) VALUES
-- LILA
((SELECT id FROM casillas WHERE posicion = 1), 'San José', 60, 2, 10, 30, 90, 160, 250, 50, 'Lila'),
((SELECT id FROM casillas WHERE posicion = 3), 'Juan Ramón Jiménez', 60, 4, 20, 60, 180, 320, 450, 50, 'Lila'),
-- AZUL CLARO
((SELECT id FROM casillas WHERE posicion = 6), 'Perú', 100, 6, 30, 90, 270, 400, 550, 50, 'Azul Claro'),
((SELECT id FROM casillas WHERE posicion = 8), 'Nueva', 100, 6, 30, 90, 270, 400, 550, 50, 'Azul Claro'),
((SELECT id FROM casillas WHERE posicion = 9), 'Pintor Picasso', 120, 8, 40, 100, 300, 450, 600, 50, 'Azul Claro'),
-- ROSA
((SELECT id FROM casillas WHERE posicion = 11), 'Calle de la Plata', 140, 10, 50, 150, 450, 625, 750, 100, 'Rosa'),
((SELECT id FROM casillas WHERE posicion = 13), 'Calle del Bronze', 140, 10, 50, 150, 450, 625, 750, 100, 'Rosa'),
((SELECT id FROM casillas WHERE posicion = 14), 'Calle de Alicante', 160, 12, 60, 180, 500, 700, 900, 100, 'Rosa'),
-- BLANCO
((SELECT id FROM casillas WHERE posicion = 16), 'Calle de Castelar', 180, 14, 70, 200, 550, 750, 950, 100, 'Blanco'),
((SELECT id FROM casillas WHERE posicion = 18), 'Calle Relleu', 180, 14, 70, 200, 550, 750, 950, 100, 'Blanco'),
((SELECT id FROM casillas WHERE posicion = 19), 'Calle de los Postigos', 200, 16, 80, 220, 600, 800, 1000, 100, 'Blanco'),
-- ROJO
((SELECT id FROM casillas WHERE posicion = 21), 'San Nicolás', 220, 18, 90, 250, 700, 875, 1050, 150, 'Rojo'),
((SELECT id FROM casillas WHERE posicion = 23), 'Av Juan Bautista La Folra', 220, 18, 90, 250, 700, 875, 1050, 150, 'Rojo'),
((SELECT id FROM casillas WHERE posicion = 24), 'El Puerto', 240, 20, 100, 300, 750, 925, 1100, 150, 'Rojo'),
-- AMARILLO
((SELECT id FROM casillas WHERE posicion = 26), 'Alfonso el Sabio', 260, 22, 110, 330, 800, 975, 1150, 150, 'Amarillo'),
((SELECT id FROM casillas WHERE posicion = 27), 'Av Federico Soto', 260, 22, 110, 330, 800, 975, 1150, 150, 'Amarillo'),
((SELECT id FROM casillas WHERE posicion = 29), 'Canalejas', 280, 24, 120, 360, 850, 1025, 1200, 150, 'Amarillo'),
-- VERDE
((SELECT id FROM casillas WHERE posicion = 31), 'Costa Blanca', 300, 26, 130, 390, 900, 1100, 1275, 200, 'Verde'),
((SELECT id FROM casillas WHERE posicion = 32), 'Av Oviedo', 300, 26, 130, 390, 900, 1100, 1275, 200, 'Verde'),
((SELECT id FROM casillas WHERE posicion = 34), 'Av Mrto José Garberí', 320, 28, 150, 450, 1000, 1200, 1400, 200, 'Verde'),
-- AZUL OSCURO
((SELECT id FROM casillas WHERE posicion = 37), 'Camino del Faro', 350, 35, 175, 500, 1100, 1300, 1500, 200, 'Azul Oscuro'),
((SELECT id FROM casillas WHERE posicion = 39), 'Calle de la Dorada', 400, 50, 200, 600, 1400, 1700, 2000, 200, 'Azul Oscuro'),
-- ESTACIONES (TRAMS) - El alquiler base es 25, y sube por número de estaciones poseídas
((SELECT id FROM casillas WHERE posicion = 5), 'Tram Metropolitano 1', 200, 25, 50, 100, 200, NULL, NULL, NULL, 'Estacion'),
((SELECT id FROM casillas WHERE posicion = 15), 'Tram Metropolitano 2', 200, 25, 50, 100, 200, NULL, NULL, NULL, 'Estacion'),
((SELECT id FROM casillas WHERE posicion = 25), 'Tram Metropolitano 3', 200, 25, 50, 100, 200, NULL, NULL, NULL, 'Estacion'),
((SELECT id FROM casillas WHERE posicion = 35), 'Tram Metropolitano 4', 200, 25, 50, 100, 200, NULL, NULL, NULL, 'Estacion'),
-- SERVICIOS (Multiplicadores)
((SELECT id FROM casillas WHERE posicion = 12), 'Iberdrola', 150, 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Servicios'),
((SELECT id FROM casillas WHERE posicion = 28), 'Aquaservice', 150, 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Servicios');

INSERT INTO cartas (tipo, descripcion, efecto, valor) VALUES
('COMUNIDAD', 'Bono de Navidad: La empresa te adelanta una nómina por las fiestas. ¡Corre a por un buen jamón! - Ganas 50 ₧', 'ganar_dinero', 50),
('COMUNIDAD', 'Ayuda del Amigo: Tu colega el fontanero te hace un favor: te legaliza una obra sin licencia. - Ganas 50 ₧', 'ganar_dinero', 50),
('COMUNIDAD', 'Lotería de El Gordo: Te ha tocado el reintegro. No es mucho, pero da para un chato de vino y unas bravas. - Ganas 100 ₧', 'ganar_dinero', 100),
('COMUNIDAD', 'Fondos Europeos: Recibes una subvención inesperada para digitalizar tu negocio de churros. - Ganas 120 ₧', 'ganar_dinero', 120),
('COMUNIDAD', 'Plusvalía Inesperada: Vendes un piso que heredaste. El mercado inmobiliario ha hecho el resto. - Ganas 100 ₧', 'ganar_dinero', 100),
('COMUNIDAD', 'Promoción Interna: Te ascienden en el trabajo porque la jefa es prima de tu cuñado. - Ganas 400 ₧', 'ganar_dinero', 400),
('COMUNIDAD', 'Errores del Banco: El cajero automático se ha vuelto loco y te ingresa 250 ₧ de más. ¡Cállate y corre! - Ganas 250 ₧', 'ganar_dinero', 250),
('COMUNIDAD', 'Herencia del Tío Paco: Tu tío lejano de Albacete, del que no sabías nada, te deja un pequeño solar. - Ganas 200 ₧', 'ganar_dinero', 200),
('COMUNIDAD', '"Maletín" Político: Encuentras un maletín olvidado en un parking de un congreso. Discreción, por favor. - Ganas 150 ₧', 'ganar_dinero', 150),
('COMUNIDAD', 'Derechos de Imagen: Descubren que tu cara sale en un meme viral de Internet. Cobras los derechos. - Ganas 50 ₧', 'ganar_dinero', 50),
('COMUNIDAD', 'Tapa de la Semana: Tu bar de tapas recibe un premio. Recibes 50 ₧ de cada jugador por tu receta secreta.', 'cobrar_jugadores', 50),
('COMUNIDAD', 'Cátedra Universitaria: Te han concedido el bono cultural. - Ganas 100 ₧', 'ganar_dinero', 100),
('COMUNIDAD', 'Indulto: Te perdonan una multa de tráfico por un defecto de forma en el formulario. - Ganas 0 pts', 'ganar_dinero', 0),
('COMUNIDAD', 'Black Friday: Encuentras una ganga de pisos a reformar en la costa. Véndela con sobreprecio. - Ganas 250 ₧', 'ganar_dinero', 250),
('COMUNIDAD', 'Cena de Empresa: Tu jefe paga la cuenta y, de propina, te da 100 ₧ para el taxi. - Ganas 100 ₧', 'ganar_dinero', 100),
('COMUNIDAD', 'Venta de Tierras: Vendes unos terrenos rústicos que se convierten en urbanizables por arte de magia. - Ganas 100 ₧', 'ganar_dinero', 100),
('COMUNIDAD', 'La Abuela Interviene: Tu abuela te ingresa dinero para que no te falte nada al ver tu piso vacío. - Ganas 50 ₧', 'ganar_dinero', 50),
('COMUNIDAD', 'Influencer Digital: Consigues un patrocinio fugaz para promocionar un producto de dudosa calidad. - Ganas 50 ₧', 'ganar_dinero', 50),
('COMUNIDAD', 'Error en la Renta: Hacienda se equivoca a tu favor y te devuelve más de lo que esperabas. - Ganas 20 ₧', 'ganar_dinero', 20),
('COMUNIDAD', 'Bote de las Carreras: Ganas el bote en las carreras de caballos. ¡A celebrarlo con marisco! - Ganas 10 ₧', 'ganar_dinero', 10),
('SUERTE', 'IVA Impagado: Hacienda te pilla intentando ahorrarte el IVA de unas facturas. ¡A pagar! - Pagas 50 ₧', 'perder_dinero', 50),
('SUERTE', 'Aviso de Desahucio: Tienes que pagar el alquiler de una propiedad que tenías ocupada ilegalmente. - Pagas 100 ₧', 'perder_dinero', 100),
('SUERTE', 'Multa de Tráfico: Te llega una multa de radar. Ibas a 140 km/h y te la notifica Correos un mes tarde. - Pagas 50 ₧', 'perder_dinero', 50),
('SUERTE', 'Derrama Vecinal: Los vecinos te obligan a pagar la derrama por un nuevo ascensor de lujo. - Pagas 70 ₧', 'perder_dinero', 70),
('SUERTE', 'Inspección Laboral: Te detectan a un empleado "en negro" limpiando la escalera. Paga la sanción. - Pagas 100 ₧', 'perder_dinero', 100),
('SUERTE', 'Impuesto al Sol: Te multan por no declarar los paneles solares que pusiste en el balcón. - Pagas 20 ₧', 'perder_dinero', 20),
('SUERTE', 'Gasto Boda Gitana: Tienes que pagar el traje de boda a tu sobrino. El banquete ya es cosa del suegro. - Pagas 100 ₧', 'perder_dinero', 100),
('SUERTE', 'Impuesto de Patrimonio: Tienes demasiadas propiedades. Hacienda te recuerda que eres rico. - Pagas 100 ₧', 'perder_dinero', 100),
('SUERTE', 'Crisis Hipotecaria: Tu banco te sube la hipoteca al doble por la subida del Euribor. - Pagas 80 ₧', 'perder_dinero', 80),
('SUERTE', 'Regreso del Político: El político del maletín ha venido a recuperar lo suyo. Paga el doble. - Pagas 50 ₧', 'perder_dinero', 50),
('SUERTE', 'Impuesto de Turismo: Los turistas han llenado tanto tu zona que te cobran un "Impuesto de Masificación". - Pagas 100 ₧', 'perder_dinero', 100),
('SUERTE', 'Cena de Fianza: Estás en el restaurante y te toca pagar la fianza del grupo porque se han dejado la cartera. - Pagas 60 ₧', 'perder_dinero', 60),
('SUERTE', 'ITV Negativa: Tu coche no pasa la ITV por décima vez. Tienes que pagar la multa y la reparación. - Pagas 90 ₧', 'perder_dinero', 90),
('SUERTE', 'Gastos Notariales: El notario te cobra por la tinta y por respirar en su oficina. - Pagas 100 ₧', 'perder_dinero', 100),
('SUERTE', 'Pinchazo en la Rueda: Pinchas una rueda con un clavo oxidado de una obra sin señalizar. - Pagas 50 ₧', 'perder_dinero', 50),
('SUERTE', 'Tasa de Residuos: Te cobran la tasa de reciclaje que nadie sabe para qué sirve. - Pagas 50 ₧', 'perder_dinero', 50),
('SUERTE', 'Gasto de I+D+i: Tienes que invertir en un proyecto de I+D que sabes que no va a funcionar. - Pagas 100 ₧', 'perder_dinero', 100),
('SUERTE', 'Fiesta de Nochevieja: Te toca pagar todos los canapés de la cena de fin de año y te quedas sin uvas. - Pagas 50 ₧', 'perder_dinero', 50),
('SUERTE', 'Alquiler de Casa: Paga a cada jugador 50 ₧ por cada casa/hotel que posean.', 'pagar_jugadores', 50),
('SUERTE', 'Arreglos del Pueblo: El Ayuntamiento de tu pueblo te exige pagar los arreglos de la plaza mayor. - Pagas 50 ₧', 'perder_dinero', 50);

-- ==================================
-- DATOS INICIALES: LOGROS
-- ==================================

INSERT INTO logros (nombre, descripcion, icono, recompensa_pts, condicion, valor_objetivo) VALUES
('Primera Victoria', 'Gana tu primera partida de Monopoly', '🏆', 100, 'primera_victoria', 1),
('Veterano', 'Juega 50 partidas', '🎖️', 500, 'veterano', 50),
('Racha de 5', 'Gana 5 partidas consecutivas', '🔥', 300, 'racha_5', 5),
('Racha de 10', 'Gana 10 partidas consecutivas', '💎', 1000, 'racha_10', 10),
('Millonario', 'Acumula 10.000 pts en tu cuenta', '💰', 500, 'millonario', 10000),
('Maestro del Casino', 'Acumula mas de 100 pts de casinos', '🎰', 200, 'maestro_casino', 100);

-- ==================================
-- DATOS INICIALES: RECOMPENSAS DIARIAS
-- ==================================

INSERT INTO recompensas (nombre, descripcion, tipo, moneda_lobby, requisito, dias_intervalo) VALUES
('Bono de Conexion', 'Recibe puntos por conectarte cada dia', 'diaria', 200, NULL, 1),
('Recompensa por Partida', 'Juega una partida para ganar puntos extra', 'partida', 150, 'jugar_partida', 1);