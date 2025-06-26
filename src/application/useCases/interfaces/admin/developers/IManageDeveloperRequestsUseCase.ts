import { IDeveloper } from "@/domain/entities/Developer";
import { DevPaginatedResponse, DevQueryParams } from "@/domain/types/types";

export interface IManageDeveloperRequestsUseCase{
    listRequests(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>>
    approveRequest(developerId: string): Promise<IDeveloper>
    rejectRequest(developerId: string, reason: string): Promise<IDeveloper>
}