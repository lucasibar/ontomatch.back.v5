import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Swipe, SwipeAction } from './entities/swipe.entity';
import { Match } from '../matches/entities/match.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { CreateSwipeDto } from './dto/create-swipe.dto';

@Injectable()
export class SwipesService {
    constructor(private dataSource: DataSource) { }

    async create(swiperId: string, dto: CreateSwipeDto) {
        const { targetUserId, action } = dto;

        if (swiperId === targetUserId) {
            throw new BadRequestException('No podés realizar un swipe sobre vos mismo');
        }

        return await this.dataSource.transaction(async (manager) => {
            const existing = await manager.findOne(Swipe, {
                where: { swiperUserId: swiperId, targetUserId }
            });

            if (existing) return { swipe: existing, matched: false };

            const swipe = await manager.save(Swipe, {
                swiperUserId: swiperId,
                targetUserId,
                action,
            });

            let matched = false;
            let matchId: string | null = null;
            let conversationId: string | null = null;

            if (action === SwipeAction.LIKE) {
                const reverseSwipe = await manager.findOne(Swipe, {
                    where: {
                        swiperUserId: targetUserId,
                        targetUserId: swiperId,
                        action: SwipeAction.LIKE,
                    },
                });

                if (reverseSwipe) {
                    const [low, high] = [swiperId, targetUserId].sort();

                    let match = await manager.findOne(Match, {
                        where: { userLowId: low, userHighId: high, isSupport: false }
                    });

                    if (!match) {
                        match = await manager.save(Match, {
                            userLowId: low,
                            userHighId: high,
                            isSupport: false,
                        });

                        const conv = await manager.save(Conversation, {
                            matchId: match.id
                        });

                        conversationId = conv.id;
                    }

                    matched = true;
                    matchId = match!.id;
                }
            }

            return { swipe, matched, matchId, conversationId };
        });
    }
}
