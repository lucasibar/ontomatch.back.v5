import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { ProfilePhoto } from './entities/profile-photo.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Location } from '../locations/entities/location.entity';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectRepository(Profile)
        private profilesRepo: Repository<Profile>,
        @InjectRepository(ProfilePhoto)
        private photosRepo: Repository<ProfilePhoto>,
        @InjectRepository(Location)
        private locationsRepo: Repository<Location>,
    ) { }

    async getMyProfile(userId: string) {
        return this.profilesRepo.findOne({
            where: { user_id: userId },
            relations: ['user'], // adjust as needed
        });
    }

    async update(userId: string, dto: UpdateProfileDto) {
        // Check if profile exists, if not create
        let profile = await this.profilesRepo.findOne({ where: { user_id: userId } });

        if (!profile) {
            profile = this.profilesRepo.create({ user_id: userId });
        }

        // Map basic fields
        profile.name = dto.name;
        profile.birthdate = new Date(dto.birthdate);
        profile.gender = dto.gender;
        profile.orientation = dto.orientation;
        profile.bio = dto.bio;
        profile.looking_for = dto.lookingFor;
        // Mark as onboarded only if photos exist? Or handled separately.
        // For now, if we have basic info + location, we can set part of onboarded.
        // Ideally is_onboarded = true only when photos >= 3

        // Handle Location
        if (dto.locationId) {
            const location = await this.locationsRepo.findOne({ where: { id: dto.locationId } });
            if (location) {
                profile.locationText = location.locality;
                profile.lat = location.lat;
                profile.lon = location.lon;
                profile.geom = location.geom;
            }
        }

        // Save
        return await this.profilesRepo.save(profile);
    }

    async addPhoto(userId: string, url: string, publicId: string) {
        // Count existing
        const count = await this.photosRepo.count({ where: { user_id: userId } });
        if (count >= 6) throw new Error('Max photos reached');

        const photo = this.photosRepo.create({
            user_id: userId,
            url,
            publicId,
            position: count + 1,
        });

        await this.photosRepo.save(photo);

        // Check if ready to be onboarded
        if (count + 1 >= 3) { // Require 3 photos
            await this.profilesRepo.update(userId, { isOnboarded: true });
        }

        return photo;
    }
}
