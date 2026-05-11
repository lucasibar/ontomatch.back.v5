import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {}

    async reportUser(reporterId: string, reportedId: string, reason: string): Promise<Report> {
        if (reporterId === reportedId) {
            throw new ConflictException('Cannot report yourself');
        }

        // Check if already reported by this user
        const existing = await this.reportsRepository.findOne({
            where: { reporterId, reportedId }
        });

        if (existing) {
            throw new ConflictException('You have already reported this user');
        }

        const report = this.reportsRepository.create({
            reporterId,
            reportedId,
            reason
        });

        const savedReport = await this.reportsRepository.save(report);

        // Update user report count
        const reportedUser = await this.usersRepository.findOne({ where: { id: reportedId } });
        if (reportedUser) {
            reportedUser.reportCount = (reportedUser.reportCount || 0) + 1;
            if (reportedUser.reportCount >= 2) {
                reportedUser.status = 'suspended';
            }
            await this.usersRepository.save(reportedUser);
        }

        return savedReport;
    }
}
