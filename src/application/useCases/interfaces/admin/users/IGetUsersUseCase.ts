import { IUser } from "@/domain/entities/User";
import { PaginatedResponse, QueryParams } from "@/domain/types/types";

export interface IGetUsersUseCase{
    execute(queryParams: QueryParams): Promise<PaginatedResponse <IUser>>
}