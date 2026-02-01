import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Conversation } from '../../conversations/entities/conversation.entity';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
@Index('idx_messages_conv_created', ['conversation', 'createdAt'])
@Index('idx_messages_conv_read', ['conversation', 'readAt'])
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation: Conversation;

    @Column({ name: 'sender_user_id' })
    senderUserId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sender_user_id' })
    senderUser: User;

    @Column('text')
    body: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
    readAt: Date;
}
