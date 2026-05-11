import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { LocationsModule } from './modules/locations/locations.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { SwipesModule } from './modules/swipes/swipes.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { MediaModule } from './modules/media/media.module';
import { AuthModule } from './modules/auth/auth.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
// import { ChatModule } from './modules/chat/chat.module'; // If exists
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';

import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [databaseConfig],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    LocationsModule,
    PreferencesModule,
    SwipesModule,
    MatchesModule,
    ConversationsModule,
    MessagesModule,
    BlocksModule,
    ReportsModule,
    AdminModule,
    MediaModule,
    DiscoveryModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    }
  ],
})
export class AppModule { }
