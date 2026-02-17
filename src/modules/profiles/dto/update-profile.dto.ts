import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { Gender, LookingFor } from '../entities/profile.entity';

export class UpdateProfileDto {
    @IsBoolean()
    @IsOptional()
    isOnboarded?: boolean;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsDateString()
    @IsOptional()
    birthdate?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    height?: number;

    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @IsString()
    @IsOptional()
    genderCustom?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsEnum(LookingFor)
    @IsOptional()
    lookingFor?: LookingFor;

    @IsString()
    @IsOptional()
    locationText?: string;

    @IsString()
    @IsOptional()
    locationId?: string;

    @IsString()
    @IsOptional()
    neighborhood?: string;
}
