import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Swipe } from './entities/swipe.entity';
import { SwipesService } from './swipes.service';

@Module({
    imports: [TypeOrmModule.forFeature([Swipe])],
    providers: [SwipesService],
    exports: [TypeOrmModule, SwipesService],
})
export class SwipesModule { }
