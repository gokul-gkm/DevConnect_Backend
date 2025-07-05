import { DeveloperSearchDTO, DeveloperSearchResponse } from "@/application/dto/users/DeveloperSearchDTO";

export interface ISearchDevelopersUseCase{
    execute(searchParams: DeveloperSearchDTO): Promise<DeveloperSearchResponse>
}