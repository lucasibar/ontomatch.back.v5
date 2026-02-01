import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeorefService {
    private readonly apiUrl = 'https://apis.datos.gob.ar/georef/api';
    private readonly logger = new Logger(GeorefService.name);

    constructor(private readonly httpService: HttpService) { }

    async fetchAllLocalities(max: number = 5000) {
        this.logger.log(`Fetching localities from Georef API (max: ${max})...`);
        const { data } = await firstValueFrom(
            this.httpService.get(`${this.apiUrl}/localidades`, {
                params: { max, campos: 'id,nombre,provincia.nombre,centroide' },
            }),
        );
        return data.localidades || [];
    }
}
