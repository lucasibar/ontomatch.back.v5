import { Injectable } from '@nestjs/common';
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

        return await this.dataSource.transaction(async (manager) => {
            // 1. Create Swipe (Idempotent via unique constraint)
            // We use upsert or ignore if exists, or just save and catch error
            // Ideally check if exists first to avoid error spam

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

            // 2. Check for MATCH
            if (action === SwipeAction.LIKE) {
                const reverseSwipe = await manager.findOne(Swipe, {
                    where: {
                        swiperUserId: targetUserId,
                        targetUserId: swiperId,
                        action: SwipeAction.LIKE,
                    },
                });

                if (reverseSwipe) {
                    // IT'S A MATCH!
                    // 3. Create Match Record (Ordered IDs)
                    const [low, high] = [swiperId, targetUserId].sort();

                    // Check consistency (shouldn't exist if transaction is clean)
                    let match = await manager.findOne(Match, {
                        where: { userLowId: low, userHighId: high }
                    });

                    if (!match) {
                        match = await manager.save(Match, {
                            userLowId: low,
                            userHighId: high
                        });

                        // 4. Create Conversation
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
