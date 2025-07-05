export interface IProject {
    _id: string;
    title: string;
    category: string;
    description: string;
    projectLink?: string;
    coverImage: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalProjects: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
}

export interface ProjectsResponse {
    projects: IProject[];
    pagination: PaginationInfo;
}