
import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
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

    @Get(':id/messages')
    async getMessages(@Request() req, @Param('id') id: string) {
        // Optional: Check access
        // const canAccess = await this.conversationsService.canAccess(req.user.id, id);
        // if (!canAccess) throw new ForbiddenException();
        return this.conversationsService.findMessages(id);
    }
}
