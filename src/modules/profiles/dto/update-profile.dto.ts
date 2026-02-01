import { IsString, IsNotEmpty, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { Gender, Orientation, LookingFor } from '../entities/profile.entity';

export class UpdateProfileDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDateString()
    birthdate: Date;

    @IsEnum(Gender)
    gender: Gender;

    @IsEnum(Orientation)
    orientation: Orientation;

    @IsString()
    bio: string;

    @IsEnum(LookingFor)
    lookingFor: LookingFor;

    @IsString()
    @IsOptional()
    locationId?: string; // We'll look this up in database
}
