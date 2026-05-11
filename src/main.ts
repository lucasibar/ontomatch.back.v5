import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AdminService } from './modules/admin/admin.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    transformOptions: { enableImplicitConversion: true }
  }));
  app.use(json({ limit: '50mb' }));
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174', // Vite fallback
      'http://localhost:5175',
      'https://ontomatch.vercel.app',
      ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
      /^https:\/\/ontomatch.*\.vercel\.app$/, // Allow any Vercel preview URLs for ontomatch
    ],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);

  // Ensure admin user exists on startup
  const adminService = app.get(AdminService);
  await adminService.ensureAdminExists();
}
bootstrap();
