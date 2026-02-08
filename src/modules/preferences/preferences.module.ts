import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Preference } from './entities/preference.entity';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

@Module({
    imports: [TypeOrmModule.forFeature([Preference])],
    controllers: [PreferencesController],
    providers: [PreferencesService],
    exports: [PreferencesService],
})
export class PreferencesModule { }
