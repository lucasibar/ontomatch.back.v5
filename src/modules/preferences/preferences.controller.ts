
import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
    constructor(private readonly preferencesService: PreferencesService) { }

    @Get('me')
    getMe(@Request() req) {
        return this.preferencesService.findOne(req.user.id);
    }

    @Patch('me')
    updateMe(@Request() req, @Body() dto: UpdatePreferencesDto) {
        console.log('PATCH /preferences/me - User:', req.user.id);
        console.log('Payload:', dto);
        return this.preferencesService.update(req.user.id, dto);
    }
}
