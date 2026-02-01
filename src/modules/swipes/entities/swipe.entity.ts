import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SwipeAction {
    LIKE = 'LIKE',
    PASS = 'PASS',
}

@Entity('swipes')
@Unique(['swiperUserId', 'targetUserId'])
@Index('idx_swipes_swiper_created', ['swiperUserId', 'createdAt'])
export class Swipe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'swiper_user_id' })
    swiperUserId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'swiper_user_id' })
    swiperUser: User;

    @Column({ name: 'target_user_id' })
    targetUserId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'target_user_id' })
    targetUser: User;

    @Column({ type: 'enum', enum: SwipeAction })
    action: SwipeAction;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
