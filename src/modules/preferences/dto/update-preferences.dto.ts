
import { IsNumber, IsOptional, IsArray, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePreferencesDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(18)
    ageMin?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Max(100)
    ageMax?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    distanceKm?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    gendersAllowed?: string[];
}
