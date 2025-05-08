import mongoose, { Schema } from "mongoose";
import * as Yup from "yup";

export const TINGKAT_KELAS = {
  KELAS_7: "KELAS_7",
  KELAS_8: "KELAS_8",
  KELAS_9: "KELAS_9"
} as const;

export const KATEGORI = {
  MATEMATIKA: "Matematika",
  IPA: "IPA",
  IPS: "IPS",
  BAHASA_INDONESIA: "Bahasa Indonesia",
  BAHASA_INGGRIS: "Bahasa Inggris",
  PENDIDIKAN_AGAMA: "Pendidikan Agama",
  PPKN: "PPKN",
  SENI_BUDAYA: "Seni Budaya",
  PENDIDIKAN_JASMANI: "Pendidikan Jasmani",
  PRAKARYA: "Prakarya"
} as const;

export type TingkatKelas = typeof TINGKAT_KELAS[keyof typeof TINGKAT_KELAS];
export type Kategori = typeof KATEGORI[keyof typeof KATEGORI];

export interface IMataPelajaran {
  judul: string;
  deskripsi: string;
  tingkatKelas: TingkatKelas;
  kategori: Kategori;
  guru: mongoose.Types.ObjectId;
  materiPelajaran?: mongoose.Types.ObjectId[];
}

export const mataPelajaranDAO = Yup.object({
  judul: Yup.string().required("Judul mata pelajaran wajib diisi"),
  deskripsi: Yup.string().required("Deskripsi mata pelajaran wajib diisi"),
  tingkatKelas: Yup.string()
    .oneOf(Object.values(TINGKAT_KELAS), "Tingkat kelas tidak valid")
    .required("Tingkat kelas wajib diisi"),
  kategori: Yup.string()
    .oneOf(Object.values(KATEGORI), "Kategori mata pelajaran tidak valid")
    .required("Kategori mata pelajaran wajib diisi"),
  guru: Yup.string().required("Guru pengajar wajib diisi")
});

const MataPelajaranSchema = new Schema<IMataPelajaran>(
  {
    judul: {
      type: String,
      required: true
    },
    deskripsi: {
      type: String,
      required: true
    },
    tingkatKelas: {
      type: String,
      enum: Object.values(TINGKAT_KELAS),
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
MataPelajaranSchema.index({ tingkatKelas: 1 });
MataPelajaranSchema.index({ kategori: 1 });
MataPelajaranSchema.index({ guru: 1 });

// Virtual populate for materiPelajaran
MataPelajaranSchema.virtual('materiPelajaranList', {
  ref: 'MateriPelajaran',
  localField: '_id',
  foreignField: 'mataPelajaran',
  options: { sort: { order: 1 } }
});

const MataPelajaranModel = mongoose.model<IMataPelajaran>('MataPelajaran', MataPelajaranSchema);

export default MataPelajaranModel;
