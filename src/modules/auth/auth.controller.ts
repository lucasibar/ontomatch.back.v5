import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(body.email, body.password);
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }
        return this.authService.login(user);
    }

    @Post('register')
    async register(@Body() body: RegisterDto) {
        return this.authService.register(body);
    }

    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        await this.authService.sendResetCode(email);
        return { message: 'Si el correo existe, se enviaron las instrucciones.' };
    }

    @Post('reset-password')
    async resetPassword(@Body() body: any) {
        await this.authService.resetUserPassword(body.email, body.code, body.newPassword);
        return { message: 'Contraseña actualizada con éxito' };
    }
}
