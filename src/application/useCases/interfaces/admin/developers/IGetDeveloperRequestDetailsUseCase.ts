
import { IDeveloperPopulated } from '@/domain/interfaces/types/IDeveloperTypes';


export interface IGetDeveloperRequestDetailsUseCase{
    execute(developerId: string): Promise<IDeveloperPopulated | null>
}