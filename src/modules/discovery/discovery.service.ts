import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { GetFeedDto } from './dto/get-feed.dto';

interface FeedCursor {
    lastDistance: number;
    lastUserId: string;
}

@Injectable()
export class DiscoveryService {
    constructor(
        @InjectRepository(Profile)
        private profilesRepo: Repository<Profile>,
    ) { }

    async getFeed(userId: string, dto: GetFeedDto) {
        // Basic settings if not provided
        const distanceKm = dto.distanceKm || 50;
        const limit = dto.limit || 20;

        // Decoding cursor
        let cursor: FeedCursor | null = null;
        if (dto.cursor) {
            const decoded = Buffer.from(dto.cursor, 'base64').toString('ascii');
            cursor = JSON.parse(decoded);
        }

        // 1. Get My Profile (for location)
        const me = await this.profilesRepo.findOne({
            where: { user_id: userId },
            select: ['lat', 'lon'],
        });

        if (!me || !me.lat || !me.lon) {
            throw new BadRequestException('User location not set. Please complete onboarding.');
        }

        // 2. Build Query
        const query = this.profilesRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.user', 'u')
            // Add photos join if needed
            .where('p.user_id != :userId', { userId })
            .andWhere('p.is_onboarded = true');

        // Filter by Distance using PostGIS
        // ST_DWithin arguments are geometries and distance in meters
        // We construct a POINT from the user's lat/lon
        query.andWhere(
            `ST_DWithin(
         p.geom, 
         ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
         :distanceMeters
       )`,
            {
                lon: me.lon,
                lat: me.lat,
                distanceMeters: distanceKm * 1000,
            }
        );

        // Calculate distance for sorting
        query.addSelect(
            `ST_Distance(
         p.geom, 
         ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
       ) / 1000`,
            'distance_km'
        );

        // Exclude swiped/matched/blocked users logic would go here
        // ...

        // Cursor Pagination Logic
        if (cursor) {
            query.andWhere(
                `(ST_Distance(p.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) / 1000 > :lastDist 
          OR (
            ST_Distance(p.geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) / 1000 = :lastDist 
            AND p.user_id > :lastId
          ))`,
                { lastDist: cursor.lastDistance, lastId: cursor.lastUserId }
            );
        }

        query.orderBy('distance_km', 'ASC');
        query.addOrderBy('p.user_id', 'ASC');
        query.take(limit);

        const rawResults = await query.getRawAndEntities();
        // TypeORM getRawAndEntities maps entities correctly but raw data (like distance_km) is separate.

        // Construct response
        return rawResults.entities.map((profile, index) => {
            const raw = rawResults.raw.find(r => r.p_user_id === profile.user_id);
            return {
                ...profile,
                distanceKm: raw ? raw.distance_km : null
            };
        });
    }
}
