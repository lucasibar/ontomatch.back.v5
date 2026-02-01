import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { AuthModule } from '../auth/auth.module';
import { MessagesModule } from '../messages/messages.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { ConversationsService } from '../conversations/conversations.service';

@Module({
    imports: [AuthModule, MessagesModule, ConversationsModule],
    providers: [ChatGateway, ChatService, ConversationsService], // Added ConversationsService here or export it
})
export class ChatModule { }
