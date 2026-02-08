import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (user && this.usersService.verifyPassword(pass, user.passwordHash)) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        // user passed here is what validateUser returns (without password)
        const payload = { email: user.email, sub: user.id, userId: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                isOnboarded: user.profile?.isOnboarded ?? false
            }
        };
    }

    async register(userDto: any) {
        const user = await this.usersService.create(userDto.email, userDto.password);
        return this.login(user);
    }

    // TODO: Implement register, google login, etc.
}
