import { IDeveloper } from "@/domain/entities/Developer";
import { DevPaginatedResponse, DevQueryParams } from "@/domain/types/types";

export interface IGetDevelopersUseCase{
    execute(queryParams: DevQueryParams): Promise<DevPaginatedResponse<IDeveloper>>
}