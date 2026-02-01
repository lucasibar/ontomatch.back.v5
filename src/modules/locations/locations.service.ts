import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private repo: Repository<Location>,
    ) { }

    async search(query: string) {
        if (!query) return [];

        // ILIKE for case insensitive
        return this.repo.find({
            where: {
                locality: Like(`${query}%`) // Only prefix match for performance or `%${query}%` for fuzzy
            },
            take: 10,
        });
    }
}
