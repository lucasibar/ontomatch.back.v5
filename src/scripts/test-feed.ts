
import { Logger } from '@nestjs/common';

async function testFeed() {
    const logger = new Logger('TestFeed');
    const baseUrl = 'https://ontomatch-back-v5.onrender.com';

    try {
        // Login
        logger.log('Attempting login with test@test.com ...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
        });

        if (!loginRes.ok) {
            const error = await loginRes.text();
            logger.error(`Login failed: ${loginRes.status} ${loginRes.statusText} - ${error}`);
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.access_token;
        logger.log('Login successful. Token received.');

        // Get Feed
        logger.log('Fetching discovery feed...');
        const feedRes = await fetch(`${baseUrl}/discovery/feed?limit=5`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!feedRes.ok) {
            const error = await feedRes.text();
            logger.error(`Feed fetch failed: ${feedRes.status} ${feedRes.statusText} - ${error}`);
            return;
        }

        const feedData = await feedRes.json();
        logger.log('Feed fetched successfully!');
        console.log(JSON.stringify(feedData, null, 2));

    } catch (error) {
        logger.error(`Error: ${error.message}`);
    }
}

testFeed();
