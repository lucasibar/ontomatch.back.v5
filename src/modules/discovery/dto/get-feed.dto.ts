
import { IsOptional, IsNumber, IsString, IsBoolean, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetFeedDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    distanceKm?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit?: number;

    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    minAge?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxAge?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.split(',');
        }
        return value;
    })
    genders?: string[];

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    excludeInactive?: boolean;
}

