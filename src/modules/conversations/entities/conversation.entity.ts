import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { Message } from '../../messages/entities/message.entity';

@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'match_id' })
    matchId: string;

    @OneToOne(() => Match, (match) => match.conversation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'match_id' })
    match: Match;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'timestamptz', nullable: true, name: 'last_message_at' })
    lastMessageAt: Date;

    @OneToMany(() => Message, (message) => message.conversation)
    messages: Message[];
}
