import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Match } from '../matches/entities/match.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Profile, Match, Conversation, Message])],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule {}
