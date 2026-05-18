import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('check')
    async checkAdmin(@Request() req) {
        const isAdmin = await this.adminService.isAdmin(req.user.id);
        return { isAdmin };
    }

    @Get('metrics')
    async getMetrics(@Request() req) {
        const isAdmin = await this.adminService.isAdmin(req.user.id);
        if (!isAdmin) {
            throw new ForbiddenException('No tienes permisos de administrador');
        }
        return this.adminService.getMetrics();
    }

    @Get('conversations')
    async getAllConversations(@Request() req) {
        const isAdmin = await this.adminService.isAdmin(req.user.id);
        if (!isAdmin) {
            throw new ForbiddenException('No tienes permisos de administrador');
        }
        return this.adminService.getAllConversations();
    }
}
