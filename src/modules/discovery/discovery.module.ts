import { Module } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './discovery.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { Swipe } from '../swipes/entities/swipe.entity';
import { Preference } from '../preferences/entities/preference.entity';
import { SwipesModule } from '../swipes/swipes.module';
import { BlocksModule } from '../blocks/blocks.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Profile, Swipe, Preference]),
        SwipesModule,
        BlocksModule
    ],
    controllers: [DiscoveryController],
    providers: [DiscoveryService],
    exports: [DiscoveryService]
})
export class DiscoveryModule { }
