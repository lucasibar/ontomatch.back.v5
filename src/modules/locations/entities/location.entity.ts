import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, Index } from 'typeorm';
import type { Point } from 'geojson';

@Entity('locations')
@Unique('unique_location', ['province', 'locality'])
export class Location {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 'Argentina' })
    country: string;

    @Column()
    province: string;

    @Column({ nullable: true })
    department: string;

    @Column()
    locality: string;

    @Column('double precision')
    lat: number;

    @Column('double precision')
    lon: number;

    @Column({ nullable: true, unique: true, name: 'georef_id' })
    georefId: string;

    @Index('idx_locations_geom', { spatial: true })
    @Column({
        type: 'geography',
        spatialFeatureType: 'Point',
        srid: 4326,
        nullable: true,
    })
    geom: Point;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
