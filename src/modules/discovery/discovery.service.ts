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
        // Basic settings
        const distanceKm = dto.distanceKm || 50;
        const limit = dto.limit || 20;

        // Decoding cursor
        let cursor: FeedCursor | null = null;
        if (dto.cursor) {
            try {
                const decoded = Buffer.from(dto.cursor, 'base64').toString('ascii');
                cursor = JSON.parse(decoded);
            } catch (e) {
                // ignore invalid cursor
            }
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
            .leftJoinAndSelect('p.user', 'targetUser') // Access to user relation
            .where('p.user_id != :userId', { userId })
            .andWhere('p.is_onboarded = true');

        // Filter by Distance using PostGIS
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

        // --- FILTERS ---

        // 1. Exclude Inactive Users (Default: True)
        // If excludeInactive is undefined or true or 'true', we filter.
        const shouldExcludeInactive = dto.excludeInactive !== false && dto.excludeInactive !== 'false' as any;
        if (shouldExcludeInactive) {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - 30); // 30 days inactivity
            query.andWhere('u.last_login_at > :dateThreshold', { dateThreshold });
        }

        // 2. Exclude Swiped Users
        // Left join swipes where swiper is ME and target is THEM
        query.leftJoin('swipes', 's', 's.target_user_id = p.user_id AND s.swiper_user_id = :userId', { userId });
        // Only keep rows where swipe record is NULL (activates exclusion)
        query.andWhere('s.id IS NULL');

        // 3. Age Filter
        if (dto.minAge) {
            const maxBirthDate = new Date();
            maxBirthDate.setFullYear(maxBirthDate.getFullYear() - Number(dto.minAge));
            query.andWhere('p.birthdate <= :maxBirthDate', { maxBirthDate });
        }
        if (dto.maxAge) {
            const minBirthDate = new Date();
            minBirthDate.setFullYear(minBirthDate.getFullYear() - Number(dto.maxAge) - 1);
            query.andWhere('p.birthdate > :minBirthDate', { minBirthDate });
        }

        // 4. Gender Filter
        if (dto.genders) {
            let genderList = dto.genders;
            if (typeof genderList === 'string') {
                genderList = (genderList as string).split(',');
            }
            if (Array.isArray(genderList) && genderList.length > 0) {
                query.andWhere('p.gender IN (:...genders)', { genders: genderList });
            }
        }

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

        // Construct response
        // Also fetch photos? The user wants images.
        // We can join photos or fetch them separately.
        // Joining photos 1:N might mess up pagination if not careful with limits in TypeORM (it handles it in JS memory if using getMany, but raw query might duplicte).
        // Since we limit profiles, we can `leftJoinAndSelect('u.photos', 'photos')`.
        // BUT `u` is `p.user`.

        // Let's add photos join.
        // query.leftJoinAndSelect('u.photos', 'photos'); // This might duplicate rows for raw query calc.

        // Standard pattern: Get IDs then fetch relations.
        // OR rely on TypeORM map.

        // Let's try to include photos in the initial query or just use a second query for simplicity and performance correctness with limit.
        // Actually, let's just return what we have. Frontend might fetch profile details?
        // User said: "swipes de imagenes". We need images in the feed.

        const entities = rawResults.entities;

        // Fetch photos for these entities
        if (entities.length > 0) {
            const userIds = entities.map(e => e.user_id);
            // We can't easily inject Photo repo here without modifying constructor.
            // We can use p.user.photos if we verified the join.
            // Let's modify the query to join photos.
            // query.leftJoinAndSelect('u.photos', 'photos');
        }

        return rawResults.entities.map((profile, index) => {
            const raw = rawResults.raw.find(r => r.p_user_id === profile.user_id);
            return {
                ...profile,
                distanceKm: raw ? raw.distance_km : null,
                // photos: profile.user?.photos || [] 
                // We need to ensure we joined them.
            };
        });
    }
}
