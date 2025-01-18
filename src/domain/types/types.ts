export interface QueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        currentPage: number;
        totalPages: number;
        limit: number;
    };
}
export interface DevQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
}

export interface DevPaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        currentPage: number;
        totalPages: number;
        limit: number;
    };
}