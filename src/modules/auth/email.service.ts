import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private resend: Resend;

    constructor(private configService: ConfigService) {
        this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    }

    async sendResetCode(to: string, code: string): Promise<void> {
        try {
            await this.resend.emails.send({
                from: 'OntoMatch <onboarding@resend.dev>',
                to,
                subject: 'Tu código de recuperación - OntoMatch',
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fafafa; border-radius: 16px;">
                        <h1 style="font-size: 28px; font-weight: 800; color: #1a1a1a; margin-bottom: 8px;">OntoMatch</h1>
                        <p style="color: #666; font-size: 14px; margin-bottom: 32px;">Tu match desde el ser</p>
                        
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Recibimos tu solicitud para restablecer tu contraseña. Usá este código:
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: white;">${code}</span>
                        </div>
                        
                        <p style="color: #999; font-size: 13px; line-height: 1.5;">
                            Este código expira en <b>15 minutos</b>. Si no solicitaste este cambio, ignorá este email.
                        </p>
                    </div>
                `,
            });
        } catch (error) {
            console.error('Error sending reset email:', error);
            // No lanzamos error para no revelar si el email existe
        }
    }
}
