import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email } });
    }

    async create(email: string, password: string): Promise<User> {
        const salt = randomBytes(16).toString('hex');
        const hashedPassword = scryptSync(password, salt, 64).toString('hex');
        const passwordHash = `${salt}:${hashedPassword}`;

        const newUser = this.usersRepository.create({
            email,
            passwordHash,
        });

        try {
            return await this.usersRepository.save(newUser);
        } catch (error) {
            if (error.code === '23505') { // Postgres unique_violation
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }

    verifyPassword(password: string, storedHash: string): boolean {
        const [salt, key] = storedHash.split(':');
        const hashedBuffer = scryptSync(password, salt, 64);
        const keyBuffer = Buffer.from(key, 'hex');
        return timingSafeEqual(hashedBuffer, keyBuffer);
    }
}
