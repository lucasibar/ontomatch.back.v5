import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Location } from './entities/location.entity';

@Injectable()
export class LocationsService {
    constructor(
        @InjectRepository(Location)
        private repo: Repository<Location>,
    ) { }

    async search(query: string) {
        if (!query || query.length < 3) return []; // Minimum 3 chars to search

        return this.repo.find({
            where: [
                { locality: ILike(`%${query}%`) },
                { province: ILike(`%${query}%`) }
            ],
            take: 10,
            order: { locality: 'ASC' }
        });
    }
}
