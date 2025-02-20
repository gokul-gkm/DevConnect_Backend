interface Education {
    degree: string;
    institution: string;
    year: number;
}

interface WorkingExperience {
    jobTitle: string;
    companyName: string;
    experience: number;
}

interface SocialLinks {
    github: string;
    linkedIn: string;
    twitter: string;
    portfolio: string;
}

export interface ProfileUpdateData {
    username?: string;
    email?: string;
    contact?: string;
    bio?: string;
    profilePicture?: string;
    location?: string;

    hourlyRate: number;
    skills: string[];
    languages: string[];

    education: Education;
    workingExperience: WorkingExperience;
    socialLinks: SocialLinks;
}

export interface DeveloperProfileResponse {
    id: string;
    username: string;
    email: string;
    contact?: string;
    bio?: string;
    profilePicture?: string;
    hourlyRate: number;
    education: Education;
    languages: string[];
    skills: string[];
    workingExperience: WorkingExperience;
    socialLinks: SocialLinks;
    resume?: string;
    createdAt: Date;
    updatedAt: Date;
}