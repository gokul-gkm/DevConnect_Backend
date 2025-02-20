import multer from 'multer';
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
      fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
      console.log("Processing file:", file.fieldname);
      
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

      return cb(null, false);
  }
});