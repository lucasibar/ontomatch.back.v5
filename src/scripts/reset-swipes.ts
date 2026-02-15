
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    // Get the user "Lucas" (or main user)
    const user = await dataSource.query(`SELECT id, email FROM users JOIN profiles ON profiles.user_id = users.id WHERE profiles.name = 'Lucas' LIMIT 1`);

    if (user.length > 0) {
        const userId = user[0].id;
        console.log(`Found user Lucas (${userId}). Clearing swipes...`);

        const deleteResult = await dataSource.query(`DELETE FROM swipes WHERE swiper_user_id = $1`, [userId]);
        console.log(`Deleted ${deleteResult[1] || 'all'} swipes.`);
    } else {
        console.log('User Lucas not found. Clearing stats for ALL users...');
        // Optional: truncate swipes if reckless
        // await dataSource.query('TRUNCATE TABLE swipes');
    }

    // Also check 'test@test.com'
    const testUser = await dataSource.query(`SELECT id FROM users WHERE email = 'test@test.com' LIMIT 1`);
    if (testUser.length > 0) {
        console.log(`Found test user. Clearing swipes...`);
        await dataSource.query(`DELETE FROM swipes WHERE swiper_user_id = $1`, [testUser[0].id]);
    }

    await app.close();
}

bootstrap();
