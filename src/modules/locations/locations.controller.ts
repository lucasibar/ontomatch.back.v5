import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
    constructor(private readonly service: LocationsService) { }

    @Get()
    async search(@Query('q') query: string) {
        return this.service.search(query);
    }

    @Get('seed')
    async seed() {
        return this.service.seed();
    }
}
