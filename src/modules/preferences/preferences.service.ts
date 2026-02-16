
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preference } from './entities/preference.entity';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
    constructor(
        @InjectRepository(Preference)
        private preferencesRepo: Repository<Preference>,
    ) { }

    async findOne(userId: string) {
        return this.preferencesRepo.findOne({ where: { user_id: userId } });
    }

    async update(userId: string, dto: UpdatePreferencesDto) {
        console.log('QueryBuilder Update for:', userId, 'Payload:', dto);

        const values: any = {};
        if (dto.ageMin !== undefined) values.ageMin = dto.ageMin;
        if (dto.ageMax !== undefined) values.ageMax = dto.ageMax;
        if (dto.distanceKm !== undefined) values.distanceKm = dto.distanceKm;
        if (dto.gendersAllowed !== undefined) values.gendersAllowed = dto.gendersAllowed;

        // Explicitly update timestamp since helper bypasses hooks
        values.updatedAt = new Date();

        // Try UPDATE first
        const result = await this.preferencesRepo.createQueryBuilder()
            .update(Preference)
            .set(values)
            .where("user_id = :id", { id: userId })
            .returning('*') // Works in Postgres to get back data
            .execute();

        if (result.affected === 0) {
            const newPref = this.preferencesRepo.create({
                user_id: userId,
                distanceKm: dto.distanceKm ?? 50,
                ageMin: dto.ageMin ?? 18,
                ageMax: dto.ageMax ?? 99,
                gendersAllowed: dto.gendersAllowed ?? []
            });
            return this.preferencesRepo.save(newPref);
        }

        // Fetch to confirm return
        return this.findOne(userId);
    }
}
