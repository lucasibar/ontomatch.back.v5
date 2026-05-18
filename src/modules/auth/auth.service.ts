import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AdminService } from '../admin/admin.service';
import { EmailService } from './email.service';
import { randomInt } from 'crypto';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService,
        private adminService: AdminService,
        private emailService: EmailService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new NotFoundException('El email no está registrado');
        }

        if (user.status === 'suspended') {
            throw new UnauthorizedException('Tu cuenta ha sido suspendida por incumplimiento de las normas de la comunidad.');
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

    async sendResetCode(email: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            // No revelamos si el email existe o no por seguridad
            return;
        }

        const code = randomInt(100000, 999999).toString();
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

        await this.usersService.saveResetCode(email, code, expiry);
        await this.emailService.sendResetCode(email, code);
    }

    async resetUserPassword(email: string, code: string, newPassword: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Código inválido');
        }

        if (!user.resetCode || user.resetCode !== code) {
            throw new UnauthorizedException('Código inválido');
        }

        if (new Date() > user.resetCodeExpiry) {
            throw new UnauthorizedException('El código expiró. Solicitá uno nuevo.');
        }

        await this.usersService.updatePassword(email, newPassword);
        // Limpiar el código usado
        await this.usersService.saveResetCode(email, null, null);
    }
}
