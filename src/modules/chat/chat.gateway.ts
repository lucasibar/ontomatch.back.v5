import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    ConnectedSocket,
    MessageBody,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ConversationsService } from '../conversations/conversations.service';

@WebSocketGateway({
    cors: { origin: '*', credentials: true }, // Customize for production
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        private chatService: ChatService,
        private conversationsService: ConversationsService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token =
                client.handshake.auth.token ||
                client.handshake.headers.authorization?.split(' ')[1];
            if (!token) throw new Error('No token');

            const payload = this.jwtService.verify(token);
            client.data.userId = payload.sub;
        } catch (e) {
            client.disconnect();
        }
    }

    @SubscribeMessage('joinConversation')
    async handleJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string },
    ) {
        const userId = client.data.userId;
        // Security Check: is user in this match?
        // const canAccess = await this.conversationsService.canAccess(userId, payload.conversationId);
        // if (!canAccess) throw new WsException('Forbidden');

        client.join(`conversation:${payload.conversationId}`);
        return { joined: true };
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { conversationId: string; body: string },
    ) {
        const userId = client.data.userId;
        // Save to DB
        const message = await this.chatService.createMessage(
            payload.conversationId,
            userId,
            payload.body,
        );

        // Broadcast
        this.server
            .to(`conversation:${payload.conversationId}`)
            .emit('messageReceived', message);

        return message;
    }
}
