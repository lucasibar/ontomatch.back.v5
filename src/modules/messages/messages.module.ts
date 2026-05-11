import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessagesService } from './messages.service';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Message]),
        JwtModule.register({}), // Or use async config if secret needed here, but usually verification passes secret manually
        ConfigModule,
        ConversationsModule
    ],
    providers: [MessagesService, ChatGateway],
    exports: [MessagesService],
})
export class MessagesModule { }
