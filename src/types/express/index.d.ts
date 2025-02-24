declare namespace Express {
  export interface Request {
    userId?: string;
    user?: {
      id: string;
      role: 'user' | 'developer';
    };
  }
} 