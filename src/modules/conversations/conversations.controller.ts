
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) { }

    @Get()
    findAll(@Request() req) {
        return this.conversationsService.findAll(req.user.id);
    }
}
