import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174', // Vite fallback
      'http://localhost:5175',
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
      /^https:\/\/ontomatch-front-v5.*\.vercel\.app$/, // Allow Vercel preview URLs
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
