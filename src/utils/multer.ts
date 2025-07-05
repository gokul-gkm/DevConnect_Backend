import multer from 'multer';
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
      fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
      
      if (file.fieldname === 'profilePicture') {
          if (!file.mimetype.startsWith('image/')) {
              return cb(new Error('Only images are allowed for profile picture'));
          }
          return cb(null, true);
      } 
      
      if (file.fieldname === 'resume') {
          const allowedMimeTypes = [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
          if (!allowedMimeTypes.includes(file.mimetype)) {
              return cb(new Error('Only PDF and Word documents are allowed for resume'));
          }
          return cb(null, true);
      }

      if (file.fieldname === 'coverImage') {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only images are allowed for cover images'));
        }
        return cb(null, true);
    } 

      if (file.fieldname === 'mediaFile') {
        const allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg',
            'video/mp4', 'video/webm', 'video/quicktime',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (!allowedMimeTypes.includes(file.mimetype) && 
            !file.mimetype.startsWith('image/') && 
            !file.mimetype.startsWith('audio/') && 
            !file.mimetype.startsWith('video/')) {
            return cb(new Error('Unsupported file type for chat media'));
        }
        return cb(null, true);
      }

      return cb(null, false);
  }
});