import { IProjectRepository } from "@/domain/interfaces/IProjectRepository";
import { IProject, Project } from "@/domain/entities/Project";
import { AppError } from "@/domain/errors/AppError";
import Developer from "@/domain/entities/Developer";
import { ProjectsResponse } from "@/domain/types/project";
import { StatusCodes } from "http-status-codes";
import { ERROR_MESSAGES } from "@/utils/constants";

export class ProjectRepository implements IProjectRepository {
    async addProject(project: Partial<IProject>) {
        try {
            const newProject = new Project({
                title: project.title,
                category: project.category,
                description: project.description,
                projectLink: project.projectLink || null,
                coverImage: project.coverImage || null
            });

            const savedProject = await newProject.save();
            return savedProject;
        } catch (error) {
            throw new AppError('Failed to add project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async getDeveloperProjects(userId: string, page: number, limit: number): Promise<ProjectsResponse> {
        try {
            const developer = await Developer.findOne({ userId });
            
            if (!developer) {
                throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND, StatusCodes.NOT_FOUND);
            }

            const projectIds = developer.portfolio;
            
            if (!projectIds || projectIds.length === 0) {
                return {
                    projects: [],
                    pagination: {
                        currentPage: page,
                        totalPages: 0,
                        totalProjects: 0,
                        hasNextPage: false,
                        hasPrevPage: false,
                        limit
                    }
                };
            }

            const skip = (page - 1) * limit;
            const objectIds = projectIds;

            const [projects, totalCount] = await Promise.all([
                Project.find({
                    _id: { $in: objectIds }
                })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean() as Promise<IProject[]>,
                Project.countDocuments({
                    _id: { $in: objectIds }
                })
            ]);

            const totalPages = Math.ceil(totalCount / limit);
            return {
                projects,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalProjects: totalCount,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    limit
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to fetch developer projects', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async getProjectById(projectId: string) {
        try {
            const project = await Project.findById(projectId);
            if (!project) {
                throw new AppError('Project not found', StatusCodes.NOT_FOUND);
            }
            return project;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to fetch project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async updateProject(projectId: string, updateData: Partial<IProject>) {
        try {
            const project = await Project.findByIdAndUpdate(
                projectId,
                { ...updateData },
                { new: true }
            );

            if (!project) {
                throw new AppError('Project not found', StatusCodes.NOT_FOUND);
            }

            return project;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to update project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteProject(projectId: string): Promise<void> {
        try {
            const project = await Project.findByIdAndDelete(projectId);
            if (!project) {
                throw new AppError('Project not found', StatusCodes.NOT_FOUND);
            }
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError('Failed to delete project', StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async findProjectByCategory(category: string): Promise<IProject[]> {
        try {
            const projects = await Project.find({ category })
            return projects
        } catch (error) {
            throw new AppError('Failed to fetch project', StatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

}