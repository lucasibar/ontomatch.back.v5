export class GetFeedDto {
    distanceKm?: number;
    limit?: number;
    cursor?: string;

    minAge?: number;
    maxAge?: number;
    genders?: string[]; // comma separated in query? NestJS handles arrays if repeatedly used, or transform.
    excludeInactive?: boolean;
}
