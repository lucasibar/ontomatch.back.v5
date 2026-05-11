import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService,
        private adminService: AdminService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('El email no está registrado');
        }

        if (!this.usersService.verifyPassword(pass, user.passwordHash)) {
            throw new UnauthorizedException('Contraseña incorrecta');
        }

        const { passwordHash, ...result } = user;
        return result;
    }

    async login(user: any) {
        // user passed here is what validateUser returns (without password)
        const payload = { email: user.email, sub: user.id, userId: user.id };

        // Update last login
        await this.usersService.updateLastLogin(user.id);

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

        // Create welcome chat with the admin account
        try {
            await this.adminService.createWelcomeChat(user.id);
        } catch (e) {
            console.error('Failed to create welcome chat:', e);
            // Don't block registration if welcome chat fails
        }

        return this.login(user);
    }
}
