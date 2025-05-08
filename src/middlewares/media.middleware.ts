import multer from "multer";

import { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();
const multerUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (_req, file, cb) => {
    console.log("Processing file in multer:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar'));
    }
  },
});

// Wrap multer middleware to handle errors
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    return res.status(400).json({
      meta: {
        status: 400,
        message: `Error uploading file: ${err.message}`
      },
      data: null
    });
  }
  
  if (err) {
    console.error("Unknown error in media middleware:", err);
    return res.status(500).json({
      meta: {
        status: 500,
        message: "Gagal memproses file"
      },
      data: null
    });
  }
  
  next();
};

export default {
  single(fieldName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      multerUpload.single(fieldName)(req, res, (err) => {
        if (err) {
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    };
  },
  multiple(fieldName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      multerUpload.array(fieldName)(req, res, (err) => {
        if (err) {
          return handleMulterError(err, req, res, next);
        }
        next();
      });
    };
  },
};
