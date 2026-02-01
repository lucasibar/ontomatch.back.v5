import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Swipe } from './entities/swipe.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Swipe])],
    providers: [],
    exports: [TypeOrmModule],
})
export class SwipesModule { }
