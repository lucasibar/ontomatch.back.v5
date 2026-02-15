
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

    // Check one profile
    const profile = await dataSource.query('SELECT * FROM profiles LIMIT 1');
    console.log('Sample Profile:', profile[0]);

    await app.close();
}

bootstrap();
