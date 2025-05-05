import mongoose, { Schema } from "mongoose";
import * as Yup from "yup";

export const materiPelajaranDAO = Yup.object({
  judul: Yup.string().required(),
  konten: Yup.object({
    teks: Yup.string(),
    files: Yup.array().of(Yup.string())
  }).required(),
  mataPelajaran: Yup.string().required(),
  order: Yup.number().required().min(1)
});

export interface MateriPelajaran {
  judul: string;
  konten: {
    teks?: string;
    files?: string[];
  };
  mataPelajaran: mongoose.Types.ObjectId;
  order: number;
}

const MateriPelajaranSchema = new Schema<MateriPelajaran>(
  {
    judul: {
      type: String,
      required: true
    },
    konten: {
      teks: {
        type: String
      },
      files: [{
        type: String
      }]
    },
    mataPelajaran: {
      type: Schema.Types.ObjectId,
      ref: 'MataPelajaran',
      required: true
    },
    order: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

// Add index for efficient querying by mataPelajaran and order
MateriPelajaranSchema.index({ mataPelajaran: 1, order: 1 });

const MateriPelajaranModel = mongoose.model('MateriPelajaran', MateriPelajaranSchema);

export default MateriPelajaranModel;
