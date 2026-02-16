
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private messageRepo: Repository<Message>,
    ) { }

    async create(userId: string, createMessageDto: CreateMessageDto) {
        const message = this.messageRepo.create({
            senderUserId: userId,
            conversation: { id: createMessageDto.conversationId }, // Link by ID
            body: createMessageDto.body,
        });
        return await this.messageRepo.save(message);
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
        // Optimization: Get last message for each conversation to show in list
        // For now, simple approach
    }
}
