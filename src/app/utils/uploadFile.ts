import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import status from "http-status";
import fs from "fs";
import AppError from "../errors/AppError";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folderPath = "./src/public";

    if (file.mimetype.startsWith("image")) {
      folderPath = "./src/public/images";
    } else if (file.mimetype === "application/pdf") {
      folderPath = "./src/public/pdf";
    } else if (file.mimetype.startsWith("video")) {
      folderPath = "./src/public/videos";
    } else {
      cb(
        new AppError(
          status.BAD_REQUEST,
          "Only images, PDFs, and videos are allowed",
          ""
        ),
        "./src/public"
      );
      return;
    }

    // Ensure folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },

  filename(_req, file, cb) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${file.originalname
      .replace(fileExt, "")
      .toLowerCase()
      .split(" ")
      .join("-")}-${uuidv4()}`;

    cb(null, fileName + fileExt);
  },
});

// Multer limits
const upload = multer({
  storage,
  limits: {
    fileSize: 300 * 1024 * 1024, // 300 MB
  },
  fileFilter: (req, file, cb) => {
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
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    if (file.mimetype.startsWith("video")) {
      return cb(null, true);
    }

    return cb(
      new AppError(
        status.BAD_REQUEST,
        "Only images, PDFs, and videos are allowed"
      )
    );
  },
});

export default upload;


