import { Controller, Get, UseGuards } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

@Controller('media')
export class MediaController {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Get('signature')
    @UseGuards(JwtAuthGuard)
    getSignature() {
        return this.cloudinaryService.getSignature();
    }
}
