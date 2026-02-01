import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Preference } from './entities/preference.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Preference])],
    providers: [],
    exports: [TypeOrmModule],
})
export class PreferencesModule { }
