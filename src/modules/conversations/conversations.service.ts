import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Message } from '../messages/entities/message.entity';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private repo: Repository<Conversation>
    ) { }

    async updateLastMessageAt(conversationId: string, lastMessageAt: Date): Promise<void> {
        await this.repo.update(conversationId, { lastMessageAt });
    }

    async findAll(userId: string) {
        // Get conversations where user is part of the match
        const conversations = await this.repo.createQueryBuilder('conv')
            .leftJoinAndSelect('conv.match', 'match')
            .leftJoinAndSelect('match.userLow', 'userLow')
            .leftJoinAndSelect('userLow.profile', 'profileLow')
            .leftJoinAndSelect('userLow.photos', 'photosLow')
            .leftJoinAndSelect('match.userHigh', 'userHigh')
            .leftJoinAndSelect('userHigh.profile', 'profileHigh')
            .leftJoinAndSelect('userHigh.photos', 'photosHigh')
            .where('(match.userLowId = :userId OR match.userHighId = :userId)', { userId })
            // Exclude suspended partners
            .andWhere(`(
                (match.userLowId = :userId AND userHigh.status != 'suspended') 
                OR 
                (match.userHighId = :userId AND userLow.status != 'suspended')
            )`)
            .orderBy('conv.lastMessageAt', 'DESC')
            .addOrderBy('conv.createdAt', 'DESC')
            .getMany();

        const adminEmail = process.env.ADMIN_EMAIL;
        const user = await this.repo.manager.findOne(User, { where: { id: userId } });
        const isAdmin = user?.email === adminEmail;

        const conversationIds = conversations.map(c => c.id);
        
        let lastMessagesMap = new Map<string, any>();
        let unreadCountsMap = new Map<string, number>();

        if (conversationIds.length > 0) {
            const lastMsgs = await this.repo.manager.query(`
                SELECT DISTINCT ON (conversation_id) conversation_id, body, created_at as "createdAt", sender_user_id as "senderUserId"
                FROM messages
                WHERE conversation_id = ANY($1)
                ORDER BY conversation_id, created_at DESC
            `, [conversationIds]);

            for (const msg of lastMsgs) {
                lastMessagesMap.set(msg.conversation_id, msg);
            }

            const unreadCounts = await this.repo.manager.query(`
                SELECT conversation_id, COUNT(*) as "count"
                FROM messages
                WHERE conversation_id = ANY($1)
                  AND sender_user_id != $2
                  AND read_at IS NULL
                GROUP BY conversation_id
            `, [conversationIds, userId]);

            for (const countRow of unreadCounts) {
                unreadCountsMap.set(countRow.conversation_id, parseInt(countRow.count) || 0);
            }
        }

        const mappedConversations = conversations
            .filter(conv => conv.match && (conv.match.userLow || conv.match.userHigh))
            .map((conv) => {
                const isLow = conv.match.userLowId === userId;
                const partner = isLow ? conv.match.userHigh : conv.match.userLow;

                if (!partner) return null;

                const photos = partner.photos || [];
                photos.sort((a, b) => a.position - b.position);

                const lastMsg = lastMessagesMap.get(conv.id);
                const isSupportChat = conv.match.isSupport;

                // For standard users: if it is a support match, brand it as "OntoMatch"
                let displayName = partner.profile?.name || 'Unknown';
                let displayPhoto = photos.length > 0 ? photos[0].url : null;
                let isSystemSupport = false;

                if (isSupportChat) {
                    displayName = 'OntoMatch';
                    displayPhoto = '/logo192.png'; // Or standard support avatar
                    isSystemSupport = true;
                }

                // Compute unread count for this user
                const unreadCount = unreadCountsMap.get(conv.id) || 0;

                return {
                    id: conv.id,
                    partner: {
                        id: partner.id,
                        name: displayName,
                        photoUrl: displayPhoto,
                        isSystemSupport,
                    },
                    lastMessage: lastMsg ? {
                        body: lastMsg.body,
                        createdAt: new Date(lastMsg.createdAt),
                        senderId: lastMsg.senderUserId
                    } : null,
                    updatedAt: conv.lastMessageAt || conv.createdAt,
                    isSupportChat,
                    unreadCount,
                };
            })
            .filter(item => item !== null);

        // Standard user sees everything. Admin sees their normal matches in standard list (filtered below)
        return mappedConversations
            .filter(item => {
                if (isAdmin) {
                    // Only return non-support (mutual matches) in standard list
                    return !item.isSupportChat;
                }
                return true;
            });
    }

    async findSupportConversations(userId: string) {
        // Return support conversations (where match.isSupport is true) for the admin
        const conversations = await this.repo.createQueryBuilder('conv')
            .leftJoinAndSelect('conv.match', 'match')
            .leftJoinAndSelect('match.userLow', 'userLow')
            .leftJoinAndSelect('userLow.profile', 'profileLow')
            .leftJoinAndSelect('userLow.photos', 'photosLow')
            .leftJoinAndSelect('match.userHigh', 'userHigh')
            .leftJoinAndSelect('userHigh.profile', 'profileHigh')
            .leftJoinAndSelect('userHigh.photos', 'photosHigh')
            .where('(match.userLowId = :userId OR match.userHighId = :userId)', { userId })
            .andWhere('match.is_support = true')
            // Exclude suspended partners
            .andWhere(`(
                (match.userLowId = :userId AND userHigh.status != 'suspended') 
                OR 
                (match.userHighId = :userId AND userLow.status != 'suspended')
            )`)
            .orderBy('conv.lastMessageAt', 'DESC')
            .addOrderBy('conv.createdAt', 'DESC')
            .getMany();

        const conversationIds = conversations.map(c => c.id);
        
        let lastMessagesMap = new Map<string, any>();
        let unreadCountsMap = new Map<string, number>();

        if (conversationIds.length > 0) {
            const lastMsgs = await this.repo.manager.query(`
                SELECT DISTINCT ON (conversation_id) conversation_id, body, created_at as "createdAt", sender_user_id as "senderUserId"
                FROM messages
                WHERE conversation_id = ANY($1)
                ORDER BY conversation_id, created_at DESC
            `, [conversationIds]);

            for (const msg of lastMsgs) {
                lastMessagesMap.set(msg.conversation_id, msg);
            }

            const unreadCounts = await this.repo.manager.query(`
                SELECT conversation_id, COUNT(*) as "count"
                FROM messages
                WHERE conversation_id = ANY($1)
                  AND sender_user_id != $2
                  AND read_at IS NULL
                GROUP BY conversation_id
            `, [conversationIds, userId]);

            for (const countRow of unreadCounts) {
                unreadCountsMap.set(countRow.conversation_id, parseInt(countRow.count) || 0);
            }
        }

        return conversations
            .filter(conv => conv.match && (conv.match.userLow || conv.match.userHigh))
            .map((conv) => {
                const isLow = conv.match.userLowId === userId;
                const partner = isLow ? conv.match.userHigh : conv.match.userLow;

                if (!partner) return null;

                const photos = partner.photos || [];
                photos.sort((a, b) => a.position - b.position);

                const lastMsg = lastMessagesMap.get(conv.id);
                const unreadCount = unreadCountsMap.get(conv.id) || 0;

                return {
                    id: conv.id,
                    partner: {
                        id: partner.id,
                        name: partner.profile?.name || 'Unknown',
                        photoUrl: photos.length > 0 ? photos[0].url : null,
                    },
                    lastMessage: lastMsg ? {
                        body: lastMsg.body,
                        createdAt: new Date(lastMsg.createdAt),
                        senderId: lastMsg.senderUserId
                    } : null,
                    updatedAt: conv.lastMessageAt || conv.createdAt,
                    isSupportChat: true,
                    unreadCount,
                };
            })
            .filter(item => item !== null);
    }

    async findMessages(conversationId: string) {
        const conversation = await this.repo.findOne({
            where: { id: conversationId },
            relations: ['messages']
        });

        if (!conversation || !conversation.messages) {
            return [];
        }

        return conversation.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    async canAccess(userId: string, conversationId: string): Promise<boolean> {
        const conv = await this.repo.findOne({
            where: { id: conversationId },
            relations: ['match']
        });
        if (!conv || !conv.match) return false;

        return conv.match.userLowId === userId || conv.match.userHighId === userId;
    }

    async markAsRead(userId: string, conversationId: string): Promise<void> {
        const canAccess = await this.canAccess(userId, conversationId);
        if (!canAccess) throw new ForbiddenException('No tienes acceso a esta conversación');

        await this.repo.manager.createQueryBuilder()
            .update(Message)
            .set({ readAt: new Date() })
            .where('conversation_id = :conversationId', { conversationId })
            .andWhere('sender_user_id != :userId', { userId })
            .andWhere('read_at IS NULL')
            .execute();
    }

    async findOneWithMatch(conversationId: string) {
        return await this.repo.findOne({
            where: { id: conversationId },
            relations: ['match']
        });
    }
}
