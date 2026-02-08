import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { ProfilePhoto } from './entities/profile-photo.entity';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { LocationsModule } from '../locations/locations.module';
import { MediaModule } from '../media/media.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Profile, ProfilePhoto]),
        LocationsModule,
        MediaModule
    ],
    controllers: [ProfilesController],
    providers: [ProfilesService],
    exports: [TypeOrmModule, ProfilesService],
})
export class ProfilesModule { }
