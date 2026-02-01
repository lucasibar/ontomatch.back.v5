import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeorefService } from './georef.service';

@Module({
    imports: [HttpModule],
    providers: [GeorefService],
    exports: [GeorefService],
})
export class GeorefModule { }
