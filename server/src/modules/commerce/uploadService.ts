import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const handleImageUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No image file provided' },
      });
    }

    const cloudinaryUrl = process.env.CLOUDINARY_URL;

    if (cloudinaryUrl && !cloudinaryUrl.includes('cloudname')) {
      // Cloudinary configuration from CLOUDINARY_URL
      cloudinary.config();

      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'shopping_app_products',
      });

      return res.status(200).json({
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      });
    } else {
      // Fallback in local development if Cloudinary is not configured yet
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      return res.status(200).json({
        success: true,
        data: {
          url: dataURI,
          message: 'Uploaded as Base64 Data URL (Add CLOUDINARY_URL to server/.env for production Cloudinary hosting)',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
