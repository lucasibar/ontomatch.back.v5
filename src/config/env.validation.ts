import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync } from 'class-validator';

enum Environment {
    Development = 'development',
    Production = 'production',
    Test = 'test',
    Provision = 'provision',
}

class EnvironmentVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment = Environment.Development;

    @IsNumber()
    PORT: number = 3000;

    @IsString()
    DATABASE_URL: string;

    @IsString()
    JWT_SECRET: string;

    @IsString()
    JWT_REFRESH_SECRET: string;

    @IsString()
    GOOGLE_CLIENT_ID: string;

    @IsString()
    GOOGLE_CLIENT_SECRET: string;

    @IsString()
    CLOUDINARY_CLOUD_NAME: string;

    @IsString()
    CLOUDINARY_API_KEY: string;

    @IsString()
    CLOUDINARY_API_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(
        EnvironmentVariables,
        config,
        { enableImplicitConversion: true },
    );
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }
    return validatedConfig;
}
