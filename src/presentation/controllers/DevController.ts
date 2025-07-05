import { AddProjectUseCase } from "@/application/useCases/developer/profile/AddProjectUseCase";
import { DeleteProjectUseCase } from "@/application/useCases/developer/profile/DeleteProjectUseCase";
import { GetDeveloperProfileUseCase } from "@/application/useCases/developer/profile/GetDeveloperProfileUseCase";
import { GetDeveloperProjectsUseCase } from "@/application/useCases/developer/profile/GetDeveloperProjectsUseCase";
import { UpdateDeveloperProfileUseCase } from "@/application/useCases/developer/profile/UpdateDeveloperProfileUseCase";
import { UpdateProjectUseCase } from "@/application/useCases/developer/profile/UpdateProjectUseCase";
import { AppError } from "@/domain/errors/AppError";
import { DeveloperRepository } from "@/infrastructure/repositories/DeveloperRepository";
import { ProjectRepository } from "@/infrastructure/repositories/ProjectRepository";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { S3Service } from "@/infrastructure/services/S3_Service";

import { Request, Response } from "express";
import { StatusCodes } from 'http-status-codes';

interface MulterFiles {
    profilePicture?: Express.Multer.File[];
    resume?: Express.Multer.File[];
}
  

export class DevController {
    private getDeveloperProfileUseCase: GetDeveloperProfileUseCase;
    private updateDeveloperProfileUseCase: UpdateDeveloperProfileUseCase;
    private addProjectUseCase: AddProjectUseCase;
    private getDeveloperProjectsUseCase: GetDeveloperProjectsUseCase;
    private updateProjectUseCase: UpdateProjectUseCase;
    private deleteProjectUseCase: DeleteProjectUseCase;
    

    constructor(
        private userRepository: UserRepository,
        private developerRepository: DeveloperRepository,
        private projectRepository: ProjectRepository,
        private s3Service: S3Service
    ) {
        this.getDeveloperProfileUseCase = new GetDeveloperProfileUseCase(userRepository, developerRepository,s3Service),
        this.updateDeveloperProfileUseCase = new UpdateDeveloperProfileUseCase(userRepository, developerRepository, s3Service),
        this.addProjectUseCase = new AddProjectUseCase(projectRepository, developerRepository, s3Service),
        this.getDeveloperProjectsUseCase = new GetDeveloperProjectsUseCase(projectRepository,s3Service)
        this.updateProjectUseCase = new UpdateProjectUseCase(projectRepository, s3Service);
        this.deleteProjectUseCase = new DeleteProjectUseCase( projectRepository, developerRepository, s3Service);
     }
    
    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError("Developer ID is required",StatusCodes.BAD_REQUEST);
            }
            const user = await this.getDeveloperProfileUseCase.execute(userId);
            if(!user) {
                throw new AppError("Developer not found",StatusCodes.NOT_FOUND);
            }
            return res.status(StatusCodes.OK).json({data: user, success: true});
            
        } catch (error) {
            console.error(error)
        }
    }

    
    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
            }

            const files = req.files as MulterFiles;

            const uploadFiles = {
                profilePicture: files?.profilePicture,
                resume: files?.resume
            };
    
            const profileData = req.body;
    
            const parsedData = {
                username: profileData.username,
                // email: profileData.email,
                contact: profileData.contact,
                bio: profileData.bio,
                location: profileData.location,
                hourlyRate: profileData.hourlyRate,
                skills: JSON.parse(profileData.skills || '[]'),
                languages: JSON.parse(profileData.languages || '[]'),         
                education: {
                    degree: profileData.degree,
                    institution: profileData.institution,
                    year: profileData.year
                },   
                workingExperience: {
                    jobTitle: profileData.jobTitle,
                    companyName: profileData.companyName,
                    experience: profileData.experience
                },   
                socialLinks: {
                    github: profileData.github,
                    linkedIn: profileData.linkedIn,
                    twitter: profileData.twitter,
                    portfolio: profileData.portfolio
                }
            };
    
            const updatedProfile = await this.updateDeveloperProfileUseCase.execute(
                userId,
                parsedData,
                uploadFiles
            );
    
            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedProfile
            });
        } catch (error: any) {
            console.error("Update profile error:", error);
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    async addProject(req: Request, res: Response) {
        try {
            console.log("Request file:", req.file);
            const { title, category, description, projectLink } = req.body;
            const coverImage = req.file;
            const developerId = req?.userId

            if (!title || !category || !description) {
                throw new AppError('Missing required fields', StatusCodes.BAD_REQUEST);
            }

            if (!developerId) {
                throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
            }
            const project = await this.addProjectUseCase.execute(developerId,{
                title,
                category,
                description,
                projectLink,
                coverImage: coverImage
            });

            return res.status(StatusCodes.CREATED).json({
                success: true,
                message: 'Project added successfully',
                data: project
            });

        } catch (error: any) {
            console.error("Add Project Error : ", error);
            return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to add project'
            });
        }
    }

    async getDeveloperProjects(req: Request, res: Response) {
        try {
            const userId = req.userId;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 5;
            if (!userId) {
                throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
            }
            const result = await this.getDeveloperProjectsUseCase.execute(userId, { page, limit });

            return res.status(StatusCodes.OK).json({ success: true, message: 'Developer projects fetched successfully', data: result });
            
        } catch (error: any) {
            console.error("Get Developer Projects Error : ", error)
            return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Failed to fetch developer projects' });
        }
    }

    async getProject(req: Request, res: Response) {
        try {
            const projectId = req.params.projectId;
            const project = await this.projectRepository.getProjectById(projectId);

            let signedCoverImageUrl = null;
            
            if (project.coverImage) {
                signedCoverImageUrl = await this.s3Service.generateSignedUrl(project.coverImage);
                project.coverImage = signedCoverImageUrl
            }


            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Project fetched successfully',
                data: project
            });
        } catch (error: any) {
            return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to fetch project'
            });
        }
    }

    async updateProject(req: Request, res: Response) {
        try {
            const projectId = req.params.projectId;
            const { title, category, description, projectLink } = req.body;
            const coverImage = req.file;
            
            const updatedProject = await this.updateProjectUseCase.execute({
                projectId,
                title,
                category,
                description,
                projectLink,
                coverImage: coverImage
            });

            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Project updated successfully',
                data: updatedProject
            });
        } catch (error: any) {
            return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: true,
                message: error.message || 'Failed to update project'
            });
        }
    }

    async deleteProject(req: Request, res: Response) {
        try {
            const developerId = req.userId
            const projectId = req.params.projectId;
            if (!developerId) {
                throw new AppError('Unauthorized', StatusCodes.UNAUTHORIZED);
            }
            await this.deleteProjectUseCase.execute(developerId, projectId);
    
            return res.status(StatusCodes.OK).json({
                success: true,
                message: 'Project deleted successfully'
            });
        } catch (error: any) {
            return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to delete project'
            });
        }
    }

    
}