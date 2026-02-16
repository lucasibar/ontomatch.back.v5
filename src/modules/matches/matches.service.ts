
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { MatchDto } from './dto/match.dto';

@Injectable()
export class MatchesService {
    constructor(
        @InjectRepository(Match)
        private matchRepo: Repository<Match>,
    ) { }

    async findAll(userId: string): Promise<MatchDto[]> {
        const matches = await this.matchRepo.createQueryBuilder('match')
            .leftJoinAndSelect('match.userLow', 'userLow')
            .leftJoinAndSelect('userLow.profile', 'profileLow')
            .leftJoinAndSelect('userLow.photos', 'photosLow')
            .leftJoinAndSelect('match.userHigh', 'userHigh')
            .leftJoinAndSelect('userHigh.profile', 'profileHigh')
            .leftJoinAndSelect('userHigh.photos', 'photosHigh')
            .leftJoinAndSelect('match.conversation', 'conversation') // To get conversation ID
            .where('match.userLowId = :userId OR match.userHighId = :userId', { userId })
            .orderBy('match.createdAt', 'DESC')
            .getMany();

        return matches.map(match => {
            const isLow = match.userLowId === userId;
            const partnerUser = isLow ? match.userHigh : match.userLow;
            const partnerProfile = isLow ? partnerUser.profile : partnerUser.profile; // wait, if userHigh is loaded, userHigh.profile is loaded
            // TypeORM query above loads into userLow.profile / userHigh.profile
            // So if isLow (I am Low), partner is High.
            const partner = isLow ? match.userHigh : match.userLow;

            // Get Photos
            const photos = partner.photos || [];
            // Sort by position or primary? Usually seed sets position.
            const sortedPhotos = photos.sort((a, b) => a.position - b.position);
            const photoUrl = sortedPhotos.length > 0 ? sortedPhotos[0].url : null;

            return {
                id: match.id,
                partner: {
                    id: partner.id,
                    name: partner.profile?.name || 'Unknown',
                    photoUrl: photoUrl,
                },
                conversationId: match.conversation?.id || null, // Might be null if not loaded or not created (though swipes service creates it)
                createdAt: match.createdAt,
            };
        });
    }
}
