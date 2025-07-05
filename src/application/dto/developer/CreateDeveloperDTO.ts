export interface CreateDeveloperDTO {
    expertise: string[];
    hourlyRate: number;
    education: {
        degree: string;
        institution: string;
        year: number;
    };
    languages: string[];
    workingExperience: {
        companyName: string;
        experience: number;
        jobTitle: string;
    };
    userId: string;
    resume?: string;
 
}