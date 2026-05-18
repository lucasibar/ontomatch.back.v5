import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Match } from '../matches/entities/match.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';
import { Swipe } from '../swipes/entities/swipe.entity';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(
        @InjectRepository(User)
        private usersRepo: Repository<User>,
        @InjectRepository(Profile)
        private profilesRepo: Repository<Profile>,
        @InjectRepository(Match)
        private matchesRepo: Repository<Match>,
        @InjectRepository(Conversation)
        private conversationsRepo: Repository<Conversation>,
        @InjectRepository(Message)
        private messagesRepo: Repository<Message>,
        @InjectRepository(Swipe)
        private swipesRepo: Repository<Swipe>,
        private dataSource: DataSource,
    ) {}

    /**
     * Checks if a userId corresponds to the admin email.
     */
    async isAdmin(userId: string): Promise<boolean> {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) return false;

        const user = await this.usersRepo.findOne({ where: { id: userId } });
        return user?.email === adminEmail;
    }

    /**
     * Gets the admin user ID. Returns null if admin hasn't registered yet.
     */
    async getAdminUserId(): Promise<string | null> {
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) return null;

        const admin = await this.usersRepo.findOne({ where: { email: adminEmail } });
        return admin?.id || null;
    }

    /**
     * Creates a match + conversation + welcome message between admin and a new user.
     * The admin must have registered normally first.
     */
    async createWelcomeChat(newUserId: string): Promise<void> {
        const adminId = await this.getAdminUserId();

        if (!adminId) {
            this.logger.warn('Admin user has not registered yet. Skipping welcome chat.');
            return;
        }

        // Don't create a welcome chat for the admin itself
        if (newUserId === adminId) return;

        // Check if match already exists
        const [low, high] = [adminId, newUserId].sort();
        const existingMatch = await this.matchesRepo.findOne({
            where: { userLowId: low, userHighId: high }
        });

        if (existingMatch) {
            this.logger.log(`Welcome chat already exists for user ${newUserId}`);
            return;
        }

        const WELCOME_MESSAGE = '¡Hola! 👋 Bienvenido/a a OntoMatch. Si tenés alguna pregunta, problema o sugerencia, escribinos por acá. ¡Estamos para ayudarte!';

        // Create match + conversation + welcome message in a transaction
        await this.dataSource.transaction(async (manager) => {
            const match = await manager.save(Match, {
                userLowId: low,
                userHighId: high,
            });

            const conversation = await manager.save(Conversation, {
                matchId: match.id,
                lastMessageAt: new Date(),
            });

            await manager.save(Message, {
                conversation: { id: conversation.id },
                senderUserId: adminId,
                body: WELCOME_MESSAGE,
            });
        });

        this.logger.log(`Welcome chat created for user ${newUserId}`);
    }

    /**
     * Returns app-wide metrics. Only callable by admin.
     */
    async getMetrics() {
        const totalUsers = await this.usersRepo.count();
        const onboardedProfiles = await this.profilesRepo.count({ where: { isOnboarded: true } });
        const totalMatches = await this.matchesRepo.count();
        const totalMessages = await this.messagesRepo.count();
        const totalSwipes = await this.swipesRepo.count();
        const suspendedUsers = await this.usersRepo.count({ where: { status: 'suspended' } });

        // Users registered in last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentUsers = await this.usersRepo
            .createQueryBuilder('u')
            .where('u.created_at > :weekAgo', { weekAgo })
            .getCount();

        // Users active in last 7 days
        const activeUsers = await this.usersRepo
            .createQueryBuilder('u')
            .where('u.last_login_at > :weekAgo', { weekAgo })
            .getCount();

        // Swipes in last 7 days
        const recentSwipes = await this.swipesRepo
            .createQueryBuilder('s')
            .where('s.created_at > :weekAgo', { weekAgo })
            .getCount();

        // Matches in last 7 days
        const recentMatches = await this.matchesRepo
            .createQueryBuilder('m')
            .where('m.created_at > :weekAgo', { weekAgo })
            .getCount();

        // Messages in last 7 days
        const recentMessages = await this.messagesRepo
            .createQueryBuilder('msg')
            .where('msg.created_at > :weekAgo', { weekAgo })
            .getCount();

        // Match rate (matches / total likes)
        const totalLikes = await this.swipesRepo.count({ where: { action: 'LIKE' as any } });
        const matchRate = totalLikes > 0 ? ((totalMatches / totalLikes) * 100).toFixed(1) : '0';

        // Avg messages per conversation
        const avgMessages = totalMatches > 0 ? (totalMessages / totalMatches).toFixed(1) : '0';

        // Onboarding completion rate
        const onboardingRate = totalUsers > 0 ? ((onboardedProfiles / totalUsers) * 100).toFixed(1) : '0';

        return {
            overview: {
                totalUsers,
                onboardedProfiles,
                totalMatches,
                totalMessages,
                totalSwipes,
                suspendedUsers,
            },
            last7days: {
                newUsers: recentUsers,
                activeUsers,
                swipes: recentSwipes,
                matches: recentMatches,
                messages: recentMessages,
            },
            rates: {
                matchRate: `${matchRate}%`,
                avgMessagesPerMatch: avgMessages,
                onboardingCompletion: `${onboardingRate}%`,
            }
        };
    }

    /**
     * Get all conversations for admin (support view).
     * Returns ALL conversations in the system, not just admin's matches.
     */
    async getAllConversations() {
        const conversations = await this.conversationsRepo.createQueryBuilder('conv')
            .leftJoinAndSelect('conv.match', 'match')
            .leftJoinAndSelect('match.userLow', 'userLow')
            .leftJoinAndSelect('userLow.profile', 'profileLow')
            .leftJoinAndSelect('userLow.photos', 'photosLow')
            .leftJoinAndSelect('match.userHigh', 'userHigh')
            .leftJoinAndSelect('userHigh.profile', 'profileHigh')
            .leftJoinAndSelect('userHigh.photos', 'photosHigh')
            .leftJoinAndSelect('conv.messages', 'messages')
            .orderBy('conv.lastMessageAt', 'DESC')
            .addOrderBy('conv.createdAt', 'DESC')
            .getMany();

        return conversations
            .filter(conv => conv.match)
            .map(conv => {
                const lastMsg = conv.messages?.length > 0
                    ? conv.messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
                    : null;

                const photosLow = conv.match.userLow?.photos || [];
                photosLow.sort((a, b) => a.position - b.position);
                const photosHigh = conv.match.userHigh?.photos || [];
                photosHigh.sort((a, b) => a.position - b.position);

                return {
                    id: conv.id,
                    userLow: {
                        id: conv.match.userLow?.id,
                        name: conv.match.userLow?.profile?.name || 'Unknown',
                        photoUrl: photosLow.length > 0 ? photosLow[0].url : null,
                    },
                    userHigh: {
                        id: conv.match.userHigh?.id,
                        name: conv.match.userHigh?.profile?.name || 'Unknown',
                        photoUrl: photosHigh.length > 0 ? photosHigh[0].url : null,
                    },
                    lastMessage: lastMsg ? {
                        body: lastMsg.body,
                        createdAt: lastMsg.createdAt,
                        senderUserId: lastMsg.senderUserId,
                    } : null,
                    messageCount: conv.messages?.length || 0,
                    updatedAt: conv.lastMessageAt || conv.createdAt,
                };
            });
    }
}
