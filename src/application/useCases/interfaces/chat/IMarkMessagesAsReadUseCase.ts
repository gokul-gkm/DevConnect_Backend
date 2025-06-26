export interface IMarkMessagesAsReadUseCase{
    execute(chatId: string, recipientType: 'user' | 'developer'):Promise<any>
}