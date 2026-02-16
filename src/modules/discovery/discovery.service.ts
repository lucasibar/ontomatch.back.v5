import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { GetFeedDto } from './dto/get-feed.dto';
import { Swipe, SwipeAction } from '../swipes/entities/swipe.entity';


export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        count: number;
        limit: number;
        hasNext: boolean;
        cursor: string | null;
    };
}

interface FeedCursor {
    lastDistance: number;
    lastUserId: string;
    // We might not use this strictly if we rely on offset/limit for now
}

@Injectable()
export class DiscoveryService {
    constructor(
        @InjectRepository(Profile)
        private profilesRepo: Repository<Profile>,
    ) { }

    async getFeed(dto: GetFeedDto, userId: string): Promise<PaginatedResult<Profile>> {
        const {
            distanceKm = 100, // Default 100km
            limit = 10,
            cursor,
            minAge,
            maxAge,
            genders,
            excludeInactive,
        } = dto;

        // --- STEP 1: Get IDs and Sort Keys (Raw Query) ---
        // We use getRawMany to avoid TypeORM's issues with DISTINCT + Computed Columns + Pagination
        const idsQuery = this.profilesRepo
            .createQueryBuilder('p')
            .select('p.user_id', 'user_id')
            .addSelect('u.last_login_at', 'last_login_at') // For sorting
            .leftJoin('users', 'u', 'u.id = p.user_id')
            .where('p.user_id != :userId', { userId })
            .andWhere('p.is_onboarded = true');

        // --- SCOPE: GEOMETRY & LOCATION ---
        // Get my location
        const me = await this.profilesRepo.findOne({
            where: { user_id: userId },
            select: ['lat', 'lon'],
        });

        if (!me || !me.lat || !me.lon) {
            throw new BadRequestException(
                'User location not found. Please set location before discovery.'
            );
        }

        // Filter by Distance
        idsQuery.andWhere(
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
        idsQuery.addSelect(
            `ST_Distance(
             p.geom, 
             ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
           ) / 1000`,
            'distance_km'
        );
        // idsQuery.addSelect('0', 'distance_km');

        // --- EXCLUDE SWIPED USERS ---
        // Join with swipes where I am the swiper
        idsQuery.leftJoin(
            'swipes',
            'my_swipes',
            'my_swipes.target_user_id = p.user_id AND my_swipes.swiper_user_id = :userId',
            { userId }
        );
        // Exclude if I already swiped them
        idsQuery.andWhere('my_swipes.id IS NULL');

        // --- SMART FEED LOGIC: Priority to people who Liked Me ---
        idsQuery.leftJoin(
            'swipes',
            'liked_me',
            'liked_me.swiper_user_id = p.user_id AND liked_me.target_user_id = :userId AND liked_me.action = :likeAction',
            { userId, likeAction: SwipeAction.LIKE }
        );

        // Add "is_liker" field for sorting
        idsQuery.addSelect(
            'CASE WHEN liked_me.id IS NOT NULL THEN 1 ELSE 0 END',
            'is_liker'
        );

        // --- FILTERS ---
        const shouldExcludeInactive =
            dto.excludeInactive !== false && (dto.excludeInactive as any) !== 'false';
        if (shouldExcludeInactive) {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - 30);
            idsQuery.andWhere('u.last_login_at > :dateThreshold', { dateThreshold });
        }

        if (minAge || maxAge) {
            const now = new Date();
            if (minAge) {
                const minDate = new Date(
                    now.getFullYear() - minAge,
                    now.getMonth(),
                    now.getDate()
                );
                idsQuery.andWhere('p.birthdate <= :minDate', { minDate });
            }
            if (maxAge) {
                const maxDate = new Date(
                    now.getFullYear() - maxAge - 1,
                    now.getMonth(),
                    now.getDate()
                );
                idsQuery.andWhere('p.birthdate > :maxDate', { maxDate });
            }
        }

        if (genders && genders.length > 0) {
            idsQuery.andWhere('p.gender IN (:...genders)', { genders });
        }

        // --- SORTING ---
        // Explicitly use the alias names we defined in addSelect/select
        idsQuery.orderBy('"is_liker"', 'DESC');
        idsQuery.addOrderBy('u.last_login_at', 'DESC');
        idsQuery.addOrderBy('"distance_km"', 'ASC'); // Use quoted alias
        idsQuery.addOrderBy('p.user_id', 'ASC');

        // Apply Limit
        idsQuery.limit(limit);

        const rawResults = await idsQuery.getRawMany();

        if (rawResults.length === 0) {
            return {
                data: [],
                meta: { total: 0, count: 0, limit, hasNext: false, cursor: null },
            };
        }

        // Extract IDs and map sort metadata if needed
        const targetIds = rawResults.map((r) => r.user_id);

        // --- STEP 2: Fetch Full Entities ---
        const profiles = await this.profilesRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.user', 'u')
            .leftJoinAndSelect('u.photos', 'photos')
            .whereInIds(targetIds)
            .getMany();

        // --- STEP 3: Re-Sort in Memory ---
        // WHERE IN (...) does not respect order. We must re-sort based on `targetIds`.
        const profilesMap = new Map(profiles.map((p) => [p.user_id, p]));
        const rawMap = new Map(rawResults.map(r => [r.user_id, r]));

        const finalData = targetIds.map(id => {
            const profile = profilesMap.get(id);
            if (!profile) return null;
            const raw = rawMap.get(id);
            return {
                ...profile,
                photos: profile.user?.photos || [],
                distanceKm: raw ? raw.distance_km : null,
                isLiker: raw ? (raw.is_liker === 1 || raw.is_liker === '1') : false,
            };
        }).filter(p => !!p);

        return {
            data: finalData as any,
            meta: {
                total: rawResults.length,
                count: finalData.length,
                limit,
                hasNext: rawResults.length === limit,
                cursor: null,
            },
        };
    }
}
