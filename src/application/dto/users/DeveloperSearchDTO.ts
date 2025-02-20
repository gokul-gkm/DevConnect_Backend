export interface DeveloperSearchDTO {
    search?: string;
    skills?: string[];
    experience?: string;
    availability?: string;
    location?: string;
    sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'experience_high' | 'experience_low';
    page?: string | number;
    limit?: string | number;
}


export interface ValidatedSearchParams {
    search: string;
    skills: string[];
    experience?: string;
    availability?: string;
    location?: string;
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
            experience: string;
            availability: string;
            bio?: string;
            yearsOfExperience?: number;
        };
    }[];
    total: number;
    page: number;
    totalPages: number;
}