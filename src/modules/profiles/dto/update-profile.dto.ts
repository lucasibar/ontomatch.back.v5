import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { Gender, Orientation, LookingFor } from '../entities/profile.entity';

export class UpdateProfileDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    name?: string;

    @IsDateString()
    @IsOptional()
    birthdate?: Date;

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

    @IsEnum(Orientation)
    @IsOptional()
    orientation?: Orientation;

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
