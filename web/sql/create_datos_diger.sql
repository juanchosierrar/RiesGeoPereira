-- ============================================================
-- TABLA: datos_diger
-- Fuente: DIGER - Dirección de Gestión del Riesgo, Pereira
-- Descripción: Registro histórico y en tiempo real de eventos
--              de riesgo en el municipio de Pereira, Risaralda.
-- ============================================================

-- 1. Eliminar tabla si ya existe (limpieza total)
DROP TABLE IF EXISTS datos_diger;

-- 2. Crear tabla desde cero
CREATE TABLE datos_diger (
    fid         INTEGER         NOT NULL PRIMARY KEY,   -- ID único del feature (DIGER)
    id          INTEGER         NOT NULL UNIQUE,        -- ID interno del sistema
    fecha       TEXT,                                   -- Fecha del evento (YYYY-MM-DD)
    evento      TEXT,                                   -- Tipo: DESLIZAMIENTO, INCENDIO, INUNDACION, VENDAVAL, SISMO, COLAPSO ESTRUCTURAL
    sector      TEXT,                                   -- Sector: 'U' = Urbano, 'R' = Rural
    comcorr     TEXT,                                   -- Comuna o Corregimiento
    barrver     TEXT,                                   -- Barrio o Vereda
    sectcomun   TEXT,                                   -- Sector específico o referencia adicional
    viv         INTEGER         DEFAULT 0,              -- Viviendas afectadas
    flia        INTEGER         DEFAULT 0,              -- Familias afectadas
    ad          INTEGER         DEFAULT 0,              -- Adultos afectados
    men         INTEGER         DEFAULT 0,              -- Menores de edad afectados
    les         INTEGER         DEFAULT 0,              -- Personas lesionadas
    fall        INTEGER         DEFAULT 0,              -- Personas fallecidas
    perm        INTEGER         DEFAULT 0,              -- Afectados permanentes
    trans       INTEGER         DEFAULT 0,              -- Afectados transitorios
    lat         DOUBLE PRECISION,                       -- Latitud geográfica (WGS84)
    lon         DOUBLE PRECISION,                       -- Longitud geográfica (WGS84)
    x           DOUBLE PRECISION,                       -- Coordenada X proyectada (MAGNA-SIRGAS / EPSG:3116)
    y           DOUBLE PRECISION,                       -- Coordenada Y proyectada (MAGNA-SIRGAS / EPSG:3116)
    indica_tim  BIGINT                                  -- Timestamp Unix en milisegundos
);

-- 3. Índices para consultas eficientes
CREATE INDEX idx_diger_evento   ON datos_diger(evento);
CREATE INDEX idx_diger_fecha    ON datos_diger(fecha);
CREATE INDEX idx_diger_comcorr  ON datos_diger(comcorr);
CREATE INDEX idx_diger_lat_lon  ON datos_diger(lat, lon);

-- 4. Comentarios documentales por columna
COMMENT ON TABLE  datos_diger          IS 'Eventos de riesgo registrados por DIGER - Pereira, Risaralda';
COMMENT ON COLUMN datos_diger.evento   IS 'DESLIZAMIENTO | INCENDIO | INUNDACION | VENDAVAL | SISMO | COLAPSO ESTRUCTURAL | OTRO';
COMMENT ON COLUMN datos_diger.sector   IS 'U = Urbano, R = Rural';
COMMENT ON COLUMN datos_diger.lat      IS 'Latitud WGS84 decimal';
COMMENT ON COLUMN datos_diger.lon      IS 'Longitud WGS84 decimal';
COMMENT ON COLUMN datos_diger.x        IS 'Coordenada X en MAGNA-SIRGAS Origen Nacional (EPSG:3116)';
COMMENT ON COLUMN datos_diger.y        IS 'Coordenada Y en MAGNA-SIRGAS Origen Nacional (EPSG:3116)';
COMMENT ON COLUMN datos_diger.indica_tim IS 'Timestamp Unix en milisegundos de la fecha del evento';

-- 5. Verificar estructura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'datos_diger'
ORDER BY ordinal_position;
