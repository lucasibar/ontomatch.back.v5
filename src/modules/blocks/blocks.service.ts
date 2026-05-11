import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';

@Injectable()
export class BlocksService {
    constructor(
        @InjectRepository(Block)
        private blocksRepository: Repository<Block>,
    ) {}

    async blockUser(blockerId: string, blockedId: string): Promise<Block> {
        if (blockerId === blockedId) {
            throw new ConflictException('Cannot block yourself');
        }
        try {
            const block = this.blocksRepository.create({
                blockerId,
                blockedId
            });
            return await this.blocksRepository.save(block);
        } catch (e: any) {
            if (e.code === '23505') { // Postgres unique violation
                throw new ConflictException('User already blocked');
            }
            throw e;
        }
    }

    async getBlockedUserIds(userId: string): Promise<string[]> {
        const blocks = await this.blocksRepository.find({
            where: [
                { blockerId: userId },
                { blockedId: userId }
            ]
        });
        // We exclude anyone the user blocked, AND anyone who blocked the user.
        return blocks.map(b => b.blockerId === userId ? b.blockedId : b.blockerId);
    }
}
