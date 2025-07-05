export interface DevRequestDTO {
    username: string;
    email: string;
    phoneCode: string;
    phoneNumber: string;
    bio: string;
    sessionCost: number;
    expertise: string[];
    languages: string[];
    degree: string;
    institution: string;
    year: string;
    jobTitle: string;
    company: string;
    experience: string;
    github?: string;
    linkedin?: string;
    twitter?: string;
    portfolio?: string;
    profileImageUrl?: string;
    resumeUrl?: string;
    socialLinks?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
        portfolio?: string;
    }
}