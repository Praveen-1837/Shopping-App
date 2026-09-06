import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

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

    if (cloudinaryUrl && !cloudinaryUrl.includes('cloudname') && !cloudinaryUrl.includes('key:secret')) {
      // Production Cloudinary upload
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
      // Local development disk storage fallback (never return raw base64 URI)
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      fs.writeFileSync(filePath, req.file.buffer);

      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:5000';
      const fileUrl = `${protocol}://${host}/uploads/${filename}`;

      return res.status(200).json({
        success: true,
        data: {
          url: fileUrl,
          message: 'Image uploaded successfully to local storage',
        },
      });
    }
  } catch (error) {
    next(error);
  }
};
