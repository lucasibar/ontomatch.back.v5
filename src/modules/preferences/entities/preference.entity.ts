import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('preferences')
export class Preference {
    @PrimaryGeneratedColumn('uuid')
    user_id: string;

    @OneToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'age_min' })
    ageMin: number;

    @Column({ name: 'age_max' })
    ageMax: number;

    @Column({ name: 'distance_km' })
    distanceKm: number;

    @Column('text', { array: true, name: 'genders_allowed' })
    gendersAllowed: string[];

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
