import { Request, Response } from "express";
import response from "../utils/response";
import uploader from "../utils/uploader";
import { CloudinaryResponse } from "../utils/interfaces";

const mediaController = {
  /**
   * @swagger
   * /media/upload-single:
   *   post:
   *     tags: [Media]
   *     summary: Upload single file
   *     security:
   *       - bearerAuth: []
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - in: formData
   *         name: file
   *         type: file
   *         required: true
   *         description: File to upload
   */
  async single(req: Request, res: Response) {
    /**
     #swagger.tags = ['Media']
     #swagger.security = [{
       "bearerAuth": []
     }]
     #swagger.consumes = ['multipart/form-data']
     #swagger.parameters['file'] = {
       in: 'formData',
       type: 'file',
       required: true,
       description: 'File to upload'
     }
     */
    try {
      console.log("[Media Controller] Starting file upload process");
      console.log("[Media Controller] Headers:", JSON.stringify(req.headers, null, 2));
      
      // Check if request is multipart
      const contentType = req.headers['content-type'] || '';
      if (!contentType.includes('multipart/form-data')) {
        console.error("[Media Controller] Invalid content type:", contentType);
        return response.error(res, null, "Invalid request format. Expected multipart/form-data");
      }

      const file = req.file;
      console.log("[Media Controller] File object:", file ? {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer ? 'Buffer present' : 'No buffer'
      } : 'No file');

      if (!file) {
        console.error("[Media Controller] No file received");
        return response.error(res, null, "Tidak ada file yang dipilih");
      }

      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        console.error("[Media Controller] Invalid file type:", file.mimetype);
        return response.error(res, null, "File harus berupa gambar");
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        console.error("[Media Controller] File too large:", file.size);
        return response.error(res, null, "Ukuran file terlalu besar (maksimal 2MB)");
      }

      console.log("[Media Controller] Starting Cloudinary upload");
      const result = await uploader.uploadSingle(file) as CloudinaryResponse;
      console.log("[Media Controller] Upload successful:", {
        publicId: result.public_id,
        url: result.secure_url,
        size: result.bytes
      });
      
      // Return only necessary data
      const fileData = {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };

      return response.success(res, fileData, "Sukses upload file");
    } catch (error: any) {
      console.error("Error in media controller:", {
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
        details: error.error || error
      });

      // Check for specific error types
      if (error.message.includes("Cloudinary configuration")) {
        return response.error(res, error, "Konfigurasi upload tidak valid");
      }
      
      if (error.message.includes("buffer")) {
        return response.error(res, error, "File tidak dapat diproses");
      }

      const errorMessage = error.message || "Gagal upload file";
      return response.error(res, error, errorMessage);
    }
  },

  /**
   * @swagger
   * /media/upload-multiple:
   *   post:
   *     tags: [Media]
   *     summary: Upload multiple files
   *     security:
   *       - bearerAuth: []
   *     consumes:
   *       - multipart/form-data
   *     parameters:
   *       - in: formData
   *         name: files
   *         type: array
   *         items:
   *           type: file
   *         required: true
   *         description: Files to upload
   */
  async multiple(req: Request, res: Response) {
    /**
     #swagger.tags = ['Media']
     #swagger.security = [{
       "bearerAuth": []
     }]
     #swagger.consumes = ['multipart/form-data']
     #swagger.parameters['files'] = {
       in: 'formData',
       type: 'array',
       items: {
         type: 'file'
       },
       required: true,
       description: 'Files to upload'
     }
     */
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || !files.length) {
        return response.error(res, null, "Tidak ada file yang dipilih");
      }
      const results = await uploader.uploadMultiple(files) as CloudinaryResponse[];
      return response.success(res, results, "Sukses upload file");
    } catch (error) {
      return response.error(res, error, "Gagal upload file");
    }
  },

  /**
   * @swagger
   * /media/remove:
   *   delete:
   *     tags: [Media]
   *     summary: Delete file
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: fileUrl
   *         schema:
   *           type: string
   *         required: true
   *         description: URL of file to delete
   */
  async remove(req: Request, res: Response) {
    /**
     #swagger.tags = ['Media']
     #swagger.security = [{
       "bearerAuth": []
     }]
     #swagger.parameters['fileUrl'] = {
       in: 'query',
       type: 'string',
       required: true,
       description: 'URL of file to delete'
     }
     */
    try {
      const { fileUrl } = req.query;

      if (!fileUrl || typeof fileUrl !== 'string') {
        return response.error(res, null, "URL file tidak valid");
      }

      const result = await uploader.remove(fileUrl);
      return response.success(res, result, "Sukses menghapus file");
    } catch (error) {
      return response.error(res, error, "Gagal menghapus file");
    }
  },
};

export default mediaController;
