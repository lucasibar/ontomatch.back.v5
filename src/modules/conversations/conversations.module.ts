import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Conversation])],
    providers: [],
    exports: [TypeOrmModule],
})
export class ConversationsModule { }
