
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User } from '../modules/users/entities/user.entity';
import { Profile, Gender, LookingFor, LocationMode, Orientation } from '../modules/profiles/entities/profile.entity';
import { Preference } from '../modules/preferences/entities/preference.entity';
import { ProfilePhoto } from '../modules/profiles/entities/profile-photo.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { randomBytes, scryptSync } from 'crypto';
import { faker } from '@faker-js/faker';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('SeedRemote');

    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const profileRepo = app.get<Repository<Profile>>(getRepositoryToken(Profile));
    const photoRepo = app.get<Repository<ProfilePhoto>>(getRepositoryToken(ProfilePhoto));
    const preferenceRepo = app.get<Repository<Preference>>(getRepositoryToken(Preference));

    // Buenos Aires Center
    const centerLat = -34.6037;
    const centerLon = -58.3816;

    logger.log('Seeding 10 users with photos...');

    for (let i = 0; i < 10; i++) {
        const email = faker.internet.email();
        const existing = await userRepo.findOne({ where: { email } });
        if (existing) continue;

        const user = new User();
        user.email = email;
        const salt = randomBytes(16).toString('hex');
        const hashedPassword = scryptSync('password123', salt, 64).toString('hex');
        user.passwordHash = `${salt}:${hashedPassword}`;
        user.isEmailVerified = true;
        user.lastLoginAt = new Date();
        const savedUser = await userRepo.save(user);

        const profile = new Profile();
        profile.user = savedUser;
        profile.user_id = savedUser.id;
        profile.name = faker.person.firstName();
        profile.birthdate = faker.date.birthdate({ min: 18, max: 40, mode: 'age' });
        profile.gender = faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]);
        profile.orientation = Orientation.HETEROSEXUAL;
        profile.looking_for = LookingFor.RELATIONSHIP;
        profile.bio = faker.person.bio();
        profile.height = faker.number.int({ min: 150, max: 200 });

        // Random location near BA
        profile.lat = centerLat + (Math.random() - 0.5) * 0.1;
        profile.lon = centerLon + (Math.random() - 0.5) * 0.1;
        profile.location_mode = LocationMode.APPROXIMATE;
        profile.locationText = 'Buenos Aires Area';
        profile.isOnboarded = true;
        await profileRepo.save(profile);

        // Update Geom
        await profileRepo.query(`
            UPDATE profiles 
            SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            WHERE user_id = $3
        `, [profile.lon, profile.lat, savedUser.id]);

        // Add Photos
        const numPhotos = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < numPhotos; j++) {
            const photo = new ProfilePhoto();
            photo.user = savedUser;
            photo.url = `https://picsum.photos/400/600?random=${i}${j}`;
            photo.publicId = `mock_${savedUser.id}_${j}`;
            photo.position = j;
            photo.isActive = true;
            await photoRepo.save(photo);
        }

        // Add Preference
        const pref = new Preference();
        pref.user = savedUser;
        pref.user_id = savedUser.id;
        pref.ageMin = 18;
        pref.ageMax = 99;
        pref.distanceKm = 1000;
        pref.gendersAllowed = [Gender.MALE, Gender.FEMALE];
        await preferenceRepo.save(pref);

        logger.log(`Created user ${profile.name} with ${numPhotos} photos.`);
    }

    logger.log('Seeding complete.');
    await app.close();
}

bootstrap();
