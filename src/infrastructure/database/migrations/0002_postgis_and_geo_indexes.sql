-- 0002_postgis_and_geo_indexes.sql

CREATE EXTENSION IF NOT EXISTS postgis;

-- Agregar columna geom a locations
ALTER TABLE locations
ADD COLUMN IF NOT EXISTS geom geography(Point,4326);

UPDATE locations
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
WHERE geom IS NULL;

-- Agregar columna geom a profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS geom geography(Point,4326);

-- Índices espaciales
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_profiles_geom ON profiles USING GIST (geom);
