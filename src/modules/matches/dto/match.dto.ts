
export class MatchDto {
    id: string;
    partner: {
        id: string;
        name: string;
        photoUrl: string | null;
    };
    conversationId: string | null;
    createdAt: Date;
}
