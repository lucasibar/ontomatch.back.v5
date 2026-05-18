import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationsService } from './conversations.service';
import { ConversationsController } from './conversations.controller';
import { User } from '../users/entities/user.entity';
import { Swipe } from '../swipes/entities/swipe.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Conversation, User, Swipe])],
    controllers: [ConversationsController],
    providers: [ConversationsService],
    exports: [TypeOrmModule, ConversationsService],
})
export class ConversationsModule { }
