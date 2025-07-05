export interface AddProjectDTO {
    title: string;
    category: string;
    description: string;
    projectLink?: string;
    coverImage?: Express.Multer.File;
}