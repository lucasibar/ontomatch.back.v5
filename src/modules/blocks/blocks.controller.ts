import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { IsUUID } from 'class-validator';

export class CreateBlockDto {
    @IsUUID()
    blockedId: string;
}

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
    constructor(private readonly blocksService: BlocksService) {}

    @Post()
    async block(@Body() body: CreateBlockDto, @Req() req: Request) {
        const userId = (req.user as any).id;
        return this.blocksService.blockUser(userId, body.blockedId);
    }
}
