
import { IProject } from "../entities/Project";
import { ProjectsResponse } from "../types/project";

export interface IProjectRepository {
    addProject(project: Partial<IProject>): Promise<any>;
    getDeveloperProjects(
        userId: string,
        page: number,
        limit: number
    ): Promise<ProjectsResponse>;
}