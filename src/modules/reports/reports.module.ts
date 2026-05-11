import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { BlocksModule } from '../blocks/blocks.module';

@Module({
    imports: [TypeOrmModule.forFeature([Report, User]), BlocksModule],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService]
})
export class ReportsModule { }
