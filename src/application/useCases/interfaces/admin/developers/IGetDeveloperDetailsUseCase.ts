import { IDeveloper } from "@/domain/entities/Developer";

export interface IGetDeveloperDetailsUseCase{
    execute(developerId: string): Promise<IDeveloper>
}