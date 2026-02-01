import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('blocks')
@Unique(['blockerId', 'blockedId'])
export class Block {
    @PrimaryGeneratedColumn('uuid')
    id: string; // Helper PK, though we could use composite

    @Column({ name: 'blocker_id' })
    @Index('idx_blocks_blocker')
    blockerId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'blocker_id' })
    blocker: User;

    @Column({ name: 'blocked_id' })
    @Index('idx_blocks_blocked')
    blockedId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'blocked_id' })
    blocked: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
