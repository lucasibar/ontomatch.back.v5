import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private repo: Repository<Conversation>
    ) { }

    async findAll(userId: string) {
        // Get conversations where user is part of the match
        const conversations = await this.repo.createQueryBuilder('conv')
            .leftJoinAndSelect('conv.match', 'match')
            .leftJoinAndSelect('match.userLow', 'userLow')
            .leftJoinAndSelect('userLow.profile', 'profileLow')
            .leftJoinAndSelect('userLow.photos', 'photosLow')
            .leftJoinAndSelect('match.userHigh', 'userHigh')
            .leftJoinAndSelect('userHigh.profile', 'profileHigh')
            .leftJoinAndSelect('userHigh.photos', 'photosHigh')
            .leftJoinAndSelect('conv.messages', 'messages')
            .where('match.userLowId = :userId OR match.userHighId = :userId', { userId })
            // .orderBy('conv.lastMessageAt', 'DESC') // Ensure field exists or use updated_at
            .orderBy('conv.updatedAt', 'DESC')
            .getMany();

        return conversations.map(conv => {
            const isLow = conv.match.userLowId === userId;
            const partner = isLow ? conv.match.userHigh : conv.match.userLow;

            // Sort photos
            const photos = partner.photos || [];
            photos.sort((a, b) => a.position - b.position);

            // Get last message (in memory sort for now)
            const lastMsg = conv.messages && conv.messages.length > 0
                ? conv.messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
                : null;

            return {
                id: conv.id,
                partner: {
                    id: partner.id,
                    name: partner.profile?.name || 'Unknown',
                    photoUrl: photos.length > 0 ? photos[0].url : null,
                },
                lastMessage: lastMsg ? {
                    body: lastMsg.body,
                    createdAt: lastMsg.createdAt,
                    senderId: lastMsg.senderUserId
                } : null,
                updatedAt: conv.lastMessageAt
            };
        });
    }

    async canAccess(userId: string, conversationId: string): Promise<boolean> {
        // Implementation: Check if userId is one of the users in match linked to conversation
        const conv = await this.repo.findOne({
            where: { id: conversationId },
            relations: ['match']
        });
        if (!conv || !conv.match) return false;

        return conv.match.userLowId === userId || conv.match.userHighId === userId;
    }
}
