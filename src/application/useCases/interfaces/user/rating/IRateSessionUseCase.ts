import { RateSessionParams } from "@/application/useCases/implements/user/rating/RateSessionUseCase";

export interface IRateSessionUseCase{
    execute(params: RateSessionParams): Promise<any>
}