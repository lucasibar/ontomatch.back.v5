import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: configService.get('CLOUDINARY_CLOUD_NAME'),
            api_key: configService.get('CLOUDINARY_API_KEY'),
            api_secret: configService.get('CLOUDINARY_API_SECRET'),
        });
    }

    getSignature() {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp: timestamp,
                folder: 'ontomatch/profiles', // Optional
            },
            this.configService.get<string>('CLOUDINARY_API_SECRET') || '',
        );
        return { timestamp, signature, apiKey: this.configService.get('CLOUDINARY_API_KEY'), cloudName: this.configService.get('CLOUDINARY_CLOUD_NAME') };
    }
}
