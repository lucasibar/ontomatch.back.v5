import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SwipesService } from './swipes.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('swipes')
@UseGuards(JwtAuthGuard)
export class SwipesController {
    constructor(private readonly swipesService: SwipesService) { }

    @Post()
    create(@Body() createSwipeDto: CreateSwipeDto, @Req() req: Request) {
        const userId = (req.user as any).id;
        return this.swipesService.create(userId, createSwipeDto);
    }
}
