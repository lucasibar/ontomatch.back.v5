import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { IsUUID, IsString, MinLength } from 'class-validator';

export class CreateReportDto {
    @IsUUID()
    reportedId: string;

    @IsString()
    @MinLength(5)
    reason: string;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) {}

    @Post()
    async report(@Body() body: CreateReportDto, @Req() req: Request) {
        const userId = (req.user as any).id;
        return this.reportsService.reportUser(userId, body.reportedId, body.reason);
    }
}
