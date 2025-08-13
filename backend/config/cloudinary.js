const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for different file types
const createCloudinaryStorage = (folder, allowedFormats) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `veilo/${folder}`,
      allowed_formats: allowedFormats,
      transformation: folder === 'avatars' ? [
        { width: 150, height: 150, crop: 'fill', quality: 'auto' }
      ] : [
        { quality: 'auto', fetch_format: 'auto' }
      ],
    },
  });
};

// Avatar upload storage
const avatarStorage = createCloudinaryStorage('avatars', ['jpg', 'jpeg', 'png']);

// Document upload storage (for expert verification)
const documentStorage = createCloudinaryStorage('documents', ['jpg', 'jpeg', 'png', 'pdf']);

// Post attachment storage
const postStorage = createCloudinaryStorage('posts', ['jpg', 'jpeg', 'png']);

// Create upload middlewares
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed for avatars.'), false);
    }
  },
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed for documents.'), false);
    }
  },
});

const uploadPostAttachment = multer({
  storage: postStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed for post attachments.'), false);
    }
  },
});

// Helper function to delete files from Cloudinary
const deleteCloudinaryFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadAvatar,
  uploadDocument,
  uploadPostAttachment,
  deleteCloudinaryFile,
};