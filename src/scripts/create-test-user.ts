
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User } from '../modules/users/entities/user.entity';
import { Profile, Gender, LookingFor, LocationMode, Orientation } from '../modules/profiles/entities/profile.entity';
import { Preference } from '../modules/preferences/entities/preference.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { randomBytes, scryptSync } from 'crypto';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('CreateTestUser');

    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const profileRepo = app.get<Repository<Profile>>(getRepositoryToken(Profile));
    const preferenceRepo = app.get<Repository<Preference>>(getRepositoryToken(Preference));

    const email = 'test@test.com';
    const password = 'password123';

    // Check if exists
    let user = await userRepo.findOne({ where: { email } });
    if (user) {
        logger.log('Test user already exists. Updating password...');
    } else {
        logger.log('Creating new test user...');
        user = new User();
        user.email = email;
    }

    // Hash password
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    user.passwordHash = `${salt}:${hashedPassword}`;
    user.isEmailVerified = true;
    user.lastLoginAt = new Date();

    const savedUser = await userRepo.save(user);

    // Ensure Profile
    let profile = await profileRepo.findOne({ where: { user: { id: savedUser.id } } });
    if (!profile) {
        profile = new Profile();
        profile.user = savedUser;
        profile.user_id = savedUser.id;
        profile.name = 'Test User';
        profile.birthdate = new Date('1990-01-01');
        profile.gender = Gender.MALE;
        profile.orientation = Orientation.HETEROSEXUAL;
        profile.looking_for = LookingFor.RELATIONSHIP;
        profile.bio = 'Testing the feed';
        profile.height = 180;
        profile.lat = -34.6037;
        profile.lon = -58.3816;
        profile.location_mode = LocationMode.APPROXIMATE;
        profile.locationText = 'Buenos Aires';
        profile.isOnboarded = true;
        await profileRepo.save(profile);

        // Update geom
        await profileRepo.query(`
            UPDATE profiles 
            SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            WHERE user_id = $3
        `, [profile.lon, profile.lat, savedUser.id]);
    }

    // Ensure Preference
    let pref = await preferenceRepo.findOne({ where: { user: { id: savedUser.id } } });
    if (!pref) {
        pref = new Preference();
        pref.user = savedUser;
        pref.user_id = savedUser.id;
        pref.ageMin = 18;
        pref.ageMax = 99;
        pref.distanceKm = 1000; // Wide range
        pref.gendersAllowed = [Gender.MALE, Gender.FEMALE, Gender.NON_BINARY, Gender.OTHER];
        await preferenceRepo.save(pref);
    }

    logger.log('Test user ready. Login with: test@test.com / password123');
    await app.close();
}

bootstrap();
