import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { GeorefService } from '../infrastructure/georef/georef.service';
import { Repository } from 'typeorm';
import { Location } from '../modules/locations/entities/location.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('SeedLocations');

    try {
        const georefService = app.get(GeorefService);
        const locationRepo = app.get<Repository<Location>>(getRepositoryToken(Location));

        logger.log('Starting seed...');
        const localities = await georefService.fetchAllLocalities(5000); // 5000 max per request

        logger.log(`Found ${localities.length} localities. Upserting into DB...`);

        // Batch processing to avoid massive transaction logs if needed, but 5k is fine.
        // Georef returns: { id, nombre, provincia: { nombre }, centroide: { lat, lon } }

        let count = 0;
        for (const loc of localities) {
            // Upsert based on georef_id or unique name+province
            // Using raw query for PostGIS ST_MakePoint is easiest for geom

            await locationRepo.createQueryBuilder()
                .insert()
                .into(Location)
                .values({
                    country: 'Argentina',
                    province: loc.provincia.nombre,
                    locality: loc.nombre,
                    georefId: loc.id,
                    lat: loc.centroide.lat,
                    lon: loc.centroide.lon,
                    // geom will be handled by a trigger or we insert raw. 
                    // TypeORM values usually sanitized, so we might need a stored procedure or special transformer.
                    // However, our migration 0002 updates null geoms. So we can insert null geom and run update later 
                    // OR use 'value' with () => `ST_SetSRID...` if TypeORM supports it in insert values (it accepts strings but might quote them).
                })
                .orUpdate(
                    ['lat', 'lon'], // fields to update if exists
                    ['georef_id'] // constraint
                )
                .execute();

            count++;
        }

        // Post-seed update for Geometry
        logger.log('Updating Geometry columns...');
        await locationRepo.query(`
      UPDATE locations 
      SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography 
      WHERE geom IS NULL
    `);

        logger.log(`Seeded ${count} locations successfully.`);
    } catch (error) {
        logger.error('Seed failed', error);
    } finally {
        await app.close();
    }
}

bootstrap();
