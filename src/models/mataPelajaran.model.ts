import mongoose, { Schema } from "mongoose";
import * as Yup from "yup";

const KATEGORI = {
  KELAS_7: "KELAS_7",
  KELAS_8: "KELAS_8",
  KELAS_9: "KELAS_9"
} as const;

export const mataPelajaranDAO = Yup.object({
  judul: Yup.string().required(),
  deskripsi: Yup.string().required(),
  kategori: Yup.string()
    .oneOf(Object.values(KATEGORI))
    .required(),
  guru: Yup.string().required()
});

export interface MataPelajaran {
  judul: string;
  deskripsi: string;
  kategori: typeof KATEGORI[keyof typeof KATEGORI];
  guru: mongoose.Types.ObjectId;
  materiPelajaran?: mongoose.Types.ObjectId[];
}

const MataPelajaranSchema = new Schema<MataPelajaran>(
  {
    judul: {
      type: String,
      required: true
    },
    deskripsi: {
      type: String,
      required: true
    },
    kategori: {
      type: String,
      enum: Object.values(KATEGORI),
      required: true
    },
    guru: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true
    },
    materiPelajaran: [{
      type: Schema.Types.ObjectId,
      ref: 'MateriPelajaran'
    }]
  },
  {
    timestamps: true
  }
);

// Add indexes for common queries
MataPelajaranSchema.index({ kategori: 1 });
MataPelajaranSchema.index({ guru: 1 });

// Virtual populate for materiPelajaran
MataPelajaranSchema.virtual('materiPelajaranList', {
  ref: 'MateriPelajaran',
  localField: '_id',
  foreignField: 'mataPelajaran',
  options: { sort: { order: 1 } }
});

const MataPelajaranModel = mongoose.model('MataPelajaran', MataPelajaranSchema);

export { KATEGORI };
export default MataPelajaranModel;
