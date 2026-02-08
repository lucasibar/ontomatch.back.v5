import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, Gender } from './entities/profile.entity';
import { ProfilePhoto } from './entities/profile-photo.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Location } from '../locations/entities/location.entity';
import { CloudinaryService } from '../media/cloudinary.service';

@Injectable()
export class ProfilesService {
    constructor(
        @InjectRepository(Profile)
        private profilesRepo: Repository<Profile>,
        @InjectRepository(ProfilePhoto)
        private photosRepo: Repository<ProfilePhoto>,
        @InjectRepository(Location)
        private locationsRepo: Repository<Location>,
        private cloudinaryService: CloudinaryService, // Injected
    ) { }

    async getMyProfile(userId: string) {
        let profile = await this.profilesRepo.findOne({
            where: { user_id: userId },
            relations: ['user', 'user.photos'],
        });

        if (!profile) {
            // Self-healing: Create profile if missing
            const newProfile = this.profilesRepo.create({
                user_id: userId,
                name: 'New User',
                birthdate: new Date('2000-01-01'),
                gender: Gender.OTHER,
                bio: '',
            });
            await this.profilesRepo.save(newProfile);

            // Refetch with relations
            profile = await this.profilesRepo.findOne({
                where: { user_id: userId },
                relations: ['user', 'user.photos'],
            });
        }

        return profile;
    }

    async update(userId: string, dto: UpdateProfileDto) {
        let profile = await this.profilesRepo.findOne({ where: { user_id: userId } });

        if (!profile) {
            profile = this.profilesRepo.create({ user_id: userId });
        }

        if (dto.name) profile.name = dto.name;
        if (dto.birthdate) profile.birthdate = new Date(dto.birthdate);
        if (dto.gender) profile.gender = dto.gender;
        if (dto.genderCustom !== undefined) profile.genderCustom = dto.genderCustom;
        if (dto.orientation) profile.orientation = dto.orientation;
        if (dto.bio) profile.bio = dto.bio;
        if (dto.lookingFor) profile.looking_for = dto.lookingFor;
        if (dto.height) profile.height = dto.height;
        if (dto.neighborhood) profile.neighborhood = dto.neighborhood;

        if (dto.locationId) {
            const location = await this.locationsRepo.findOne({ where: { id: dto.locationId } });
            if (location) {
                profile.locationText = location.locality; // Default text
                profile.lat = location.lat;
                profile.lon = location.lon;
                profile.geom = location.geom;
            }
        }

        // Allow overriding location text specifically (e.g. slight correction)
        if (dto.locationText) profile.locationText = dto.locationText;

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

    async deletePhoto(userId: string, photoId: string) {
        const photo = await this.photosRepo.findOne({ where: { id: photoId, user_id: userId } });
        if (!photo) throw new Error('Photo not found');

        // Delete from Cloudinary
        if (photo.publicId) {
            await this.cloudinaryService.deleteImage(photo.publicId);
        }

        // Delete from DB
        await this.photosRepo.remove(photo);

        // Update onboarded status
        const count = await this.photosRepo.count({ where: { user_id: userId } });
        if (count < 3) {
            await this.profilesRepo.update(userId, { isOnboarded: false });
        }

        return { deleted: true, remaining: count };
    }

    async reorderPhotos(userId: string, photoIds: string[]) {
        // Naive implementation: iterate and update
        // Ensure all photos belong to user
        for (let i = 0; i < photoIds.length; i++) {
            await this.photosRepo.update(
                { id: photoIds[i], user_id: userId },
                { position: i + 1 }
            );
        }
        return { success: true };
    }
}
