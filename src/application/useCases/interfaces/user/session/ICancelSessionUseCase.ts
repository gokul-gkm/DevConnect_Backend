export interface ICancelSessionUseCase {
  execute(sessionId: string, userId: string, reason: string): Promise<void>;
}
