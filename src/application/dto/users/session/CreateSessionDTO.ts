export interface CreateSessionDTO {
    title: string;
    description: string;
    topics: string[];
    sessionDate: string | Date;
    startTime: string | Date;
    duration: number;
    price: number;
    developerId: string;
    userId: string;
  }