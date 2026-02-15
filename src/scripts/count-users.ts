
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module'; // Adjust path if needed
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    const userCount = await dataSource.query('SELECT count(*) FROM users');
    const profileCount = await dataSource.query('SELECT count(*) FROM profiles');
    const photoCount = await dataSource.query('SELECT count(*) FROM profile_photos');

    console.log('Users:', userCount[0].count);
    console.log('Profiles:', profileCount[0].count);
    console.log('Photos:', photoCount[0].count);

    // Check last 10 profiles
    const profiles = await dataSource.query(`
        SELECT p.name, p.user_id, COUNT(pp.id) as photo_count, u.last_login_at
        FROM profiles p
        LEFT JOIN users u ON u.id = p.user_id
        LEFT JOIN profile_photos pp ON pp.user_id = p.user_id
        GROUP BY p.user_id, p.name, u.last_login_at
        ORDER BY p.created_at DESC
        LIMIT 10
    `);
    console.log('Last 10 Profiles:', profiles);
    const profile = await dataSource.query('SELECT * FROM profiles LIMIT 1');
    console.log('Sample Profile:', profile[0]);

    await app.close();
}

bootstrap();
