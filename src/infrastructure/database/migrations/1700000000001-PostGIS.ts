import { MigrationInterface, QueryRunner } from "typeorm";

export class PostGIS1700000000001 implements MigrationInterface {
    name = 'PostGIS1700000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS postgis;

            ALTER TABLE locations
            ADD COLUMN IF NOT EXISTS geom geography(Point,4326);

            -- Update existing locations (if any)
            UPDATE locations
            SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
            WHERE geom IS NULL;

            ALTER TABLE profiles
            ADD COLUMN IF NOT EXISTS geom geography(Point,4326);

            CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);
            CREATE INDEX IF NOT EXISTS idx_profiles_geom ON profiles USING GIST (geom);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_profiles_geom;
            DROP INDEX IF EXISTS idx_locations_geom;
            ALTER TABLE profiles DROP COLUMN IF EXISTS geom;
            ALTER TABLE locations DROP COLUMN IF EXISTS geom;
        `);
    }
}
