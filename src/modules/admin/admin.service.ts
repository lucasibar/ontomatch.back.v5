import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile, Gender, LookingFor } from '../profiles/entities/profile.entity';
import { Match } from '../matches/entities/match.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { Message } from '../messages/entities/message.entity';
import { randomBytes, scryptSync } from 'crypto';

const WELCOME_MESSAGE = '¡Hola! 👋 Bienvenido/a a OntoMatch. Si tenés alguna pregunta, problema o sugerencia, escribinos por acá. ¡Estamos para ayudarte!';

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
        private dataSource: DataSource,
    ) {}

    /**
     * Ensures the admin user exists. Called on app bootstrap.
     */
    async ensureAdminExists(): Promise<string> {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminName = process.env.ADMIN_NAME || 'OntoMatch';

        if (!adminEmail || !adminPassword) {
            this.logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin creation.');
            return '';
        }

        let admin = await this.usersRepo.findOne({ where: { email: adminEmail } });

        if (!admin) {
            this.logger.log('Creating admin user...');
            const salt = randomBytes(16).toString('hex');
            const hashedPassword = scryptSync(adminPassword, salt, 64).toString('hex');
            const passwordHash = `${salt}:${hashedPassword}`;

            admin = this.usersRepo.create({
                email: adminEmail,
                passwordHash,
                isEmailVerified: true,
                status: 'active',
            });
            admin = await this.usersRepo.save(admin);

            // Create admin profile
            const profile = this.profilesRepo.create({
                user_id: admin.id,
                name: adminName,
                birthdate: new Date('2000-01-01'),
                gender: Gender.OTHER,
                bio: 'Soporte oficial de OntoMatch. Escribinos si necesitás ayuda.',
                locationText: 'Argentina',
                looking_for: LookingFor.UNSPECIFIED,
                isOnboarded: true,
            });
            await this.profilesRepo.save(profile);

            this.logger.log(`Admin user created with ID: ${admin.id}`);
        }

        return admin.id;
    }

    /**
     * Creates a match + conversation + welcome message between admin and a new user.
     * Called after user registration.
     */
    async createWelcomeChat(newUserId: string): Promise<void> {
        const adminId = await this.ensureAdminExists();

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
}
