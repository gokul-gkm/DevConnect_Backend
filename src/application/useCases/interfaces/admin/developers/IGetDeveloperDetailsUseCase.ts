import { IDeveloper } from "@/domain/entities/Developer";
import { IDeveloperPopulated } from "@/infrastructure/repositories/DeveloperRepository";

export interface IGetDeveloperDetailsUseCase{
    execute(developerId: string) :Promise<IDeveloper | IDeveloperPopulated>
}