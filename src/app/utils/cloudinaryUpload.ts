import fs from "fs";
import cloudinary from "../config/cloudinary.config";
import config from "../config";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

export const uploadToCloudinary = async (
  filePath: string,
  folder: string = "angel_app"
): Promise<CloudinaryUploadResponse> => {
  try {
    const uploadOptions: Record<string, any> = {
      resource_type: "auto",
      folder,
    };

    if (config.cloudinary.upload_preset) {
      uploadOptions.upload_preset = config.cloudinary.upload_preset;
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return result as CloudinaryUploadResponse;
  } catch (error) {
    throw error;
  } finally {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete local temp file:", filePath, err);
      }
    }
  }
};

export default uploadToCloudinary;
