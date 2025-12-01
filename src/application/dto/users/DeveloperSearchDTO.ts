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
    title?: string | null;
    location?: string | null;
    socialLinks?: {
      github?: string | null;
      linkedin?: string | null;
      twitter?: string | null;
    } | null;
    developerProfile: {
      title?: string | null;
      skills: string[];
      languages: string[];
      hourlyRate?: number | null;
      bio?: string | null;
    };
  }[];
  total: number;
  page: number;
  totalPages: number;
}
