import mongoose, { Schema } from "mongoose";
import * as Yup from "yup";

export const teacherDAO = Yup.object({
  fullName: Yup.string().required(),
  email: Yup.string().email().required(),
  nrk: Yup.string().required(),
  noTelp: Yup.string().required(),
});

export interface Teacher {
  fullName: string;
  email: string;
  nrk: string;
  noTelp: string;
  userId: mongoose.Types.ObjectId;
}

const TeacherSchema = new Schema<Teacher>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    nrk: {
      type: String,
      required: true,
      unique: true,
    },
    noTelp: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const TeacherModel = mongoose.model("Teacher", TeacherSchema);

export default TeacherModel;