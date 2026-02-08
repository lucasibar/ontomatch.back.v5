
import { IsNumber, IsOptional, IsArray, IsString, Min, Max } from 'class-validator';

export class UpdatePreferencesDto {
    @IsOptional()
    @IsNumber()
    @Min(18)
    ageMin?: number;

    @IsOptional()
    @IsNumber()
    @Max(100)
    ageMax?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    distanceKm?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    gendersAllowed?: string[];
}
