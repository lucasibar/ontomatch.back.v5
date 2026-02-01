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
