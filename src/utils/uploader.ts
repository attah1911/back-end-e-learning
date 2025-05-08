import { v2 as cloudinary } from "cloudinary";

import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "./env";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const toDataURL = (file: Express.Multer.File) => {
  try {
    if (!file.buffer) {
      throw new Error("No file buffer found");
    }
    const b64 = Buffer.from(file.buffer).toString("base64");
    const dataURL = `data:${file.mimetype};base64,${b64}`;
    return dataURL;
  } catch (error) {
    console.error("Error converting file to data URL:", error);
    throw new Error("Failed to process file");
  }
};

const getPublicIdFromFileUrl = (fileUrl: string) => {
  const fileNameUsingSubstring = fileUrl.substring(
    fileUrl.lastIndexOf("/") + 1
  );
  const publicId = fileNameUsingSubstring.substring(
    0,
    fileNameUsingSubstring.lastIndexOf(".")
  );
  return publicId;
};

export default {
  async uploadSingle(file: Express.Multer.File) {
    try {
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error("Cloudinary configuration is incomplete");
      }
  
      // Stream upload instead of base64
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "profile-pictures",
            transformation: [
              { width: 400, height: 400, crop: "fill" },
              { quality: "auto" }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
  
        uploadStream.end(file.buffer);
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      throw error;
    }
  },
  

  async uploadMultiple(files: Express.Multer.File[]) {
    const uploadBatch = files.map((item) => {
      const result = this.uploadSingle(item);
      return result;
    });
    const results = await Promise.all(uploadBatch);
    return results;
  },

  async remove(fileUrl: string) {
    const publicId = getPublicIdFromFileUrl(fileUrl);
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  },
};