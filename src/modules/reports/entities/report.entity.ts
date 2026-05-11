import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('reports')
export class Report {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'reporter_id' })
    reporterId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reporter_id' })
    reporter: User;

    @Column({ name: 'reported_id' })
    reportedId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reported_id' })
    reported: User;

    @Column({ type: 'text' })
    reason: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
