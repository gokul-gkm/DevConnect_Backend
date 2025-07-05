import { PaginationParams } from "@/application/useCases/implements/developer/profile/GetDeveloperProjectsUseCase";

export interface IGetDeveloperProjectsUseCase{
    execute(userId: string, { page , limit  }: PaginationParams ):Promise<any>
}