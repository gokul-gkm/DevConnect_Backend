
import { IProject } from "../../entities/Project";
import { ProjectsResponse } from "../../types/project";
import { IBaseRepository } from "./IBaseRepository";

export interface IProjectRepository extends IBaseRepository<IProject> {
    addProject(project: Partial<IProject>): Promise<IProject>;
    getDeveloperProjects(userId: string, page: number, limit: number): Promise<ProjectsResponse>;
    getProjectById(projectId: string): Promise<IProject>
    updateProject(projectId: string, updateData: Partial<IProject>): Promise<IProject>
    deleteProject(projectId: string): Promise<void>
    findProjectByCategory(category: string): Promise<IProject[]> 
}