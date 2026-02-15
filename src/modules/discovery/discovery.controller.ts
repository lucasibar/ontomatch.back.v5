import { Controller, Get, Req, UseGuards, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetFeedDto } from './dto/get-feed.dto';
import type { Request } from 'express';

@Controller('discovery')
@UseGuards(JwtAuthGuard)
export class DiscoveryController {
    constructor(private readonly discoveryService: DiscoveryService) { }

    @Get('feed')
    async getFeed(@Query() dto: GetFeedDto, @Req() req: Request) {
        // req.user is populated by JwtStrategy
        const userId = (req.user as any).userId;
        return this.discoveryService.getFeed(dto, userId);
    }
}
