import { CreatePaymentSessionDTO } from "@/application/useCases/implements/user/payment/CreatePaymentSessionUseCase";

export interface ICreatePaymentSessionUseCase{
    execute(data: CreatePaymentSessionDTO): Promise<string> 
}