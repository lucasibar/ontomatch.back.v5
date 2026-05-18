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

    @Get('support')
    findSupport(@Request() req) {
        return this.conversationsService.findSupportConversations(req.user.id);
    }

    @Get(':id/messages')
    async getMessages(@Request() req, @Param('id') id: string) {
        return this.conversationsService.findMessages(id);
    }
}
