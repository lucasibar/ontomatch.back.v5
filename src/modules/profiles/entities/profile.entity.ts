import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import type { Point } from 'geojson';

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    NON_BINARY = 'non_binary',
    OTHER = 'other',
}

export enum Orientation {
    HETEROSEXUAL = 'heterosexual',
    HOMOSEXUAL = 'homosexual',
    BISEXUAL = 'bisexual',
    PANSEXUAL = 'pansexual',
    ASEXUAL = 'asexual',
    OTHER = 'other',
}

export enum LookingFor {
    SERIOUS = 'serious',
    CASUAL_DATING = 'casual_dating',
    SHORT_TERM = 'short_term',
    UNSPECIFIED = 'unspecified',
    // Legacy values kept for database compatibility during migration
    SESSIONS_1_ON_1 = 'sessions_1_on_1',
    NETWORKING = 'networking',
    RELATIONSHIP = 'relationship',
    CASUAL = 'casual',
}

export enum LocationMode {
    PRECISE = 'precise',
    APPROXIMATE = 'approximate',
    MANUAL = 'manual',
}

@Entity('profiles')
export class Profile {
    @PrimaryColumn('uuid')
    user_id: string; // Helper for PK, though it is a JoinColumn

    @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    name: string;

    @Column({ type: 'date' })
    @Index('idx_profiles_birthdate')
    birthdate: Date;

    @Column('int', { nullable: true })
    height: number; // New: Altura (cm)

    @Column({ type: 'enum', enum: Gender })
    gender: Gender;

    @Column({ nullable: true, name: 'gender_custom' })
    genderCustom: string; // New: Specify if other

    @Column('text')
    bio: string;

    @Column({ type: 'enum', enum: LookingFor, default: LookingFor.UNSPECIFIED })
    looking_for: LookingFor;

    @Column({ type: 'enum', enum: LocationMode, default: LocationMode.APPROXIMATE })
    location_mode: LocationMode;

    @Column({ name: 'location_text' })
    locationText: string;

    @Column({ name: 'neighborhood', nullable: true })
    neighborhood: string; // New: Barrio / Zona

    @Column('double precision', { nullable: true })
    lat: number;

    @Column('double precision', { nullable: true })
    lon: number;

    @Index('idx_profiles_geom', { spatial: true })
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    geom: Point;

    @Column({ nullable: true, name: 'coaching_school' })
    coachingSchool: string;

    @Column({ default: false, name: 'is_onboarded' })

    @Index('idx_profiles_onboarded', { where: 'is_onboarded = true' })
    isOnboarded: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
