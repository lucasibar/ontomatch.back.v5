import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Swipe, SwipeAction } from '../swipes/entities/swipe.entity';

@Injectable()
export class ConversationsService {
    constructor(
        @InjectRepository(Conversation)
        private repo: Repository<Conversation>
    ) { }

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
            .leftJoinAndSelect('conv.messages', 'messages')
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

        const mappedConversations = await Promise.all(
            conversations
                .filter(conv => conv.match && (conv.match.userLow || conv.match.userHigh))
                .map(async (conv) => {
                    const isLow = conv.match.userLowId === userId;
                    const partner = isLow ? conv.match.userHigh : conv.match.userLow;

                    if (!partner) return null;

                    const photos = partner.photos || [];
                    photos.sort((a, b) => a.position - b.position);

                    const lastMsg = conv.messages && conv.messages.length > 0
                        ? conv.messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
                        : null;

                    // Check if there is a mutual match
                    const likes = await this.repo.manager.find(Swipe, {
                        where: [
                            { swiperUserId: userId, targetUserId: partner.id, action: SwipeAction.LIKE },
                            { swiperUserId: partner.id, targetUserId: userId, action: SwipeAction.LIKE }
                        ]
                    });
                    const isMutual = likes.length === 2;

                    // For the admin: it's a support chat if not mutual
                    let isSupportChat = false;
                    if (isAdmin) {
                        isSupportChat = !isMutual;
                    }

                    // For the standard user: if partner is the admin and not mutual, brand it as "OntoMatch"
                    let displayName = partner.profile?.name || 'Unknown';
                    let displayPhoto = photos.length > 0 ? photos[0].url : null;
                    let isSystemSupport = false;

                    if (!isAdmin && partner.email === adminEmail && !isMutual) {
                        displayName = 'OntoMatch';
                        displayPhoto = '/logo192.png'; // Or standard support avatar
                        isSystemSupport = true;
                    }

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
                            createdAt: lastMsg.createdAt,
                            senderId: lastMsg.senderUserId
                        } : null,
                        updatedAt: conv.lastMessageAt || conv.createdAt,
                        isSupportChat,
                    };
                })
        );

        // Standard user sees everything. Admin sees their normal matches in standard list (filtered below)
        return mappedConversations
            .filter(item => item !== null)
            .filter(item => {
                if (isAdmin) {
                    // Only return non-support (mutual matches) in standard list
                    return !item.isSupportChat;
                }
                return true;
            });
    }

    async findSupportConversations(userId: string) {
        // Return support conversations (non-mutual) for the admin
        const conversations = await this.repo.createQueryBuilder('conv')
            .leftJoinAndSelect('conv.match', 'match')
            .leftJoinAndSelect('match.userLow', 'userLow')
            .leftJoinAndSelect('userLow.profile', 'profileLow')
            .leftJoinAndSelect('userLow.photos', 'photosLow')
            .leftJoinAndSelect('match.userHigh', 'userHigh')
            .leftJoinAndSelect('userHigh.profile', 'profileHigh')
            .leftJoinAndSelect('userHigh.photos', 'photosHigh')
            .leftJoinAndSelect('conv.messages', 'messages')
            .where('(match.userLowId = :userId OR match.userHighId = :userId)', { userId })
            .andWhere(`(
                (match.userLowId = :userId AND userHigh.status != 'suspended') 
                OR 
                (match.userHighId = :userId AND userLow.status != 'suspended')
            )`)
            .orderBy('conv.lastMessageAt', 'DESC')
            .addOrderBy('conv.createdAt', 'DESC')
            .getMany();

        const mappedConversations = await Promise.all(
            conversations
                .filter(conv => conv.match && (conv.match.userLow || conv.match.userHigh))
                .map(async (conv) => {
                    const isLow = conv.match.userLowId === userId;
                    const partner = isLow ? conv.match.userHigh : conv.match.userLow;

                    if (!partner) return null;

                    const likes = await this.repo.manager.find(Swipe, {
                        where: [
                            { swiperUserId: userId, targetUserId: partner.id, action: SwipeAction.LIKE },
                            { swiperUserId: partner.id, targetUserId: userId, action: SwipeAction.LIKE }
                        ]
                    });
                    const isSupportChat = likes.length < 2;

                    if (!isSupportChat) return null;

                    const photos = partner.photos || [];
                    photos.sort((a, b) => a.position - b.position);

                    const lastMsg = conv.messages && conv.messages.length > 0
                        ? conv.messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
                        : null;

                    return {
                        id: conv.id,
                        partner: {
                            id: partner.id,
                            name: partner.profile?.name || 'Unknown',
                            photoUrl: photos.length > 0 ? photos[0].url : null,
                        },
                        lastMessage: lastMsg ? {
                            body: lastMsg.body,
                            createdAt: lastMsg.createdAt,
                            senderId: lastMsg.senderUserId
                        } : null,
                        updatedAt: conv.lastMessageAt || conv.createdAt,
                        isSupportChat: true,
                    };
                })
        );

        return mappedConversations.filter(item => item !== null);
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
}
