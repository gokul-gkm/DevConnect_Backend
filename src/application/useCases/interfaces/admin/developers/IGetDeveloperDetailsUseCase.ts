import { IDeveloper } from "@/domain/entities/Developer";
import { IDeveloperPopulated } from'@/domain/interfaces/types/IDeveloperTypes';
;

export interface IGetDeveloperDetailsUseCase{
    execute(developerId: string) :Promise<IDeveloper | IDeveloperPopulated>
}