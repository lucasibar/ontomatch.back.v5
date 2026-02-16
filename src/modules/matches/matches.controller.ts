
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MatchDto } from './dto/match.dto';

@Controller('matches')
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Request() req): Promise<MatchDto[]> {
        return this.matchesService.findAll(req.user.id);
    }
}
