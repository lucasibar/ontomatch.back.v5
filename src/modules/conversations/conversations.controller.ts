import { Controller, Get, UseGuards, Request, Param, ForbiddenException, Patch } from '@nestjs/common';
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

    @Get('support')
    findSupport(@Request() req) {
        return this.conversationsService.findSupportConversations(req.user.id);
    }

    @Patch(':id/read')
    async markAsRead(@Request() req, @Param('id') id: string) {
        await this.conversationsService.markAsRead(req.user.id, id);
        return { success: true };
    }

    @Get(':id/messages')
    async getMessages(@Request() req, @Param('id') id: string) {
        const canAccess = await this.conversationsService.canAccess(req.user.id, id);
        if (!canAccess) {
            throw new ForbiddenException('No tienes acceso a esta conversación');
        }
        return this.conversationsService.findMessages(id);
    }
}
