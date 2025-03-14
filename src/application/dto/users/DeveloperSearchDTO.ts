export interface DeveloperSearchDTO {
    search?: string;
    skills?: string[];
    languages?: string[];
    priceRange?: {
        min?: number;
        max?: number;
    };
    location?: string;
    sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_low' | 'price_high';
    page?: string | number;
    limit?: string | number;
}

export interface ValidatedSearchParams {
    search: string;
    skills: string[];
    languages: string[];
    priceRange?: {
        min?: number;
        max?: number;
    };
    location: string;
    sort: string;
    page: number;
    limit: number;
}

export interface DeveloperSearchResponse {
    developers: {
        _id: string;
        username: string;
        email: string;
        profilePicture?: string | null;
        title?: string;
        location?: string;
        socialLinks?: {
            github?: string;
            linkedin?: string;
            twitter?: string;
        };
        developerProfile: {
            title?: string;
            skills: string[];
            languages: string[];
            hourlyRate?: number;
            bio?: string;
        };
    }[];
    total: number;
    page: number;
    totalPages: number;
}