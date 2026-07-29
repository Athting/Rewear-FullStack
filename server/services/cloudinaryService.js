import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadImage = (fileOrBuffer, folder = 'rewear_clothes') => {
  return new Promise((resolve, reject) => {
    const isBuffer = Buffer.isBuffer(fileOrBuffer);
    const buffer = isBuffer ? fileOrBuffer : fileOrBuffer.buffer;
    const originalname = isBuffer ? 'image.jpg' : (fileOrBuffer.originalname || 'image.jpg');

    // If Cloudinary keys are missing, write the file buffer locally to serve statically!
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExt = path.extname(originalname) || '.jpg';
        const filename = uniqueSuffix + fileExt;
        const filePath = path.join(uploadsDir, filename);

        // Write file buffer to disk
        fs.writeFileSync(filePath, buffer);
        console.log(`[LOCAL UPLOAD] Saved file locally: /uploads/${filename}`);
        resolve(`/uploads/${filename}`);
      } catch (err) {
        console.error('[LOCAL UPLOAD ERROR] Failed to save file locally:', err);
        reject(err);
      }
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 800, crop: 'limit', quality: 'auto' }]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

export const uploadMultipleImages = async (filesList, folder = 'rewear_clothes') => {
  const promises = filesList.map(file => uploadImage(file, folder));
  return Promise.all(promises);
};
