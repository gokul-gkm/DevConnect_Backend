import { Request, Response } from "express";
import { StatusCodes } from 'http-status-codes';
import { AppError } from "@/domain/errors/AppError";
import { ERROR_MESSAGES, HTTP_STATUS_MESSAGES } from "@/utils/constants";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types/types";

import { IGetDeveloperProfileUseCase } from "@/application/useCases/interfaces/developer/profile/IGetDeveloperProfileUseCase";
import { IUpdateDeveloperProfileUseCase } from "@/application/useCases/interfaces/developer/profile/IUpdateDeveloperProfileUseCase";
import { IAddProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IAddProjectUseCase";
import { IGetDeveloperProjectsUseCase } from "@/application/useCases/interfaces/developer/profile/IGetDeveloperProjectsUseCase";
import { IUpdateProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IUpdateProjectUseCase";
import { IDeleteProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IDeleteProjectUseCase";
import { IManageDeveloperUnavailabilityUseCase } from "@/application/useCases/interfaces/developer/availability/IManageDeveloperUnavailabilityUseCase";
import { IManageDefaultSlotsUseCase } from "@/application/useCases/interfaces/developer/availability/IManageDefaultSlotsUseCase";
import { IGetDeveloperReviewsUseCase } from "@/application/useCases/interfaces/developer/reviews/IGetDeveloperReviewsUseCase";
import { IGetDeveloperMonthlyStatsUseCase } from "@/application/useCases/interfaces/developer/dashboard/IGetDeveloperMonthlyStatsUseCase";
import { IGetDeveloperUpcomingSessionsUseCase } from "@/application/useCases/interfaces/developer/dashboard/IGetDeveloperUpcomingSessionsUseCase";
import { IGetDeveloperProjectUseCase } from "@/application/useCases/interfaces/developer/profile/IGetDeveloperProjectUseCase";

interface MulterFiles {
    profilePicture?: Express.Multer.File[];
    resume?: Express.Multer.File[];
}
  
@injectable()
export class DevController {
    
      constructor(
          @inject(TYPES.IGetDeveloperProfileUseCase)
          private _getDeveloperProfileUseCase: IGetDeveloperProfileUseCase,
          @inject(TYPES.IUpdateDeveloperProfileUseCase)
          private _updateDeveloperProfileUseCase: IUpdateDeveloperProfileUseCase,
          @inject(TYPES.IAddProjectUseCase)
          private _addProjectUseCase: IAddProjectUseCase,
          @inject(TYPES.IGetDeveloperProjectsUseCase)
          private _getDeveloperProjectsUseCase: IGetDeveloperProjectsUseCase,
          @inject(TYPES.IGetDeveloperProjectUseCase)
          private _getDeveloperProjectUseCase: IGetDeveloperProjectUseCase,
          @inject(TYPES.IUpdateProjectUseCase)
          private _updateProjectUseCase: IUpdateProjectUseCase,
          @inject(TYPES.IDeleteProjectUseCase)
          private _deleteProjectUseCase: IDeleteProjectUseCase,
          @inject(TYPES.IManageDeveloperUnavailabilityUseCase)
          private _manageDeveloperUnavailabilityUseCase: IManageDeveloperUnavailabilityUseCase,
          @inject(TYPES.IManageDefaultSlotsUseCase)
          private _manageDefaultSlotsUseCase: IManageDefaultSlotsUseCase,
          @inject(TYPES.IGetDeveloperReviewsUseCase)
          private _getDeveloperReviewsUseCase: IGetDeveloperReviewsUseCase,
          @inject(TYPES.IGetDeveloperMonthlyStatsUseCase)
          private _getDeveloperMonthlyStatsUseCase: IGetDeveloperMonthlyStatsUseCase,
          @inject(TYPES.IGetDeveloperUpcomingSessionsUseCase)
          private _getDeveloperUpcomingSessionsUseCase: IGetDeveloperUpcomingSessionsUseCase,
        ) {}
    
    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.userId;
            if (!userId) {
                throw new AppError(ERROR_MESSAGES.DEVELOPER_REQUIRED,StatusCodes.BAD_REQUEST);
            }
            const user = await this._getDeveloperProfileUseCase.execute(userId);
            if(!user) {
                throw new AppError(ERROR_MESSAGES.DEVELOPER_NOT_FOUND,StatusCodes.NOT_FOUND);
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
    
            const updatedProfile = await this._updateDeveloperProfileUseCase.execute(
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
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
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
            const project = await this._addProjectUseCase.execute(developerId,{
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
            const result = await this._getDeveloperProjectsUseCase.execute(userId, { page, limit });

            return res.status(StatusCodes.OK).json({ success: true, message: 'Developer projects fetched successfully', data: result });
            
        } catch (error: any) {
            console.error("Get Developer Projects Error : ", error)
            return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message || 'Failed to fetch developer projects' });
        }
    }

    async getProject(req: Request, res: Response) {
        try {
            const projectId = req.params.projectId;
            const project = await this._getDeveloperProjectUseCase.execute(projectId);


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
            
            const updatedProject = await this._updateProjectUseCase.execute({
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
            await this._deleteProjectUseCase.execute(developerId, projectId);
    
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

    async getUnavailableSlots(req: Request, res: Response): Promise<void> {
        try {
            const developerId = req.params.developerId || req.userId;
            const date = new Date(req.query.date as string);
            
            if (!date || isNaN(date.getTime())) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid date provided'
                });
                return;
            }
            
            const slots = await this._manageDeveloperUnavailabilityUseCase.getUnavailableSlots(
                developerId as string,
                date
            );
            
            res.status(StatusCodes.OK).json({
                success: true,
                data: slots
            });
        } catch (error: any) {
            res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to get unavailable slots'
            });
        }
    }

    async updateUnavailableSlots(req: Request, res: Response): Promise<void> {
        try {
            const developerId = req.userId;
            const { date, unavailableSlots } = req.body;
            
            if (!date || !Array.isArray(unavailableSlots)) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid data provided'
                });
                return;
            }
            
            await this._manageDeveloperUnavailabilityUseCase.updateUnavailableSlots(
                developerId as string,
                new Date(date),
                unavailableSlots
            );
            
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Unavailable slots updated successfully'
            });
        } catch (error: any) {
            res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to update unavailable slots'
            });
        }
    }

    async getDefaultUnavailableSlots(req: Request, res: Response): Promise<void> {
        try {
            const developerId = req.userId;
            
            const slots = await this._manageDefaultSlotsUseCase.getDefaultUnavailableSlots(
                developerId as string
            );
            
            res.status(StatusCodes.OK).json({
                success: true,
                data: slots
            });
        } catch (error: any) {
            res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to get default unavailable slots'
            });
        }
    }

    async updateDefaultUnavailableSlots(req: Request, res: Response): Promise<void> {
        try {
            const developerId = req.userId;
            const { unavailableSlots } = req.body;
            
            if (!Array.isArray(unavailableSlots)) {
                res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: 'Invalid data provided'
                });
                return;
            }
            
            await this._manageDefaultSlotsUseCase.updateDefaultUnavailableSlots(
                developerId as string,
                unavailableSlots
            );
            
            res.status(StatusCodes.OK).json({
                success: true,
                message: 'Default unavailable slots updated successfully'
            });
        } catch (error: any) {
            res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: error.message || 'Failed to update default unavailable slots'
            });
        }
    }

    async getDeveloperReviews(req: Request, res: Response) {
        try {
            const developerId = req.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const search = (req.query.search as string) || '';
            const sortOrder = (req.query.sortOrder as string) || 'newest';
            
            if (!developerId) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: ERROR_MESSAGES.DEVELOPER_REQUIRED
                });
            }
            
            const result = await this._getDeveloperReviewsUseCase.execute(
                developerId,
                page,
                limit,
                search,
                sortOrder
            );
            
            return res.status(StatusCodes.OK).json({
                success: true,
                data: result
            });
        } catch (error) {
            if (error instanceof AppError) {
                return res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: HTTP_STATUS_MESSAGES.INTERNAL_SERVER_ERROR
            });
        }
    }

    async getDashboardStats(req: Request, res: Response) {
        try {
            const developerId = req.userId;
            const year = parseInt(req.query.year as string) || new Date().getFullYear();
            if (!developerId) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: ERROR_MESSAGES.DEVELOPER_REQUIRED
                });
            }
            const stats = await this._getDeveloperMonthlyStatsUseCase.execute(developerId, year);
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch stats" });
        }
    }

    async getUpcomingSessionsPreview(req: Request, res: Response) {
        try {
            const developerId = req.userId;
            const limit = parseInt(req.query.limit as string) || 2;
            if (!developerId) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: ERROR_MESSAGES.DEVELOPER_REQUIRED
                });
            }
            const sessions = await this._getDeveloperUpcomingSessionsUseCase.execute(developerId, limit);
            res.status(200).json({ success: true, data: sessions });
        } catch (error) {
            res.status(500).json({ success: false, message: "Failed to fetch sessions" });
        }
    }
}