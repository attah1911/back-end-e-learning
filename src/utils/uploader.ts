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
      // Validate Cloudinary configuration
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        console.error("Missing Cloudinary configuration:", {
          cloudName: CLOUDINARY_CLOUD_NAME ? "Set" : "Missing",
          apiKey: CLOUDINARY_API_KEY ? "Set" : "Missing",
          apiSecret: CLOUDINARY_API_SECRET ? "Set" : "Missing"
        });
        throw new Error("Cloudinary configuration is incomplete");
      }

      if (!file) {
        throw new Error("No file provided");
      }

      console.log("Converting file to data URL...");
      const fileDataURL = toDataURL(file);
      
      console.log("Uploading to Cloudinary...");
      const result = await cloudinary.uploader.upload(fileDataURL, {
        resource_type: "auto",
        folder: "profile-pictures",
        transformation: [
          { width: 400, height: 400, crop: "fill" },
          { quality: "auto" }
        ]
      });
      
      console.log("Upload successful:", {
        publicId: result.public_id,
        url: result.secure_url,
        size: result.bytes
      });
      
      return result;
    } catch (error: any) {
      console.error("Error in uploadSingle:", {
        message: error.message,
        stack: error.stack,
        details: error.error || error
      });
      throw new Error(`Failed to upload file: ${error.message}`);
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
