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
        }
    }

    async sendMatchNotification(
        toEmail: string,
        toName: string,
        partnerName: string,
        partnerPhotoUrl: string | null
    ): Promise<void> {
        try {
            const photoHtml = partnerPhotoUrl
                ? `<div style="text-align: center; margin: 24px 0;">
                     <img src="${partnerPhotoUrl}" alt="${partnerName}" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 8px 30px rgba(0,0,0,0.15);" />
                   </div>`
                : '';

            await this.resend.emails.send({
                from: 'OntoMatch <onboarding@resend.dev>',
                to: toEmail,
                subject: `¡Tenés un nuevo Match con ${partnerName}! 🎉 - OntoMatch`,
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fafafa; border-radius: 16px; border: 1px solid #eaeaea;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <span style="font-size: 13px; font-weight: 800; letter-spacing: 2px; color: #ea00d9; text-transform: uppercase;">¡ES UN MATCH!</span>
                            <h1 style="font-size: 28px; font-weight: 900; color: #1a1a1a; margin: 8px 0 0 0;">OntoMatch</h1>
                        </div>
                        
                        <p style="color: #333; font-size: 16px; line-height: 1.6; text-align: center;">
                            Hola <b>${toName}</b>, ¡el ser y la ontología se han alineado!
                        </p>
                        
                        <p style="color: #555; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                            Hiciste match recíproco con <b>${partnerName}</b>. ¡Es el momento ideal para iniciar una conversación!
                        </p>
                        
                        ${photoHtml}
                        
                        <div style="text-align: center; margin: 32px 0 24px 0;">
                            <a href="${process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173'}/matches" style="background: linear-gradient(135deg, #ea00d9 0%, #711c91 100%); color: white; padding: 16px 36px; font-weight: bold; font-size: 16px; text-decoration: none; border-radius: 30px; box-shadow: 0 8px 20px rgba(234,0,217,0.3); display: inline-block;">
                                Enviar un mensaje
                            </a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0;" />
                        
                        <p style="color: #999; font-size: 12px; line-height: 1.5; text-align: center;">
                            OntoMatch - Tu match desde el ser.
                        </p>
                    </div>
                `,
            });
        } catch (error) {
            console.error('Error sending match email:', error);
        }
    }
}
