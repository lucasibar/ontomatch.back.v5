import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConversationsService } from '../conversations/conversations.service';

@WebSocketGateway({
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'https://ontomatch.vercel.app',
            /^https:\/\/ontomatch.*\.vercel\.app$/,
        ],
        credentials: true,
    },
    namespace: 'chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private messagesService: MessagesService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private conversationsService: ConversationsService,
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
    async handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() conversationId: string) {
        const userId = client.data.user.sub;
        
        // Security Check
        const canAccess = await this.conversationsService.canAccess(userId, conversationId);
        if (!canAccess) {
            throw new WsException('Forbidden');
        }

        client.join(`conv_${conversationId}`);
        console.log(`User ${userId} joined conversation ${conversationId}`);
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

        // Security Check
        const canAccess = await this.conversationsService.canAccess(userId, dto.conversationId);
        if (!canAccess) {
            throw new WsException('Forbidden');
        }

        // 1. Save to DB
        const savedMessage = await this.messagesService.create(userId, dto);

        // 2. Emit to Room (conversation)
        this.server.to(`conv_${dto.conversationId}`).emit('receiveMessage', savedMessage);

        // 3. Emit real-time notification to the receiver's personal room
        try {
            const conv = await this.conversationsService.findOneWithMatch(dto.conversationId);
            if (conv && conv.match) {
                const receiverId = conv.match.userLowId === userId ? conv.match.userHighId : conv.match.userLowId;
                this.server.to(`user_${receiverId}`).emit('newMessageNotification', {
                    conversationId: dto.conversationId,
                    message: savedMessage,
                });
            }
        } catch (err) {
            console.error('Failed to send real-time notification:', err);
        }

        return savedMessage;
    }

    @SubscribeMessage('typing')
    async handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; isTyping: boolean }) {
        const userId = client.data.user.sub;
        // Broadcast typing status to other participants in the same conversation
        client.to(`conv_${data.conversationId}`).emit('userTyping', { userId, isTyping: data.isTyping });
    }

    private extractToken(client: Socket): string | undefined {
        const auth = client.handshake.auth.token || client.handshake.headers.authorization;
        if (!auth) return undefined;
        // Handle "Bearer <token>" or just "<token>"
        const parts = auth.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            return parts[1];
        }
        return auth;
    }
}
