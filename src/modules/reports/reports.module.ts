import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { User } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Report, User])],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService]
})
export class ReportsModule { }
