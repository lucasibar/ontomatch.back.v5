import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { ProfilePhoto } from '../../profiles/entities/profile-photo.entity';
import { Preference } from '../../preferences/entities/preference.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true, name: 'password_hash' })
    passwordHash: string;

    @Column({ unique: true, nullable: true, name: 'google_id' })
    googleId: string;

    @Column({ default: false, name: 'is_email_verified' })
    isEmailVerified: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
    lastLoginAt: Date;

    @OneToOne(() => Profile, (profile) => profile.user)
    profile: Profile;

    @OneToMany(() => ProfilePhoto, (photo) => photo.user)
    photos: ProfilePhoto[];

    @OneToOne(() => Preference, (pref) => pref.user)
    preferences: Preference;
}
