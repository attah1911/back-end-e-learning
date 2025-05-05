import { Request, Response } from "express";
import response from "../utils/response";
import uploader from "../utils/uploader";

export default {
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
      const file = req.file;
      if (!file) {
        return response.error(res, null, "No file uploaded");
      }
      const result = await uploader.uploadSingle(file);
      response.success(res, result, "Sukses upload file");
    } catch (error) {
      response.error(res, error, "Gagal upload file");
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
        return response.error(res, null, "No files uploaded");
      }
      const results = await uploader.uploadMultiple(files);
      response.success(res, results, "Sukses upload file");
    } catch (error) {
      response.error(res, error, "Gagal upload file");
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

      if (!fileUrl) {
        return response.error(res, null, "File URL is required");
      }

      const result = await uploader.remove(fileUrl as string);
      response.success(res, result, "Sukses menghapus file");
    } catch (error) {
      response.error(res, error, "Gagal menghapus file");
    }
  },
};
