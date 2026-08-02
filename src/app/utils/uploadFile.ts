import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import status from "http-status";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import uploadToCloudinary from "./cloudinaryUpload";

const tempFolder = "./src/public/temp";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(tempFolder)) {
      fs.mkdirSync(tempFolder, { recursive: true });
    }
    cb(null, tempFolder);
  },

  filename(_req, file, cb) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}`;
    cb(null, fileName + fileExt);
  },
});

const multerInstance = multer({
  storage,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/svg+xml",
      "image/heic",
      "image/heif",
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "application/pdf",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/mp3",
      "audio/m4a",
    ];

    if (
      allowedMimeTypes.includes(file.mimetype) ||
      file.mimetype.startsWith("video") ||
      file.mimetype.startsWith("audio")
    ) {
      return cb(null, true);
    }

    return cb(
      new AppError(
        status.BAD_REQUEST,
        "Only images, PDFs, audio, and videos are allowed"
      )
    );
  },
});

// Helper to upload single Multer file to Cloudinary and update file.path
const processCloudinaryUpload = async (file: Express.Multer.File) => {
  if (file && file.path && fs.existsSync(file.path)) {
    const result = await uploadToCloudinary(file.path);
    file.path = result.secure_url;
    file.filename = result.public_id;
  }
};

const upload = {
  single: (fieldname: string) => {
    const middleware = multerInstance.single(fieldname);
    return (req: Request, res: Response, next: NextFunction) => {
      middleware(req, res, async (err: any) => {
        if (err) return next(err);
        try {
          if (req.file) {
            await processCloudinaryUpload(req.file);
          }
          next();
        } catch (error) {
          next(error);
        }
      });
    };
  },

  array: (fieldname: string, maxCount?: number) => {
    const middleware = multerInstance.array(fieldname, maxCount);
    return (req: Request, res: Response, next: NextFunction) => {
      middleware(req, res, async (err: any) => {
        if (err) return next(err);
        try {
          if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
              await processCloudinaryUpload(file);
            }
          }
          next();
        } catch (error) {
          next(error);
        }
      });
    };
  },

  fields: (fields: multer.Field[]) => {
    const middleware = multerInstance.fields(fields);
    return (req: Request, res: Response, next: NextFunction) => {
      middleware(req, res, async (err: any) => {
        if (err) return next(err);
        try {
          if (req.files) {
            if (Array.isArray(req.files)) {
              for (const file of req.files) {
                await processCloudinaryUpload(file);
              }
            } else {
              for (const key of Object.keys(req.files)) {
                const fileArray = (req.files as { [fieldname: string]: Express.Multer.File[] })[key];
                if (Array.isArray(fileArray)) {
                  for (const file of fileArray) {
                    await processCloudinaryUpload(file);
                  }
                }
              }
            }
          }
          next();
        } catch (error) {
          next(error);
        }
      });
    };
  },
};

export default upload;
