import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req) => {
                    return req?.cookies?.Authentication || req?.headers?.authorization?.split(' ')[1];
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret',
        });
    }

    async validate(payload: any) {
        return { id: payload.sub, email: payload.email }; // req.user
    }
}
