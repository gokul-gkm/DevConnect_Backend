import { IAdminSession } from "@/domain/types/session";

export interface IGetAdminSessionsReportUseCase {
    execute(params: {
      status: string[];
      search?: string;
      fromDate?: Date;
      toDate?: Date;
    }): Promise<{
      sessions: IAdminSession[];
      totals: { count: number; amount: number };
    }>;
  }