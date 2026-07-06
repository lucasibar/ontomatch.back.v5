import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { ConversationsService } from '../conversations/conversations.service';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private messageRepo: Repository<Message>,
        private conversationsService: ConversationsService,
    ) { }

    async create(userId: string, createMessageDto: CreateMessageDto) {
        const canAccess = await this.conversationsService.canAccess(userId, createMessageDto.conversationId);
        if (!canAccess) {
            throw new ForbiddenException('No tienes acceso a esta conversación');
        }

        const message = this.messageRepo.create({
            senderUserId: userId,
            conversation: { id: createMessageDto.conversationId }, // Link by ID
            body: createMessageDto.body,
        });
        const savedMessage = await this.messageRepo.save(message);

        // Update the lastMessageAt field in the Conversation
        try {
            await this.conversationsService.updateLastMessageAt(createMessageDto.conversationId, savedMessage.createdAt);
        } catch (err) {
            console.error(`Failed to update lastMessageAt for conversation ${createMessageDto.conversationId}:`, err);
        }

        return savedMessage;
    }

    async findAll(conversationId: string, limit = 50, offset = 0) {
        return await this.messageRepo.find({
            where: { conversation: { id: conversationId } },
            order: { createdAt: 'ASC' },
            take: limit,
            skip: offset,
            relations: ['senderUser', 'senderUser.profile'], // Need profile for avatar/name
        });
    }

    async getLastMessages(conversationIds: string[]) {
        // Optimization placeholder
    }
}
