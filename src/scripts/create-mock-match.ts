
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

import { SwipesService } from '../modules/swipes/swipes.service';
import { SwipeAction } from '../modules/swipes/entities/swipe.entity';
import { User } from '../modules/users/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { Profile, Gender, LookingFor } from '../modules/profiles/entities/profile.entity';
import { randomBytes, scryptSync } from 'crypto';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('CreateMockMatch');

    // Services / Repos
    const swipesService = app.get(SwipesService);
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const profileRepo = app.get<Repository<Profile>>(getRepositoryToken(Profile));

    logger.log('--- Creating Mock Match ---');

    const knownPassword = 'password';

    // Scrypt logic from UsersService
    const hashPassword = (password: string) => {
        const salt = randomBytes(16).toString('hex');
        const hashedPassword = scryptSync(password, salt, 64).toString('hex');
        return `${salt}:${hashedPassword}`;
    };

    const passwordHash = hashPassword(knownPassword);

    // Helper to create user
    const createUser = async (name: string, email: string, gender: Gender, lookingFor: LookingFor) => {
        let user = await userRepo.findOne({ where: { email } });
        if (!user) {
            user = userRepo.create({
                email,
                passwordHash,
                isEmailVerified: true
            });
            await userRepo.save(user);

            const profile = profileRepo.create({
                user_id: user.id,
                name,
                birthdate: new Date('1995-06-15'),
                gender,
                looking_for: lookingFor,
                bio: `I am ${name}, a bot for testing chat!`,
                locationText: 'Virtual City',
                isOnboarded: true
            });
            await profileRepo.save(profile);
            logger.log(`Created user ${name} (${email}) with password: ${knownPassword}`);
        } else {
            logger.log(`User ${name} already exists`);
        }
        return user;
    };

    const userA = await createUser('Alice', 'alice@chat.com', Gender.FEMALE, LookingFor.RELATIONSHIP);
    const userB = await createUser('Bob', 'bob@chat.com', Gender.MALE, LookingFor.RELATIONSHIP);

    // Mutual Match
    logger.log('Creating mutual likes...');

    try {
        const swipeA = await swipesService.create(userA.id, { targetUserId: userB.id, action: SwipeAction.LIKE });
        const swipeB = await swipesService.create(userB.id, { targetUserId: userA.id, action: SwipeAction.LIKE });

        if (swipeB.matched) {
            logger.log(`SUCCESS! Match created between Alice and Bob.`);
            logger.log(`Open Browser 1: Login as alice@chat.com / ${knownPassword}`);
            logger.log(`Open Browser 2: Login as bob@chat.com / ${knownPassword}`);
        } else {
            // Check if already matched
            logger.log('Note: If users were already matched, you might not see the success message here.');
            logger.log('Please check your Matches page.');
        }
    } catch (e) {
        logger.error('Error creating swipes:', e);
    }

    await app.close();
}

bootstrap();
