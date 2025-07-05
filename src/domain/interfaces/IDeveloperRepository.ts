
import { IDeveloper } from "@/domain/entities/Developer";
import { DevPaginatedResponse, DevQueryParams } from "../types/types";
import { CreateDeveloperDTO } from "@/application/dto/developer/CreateDeveloperDTO";
import { DeveloperSearchDTO, DeveloperSearchResponse, ValidatedSearchParams } from "@/application/dto/users/DeveloperSearchDTO";

export interface IDeveloperRepository {
    createDeveloper(data: CreateDeveloperDTO): Promise<IDeveloper> 
    findByUserId(userId: string): Promise<IDeveloper | null> 
    updateDeveloper(developerId: string, updateData: Partial<IDeveloper>): Promise<IDeveloper | null>
    updateDeveloperStatus(
        developerId: string, 
        status: 'pending' | 'approved' | 'rejected',
        rejectionReason?: string
    ): Promise<IDeveloper | null> 
    findDevelopers(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>> 
    findDeveloperDetails(developerId: string): Promise<IDeveloper | null>
    findDeveloperWithDetails(developerId: string): Promise<IDeveloper | null>
    update(userId: string, updateData: Partial<IDeveloper>): Promise<IDeveloper | null>
    addProjectToPortfolio(developerId: string, projectId: string): Promise<void>
    removeProjectFromPortfolio(developerId: string, projectId: string): Promise<void>
    searchDevelopers(params: ValidatedSearchParams): Promise<DeveloperSearchResponse>;
    getPublicProfile(developerId: string): Promise<any>;
    countApproved(): Promise<number>
    getTopPerformingDevelopers(limit: number): Promise<any[]>
}