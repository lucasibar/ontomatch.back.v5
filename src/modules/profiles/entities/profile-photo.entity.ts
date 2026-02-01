import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('profile_photos')
@Unique(['user', 'position'])
export class ProfilePhoto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    user_id: string;

    @ManyToOne(() => User, (user) => user.photos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    url: string;

    @Column({ name: 'public_id' })
    publicId: string;

    @Column('int')
    position: number;

    @Column({ default: true, name: 'is_active' })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
