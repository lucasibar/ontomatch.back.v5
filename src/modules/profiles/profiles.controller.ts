import { Controller, Get, Post, Body, UseGuards, Request, Delete, Param } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    @Get('me')
    async getMe(@Request() req) {
        return this.profilesService.getMyProfile(req.user.id);
    }

    @Post('me')
    async updateMe(@Request() req, @Body() dto: UpdateProfileDto) {
        return this.profilesService.update(req.user.id, dto);
    }

    @Post('photos')
    async addPhoto(@Request() req, @Body() body: { url: string; publicId: string }) {
        return this.profilesService.addPhoto(req.user.id, body.url, body.publicId);
    }

    @Delete('photos/:id')
    async deletePhoto(@Request() req, @Param('id') photoId: string) {
        return this.profilesService.deletePhoto(req.user.id, photoId);
    }

    @Post('photos/reorder')
    async reorderPhotos(@Request() req, @Body() body: { photoIds: string[] }) {
        return this.profilesService.reorderPhotos(req.user.id, body.photoIds);
    }

    @Get(':id')
    async getById(@Param('id') userId: string) {
        return this.profilesService.getById(userId);
    }
}
