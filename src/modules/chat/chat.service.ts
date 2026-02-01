import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../messages/entities/message.entity';
import { Conversation } from '../conversations/entities/conversation.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Message)
        private messagesRepo: Repository<Message>,
        @InjectRepository(Conversation)
        private conversationsRepo: Repository<Conversation>,
    ) { }

    async createMessage(conversationId: string, senderId: string, body: string) {
        const message = this.messagesRepo.create({
            conversation: { id: conversationId },
            senderUserId: senderId,
            body
        });

        await this.messagesRepo.save(message);

        // Update conversation last_message_at
        await this.conversationsRepo.update(conversationId, {
            lastMessageAt: new Date()
        });

        return message;
    }
}
