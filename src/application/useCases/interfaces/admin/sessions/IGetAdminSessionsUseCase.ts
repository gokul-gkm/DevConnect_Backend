import { IAdminSession, IPagination } from '@/domain/types/session';

export interface AdminSessionWithMeta extends IAdminSession {
    formattedDate: string;
    formattedTime: string;
}

export interface AdminSessionsResponse {
    sessions: AdminSessionWithMeta[];
    pagination: IPagination;
}

export interface IGetAdminSessionsUseCase {
    execute(
        status: string[],
        page: number,
        limit: number,
        search: string
    ): Promise<AdminSessionsResponse>;
}