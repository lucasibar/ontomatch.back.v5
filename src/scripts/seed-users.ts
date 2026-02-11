
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { User } from '../modules/users/entities/user.entity';
import { Profile, Gender, LookingFor, LocationMode, Orientation } from '../modules/profiles/entities/profile.entity';
import { Preference } from '../modules/preferences/entities/preference.entity';
import { ProfilePhoto } from '../modules/profiles/entities/profile-photo.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const logger = new Logger('SeedUsers');

    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const profileRepo = app.get<Repository<Profile>>(getRepositoryToken(Profile));
    const preferenceRepo = app.get<Repository<Preference>>(getRepositoryToken(Preference));
    const photoRepo = app.get<Repository<ProfilePhoto>>(getRepositoryToken(ProfilePhoto));

    const MOCK_COUNT = 20;
    const CENTER_LAT = -34.6037;
    const CENTER_LON = -58.3816;

    logger.log(`Generating ${MOCK_COUNT} mock users around Buenos Aires...`);

    for (let i = 0; i < MOCK_COUNT; i++) {
        const email = faker.internet.email();
        // Create User
        const user = new User();
        user.email = email;
        user.passwordHash = '$2b$10$EpIs0/X.X...'; // Dummy hash
        user.isEmailVerified = true;
        user.googleId = faker.string.uuid(); // avoid unique constraint collision on null if applicable, or just leave null

        // Randomize activity
        // 70% active in last week, 20% active in last month, 10% inactive > 3 months (to test penalty)
        const activityRoll = Math.random();
        if (activityRoll < 0.7) {
            user.lastLoginAt = faker.date.recent({ days: 7 });
        } else if (activityRoll < 0.9) {
            user.lastLoginAt = faker.date.recent({ days: 30 });
        } else {
            user.lastLoginAt = faker.date.past({ years: 1 }); // Inactive
        }

        const savedUser = await userRepo.save(user);

        // Create Profile
        const profile = new Profile();
        profile.user = savedUser;
        profile.user_id = savedUser.id; // Explicitly set join column
        profile.name = faker.person.firstName();
        profile.birthdate = faker.date.birthdate({ mode: 'age', min: 18, max: 45 });
        profile.gender = faker.helpers.arrayElement(Object.values(Gender));
        profile.orientation = faker.helpers.arrayElement(Object.values(Orientation));
        profile.looking_for = faker.helpers.arrayElement(Object.values(LookingFor));
        profile.bio = faker.person.bio();
        profile.height = faker.number.int({ min: 150, max: 200 });

        // Location
        // Random offset
        const latOffset = (Math.random() - 0.5) * 0.1; // ~10km
        const lonOffset = (Math.random() - 0.5) * 0.1;
        profile.lat = CENTER_LAT + latOffset;
        profile.lon = CENTER_LON + lonOffset;
        profile.location_mode = LocationMode.APPROXIMATE;
        profile.locationText = 'Buenos Aires';
        profile.isOnboarded = true;
        // geom is handled by raw query below

        // Depending on existing constraints, we might need to save profile first without geom
        // or ensure geom is handled.
        await profileRepo.save(profile);

        // Update Geometry
        await profileRepo.query(`
            UPDATE profiles 
            SET geom = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            WHERE user_id = $3
        `, [profile.lon, profile.lat, savedUser.id]);


        // Create Preference
        const pref = new Preference();
        pref.user = savedUser;
        pref.user_id = savedUser.id;
        pref.ageMin = 18;
        pref.ageMax = 99;
        pref.distanceKm = 100;
        pref.gendersAllowed = [Gender.MALE, Gender.FEMALE, Gender.NON_BINARY, Gender.OTHER];
        await preferenceRepo.save(pref);

        // Create Photos
        // Add 3-5 photos
        const numPhotos = faker.number.int({ min: 3, max: 5 });
        for (let p = 0; p < numPhotos; p++) {
            const photo = new ProfilePhoto();
            photo.user = savedUser;
            // Use picsum or similar for larger placeholder images
            photo.url = `https://picsum.photos/id/${faker.number.int({ min: 1, max: 500 })}/400/600`;
            photo.publicId = `mock_${savedUser.id}_${p}`;
            photo.position = p;
            photo.isActive = true;
            await photoRepo.save(photo);
        }

        logger.log(`Created user ${profile.name} (${user.email}) - Last Active: ${user.lastLoginAt}`);
    }

    logger.log('Seeding complete.');
    await app.close();
}

bootstrap();
