import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Location } from './entities/location.entity';
import { GeorefService } from '../../infrastructure/georef/georef.service';

@Injectable()
export class LocationsService {
    private readonly logger = new Logger(LocationsService.name);

    constructor(
        @InjectRepository(Location)
        private repo: Repository<Location>,
        private georefService: GeorefService,
    ) { }

    async search(query: string) {
        if (!query || query.length < 3) return []; // Minimum 3 chars to search

        return this.repo.find({
            where: [
                { locality: ILike(`%${query}%`) },
                { province: ILike(`%${query}%`) }
            ],
            take: 10,
            order: { locality: 'ASC' }
        });
    }

    async seed() {
        this.logger.log('Starting seed from API...');
        const localities = await this.georefService.fetchAllLocalities(5000);
        this.logger.log(`Found ${localities.length} localities. Upserting...`);

        let count = 0;
        for (const loc of localities) {
            await this.repo.createQueryBuilder()
                .insert()
                .into(Location)
                .values({
                    country: 'Argentina',
                    province: loc.provincia.nombre,
                    locality: loc.nombre,
                    georefId: loc.id,
                    lat: loc.centroide.lat,
                    lon: loc.centroide.lon,
                })
                .orUpdate(
                    ['lat', 'lon', 'province', 'locality'],
                    ['georef_id']
                )
                .execute();
            count++;
        }

        // Fix Geometry
        await this.repo.query(`
            UPDATE locations 
            SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography 
            WHERE geom IS NULL
        `);

        this.logger.log(`Seeded ${count} locations.`);
        return { count, message: 'Seeding complete' };
    }
}
