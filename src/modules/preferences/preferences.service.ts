
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
        let preference = await this.findOne(userId);
        if (!preference) {
            preference = this.preferencesRepo.create({
                user_id: userId,
                distanceKm: 50,
                ageMin: 18,
                ageMax: 99,
                gendersAllowed: []
            });
        }

        Object.assign(preference, dto);
        return this.preferencesRepo.save(preference);
    }
}
