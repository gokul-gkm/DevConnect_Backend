export interface IS3Service {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<{ Key: string }>;
  deleteFile(fileKey: string): Promise<void>;
  generateSignedUrl(key: string): Promise<string>;
}
