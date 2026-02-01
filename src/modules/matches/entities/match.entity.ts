import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, Check, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

@Entity('matches')
@Unique(['userLowId', 'userHighId'])
@Check(`"user_low_id" < "user_high_id"`)
export class Match {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_low_id' })
    userLowId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_low_id' })
    userLow: User;

    @Column({ name: 'user_high_id' })
    userHighId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_high_id' })
    userHigh: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToOne(() => Conversation, (conversation) => conversation.match)
    conversation: Conversation;
}
