import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const common = {
    type: 'postgres',
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/infrastructure/database/migrations/*{.ts,.js}'],
    autoLoadEntities: true,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: true,
  };

  if (process.env.DATABASE_URL) {
    return {
      ...common,
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  return {
    ...common,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10) || 5432,
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres_password',
    database: process.env.POSTGRES_DB || 'ontomatch',
  };
});
