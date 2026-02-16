
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*', // Adjust for production
    },
    namespace: 'chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private messagesService: MessagesService,
        private jwtService: JwtService,
        private configService: ConfigService
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = this.extractToken(client);
            if (!token) throw new UnauthorizedException('No token provided');

            const secret = this.configService.get<string>('JWT_SECRET');
            const payload = this.jwtService.verify(token, { secret });

            // Attach user to socket
            client.data.user = payload;

            // Join user's personal room for notifications
            client.join(`user_${payload.sub}`);

            console.log(`Client connected: ${client.id} (User: ${payload.sub})`);
        } catch (e) {
            console.error('Socket connection failed:', e.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinConversation')
    handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
        client.join(`conv_${conversationId}`);
        console.log(`User ${client.data.user.sub} joined conversation ${conversationId}`);
        return { event: 'joined', conversationId };
    }

    @SubscribeMessage('leaveConversation')
    handleLeaveConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
        client.leave(`conv_${conversationId}`);
        return { event: 'left', conversationId };
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() dto: CreateMessageDto) {
        const userId = client.data.user.sub;

        // 1. Save to DB
        const savedMessage = await this.messagesService.create(userId, dto);

        // 2. Emit to Room (conversation)
        this.server.to(`conv_${dto.conversationId}`).emit('receiveMessage', savedMessage);

        return savedMessage;
    }

    private extractToken(client: Socket): string | undefined {
        const auth = client.handshake.auth.token || client.handshake.headers.authorization;
        if (!auth) return undefined;
        const [type, token] = auth.split(' ');
        return type === 'Bearer' ? token : auth;
    }
}
