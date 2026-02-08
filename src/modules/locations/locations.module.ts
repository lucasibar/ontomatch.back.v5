import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { GeorefModule } from '../../infrastructure/georef/georef.module';

@Module({
    imports: [TypeOrmModule.forFeature([Location]), GeorefModule],
    controllers: [LocationsController],
    providers: [LocationsService],
    exports: [TypeOrmModule, LocationsService],
})
export class LocationsModule { }
