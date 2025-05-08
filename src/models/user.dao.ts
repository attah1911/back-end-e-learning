import * as Yup from "yup";
import { ROLES } from "../utils/constant";

const passwordValidation = Yup.string()
  .min(6, "Password setidaknya harus 6 karakter")
  .test(
    "at-least-one-uppercase-letter",
    "Password harus memiliki setidaknya satu huruf kapital",
    (value) => {
      if (!value) return false;
      const regex = /^(?=.*[A-Z])/;
      return regex.test(value);
    }
  )
  .test(
    "at-least-one-number",
    "Password harus memiliki setidaknya satu angka",
    (value) => {
      if (!value) return false;
      const regex = /^(?=.*\d)/;
      return regex.test(value);
    }
  );

export const userDAO = Yup.object({
  fullName: Yup.string().required(),
  username: Yup.string().required(),
  email: Yup.string().email().required(),
  password: passwordValidation.required(),
  role: Yup.string().oneOf([ROLES.ADMIN, ROLES.GURU, ROLES.MURID]).required(),
  profilePicture: Yup.string(),
  isActive: Yup.boolean(),
  activationCode: Yup.string(),
});

export const userUpdateDAO = Yup.object({
  fullName: Yup.string().required("Nama lengkap harus diisi"),
  username: Yup.string().required("Username harus diisi"),
  email: Yup.string().email("Format email tidak valid").required("Email harus diisi"),
  profilePicture: Yup.string().nullable()
});

export const userCreateTeacherDAO = Yup.object({
  fullName: Yup.string().required(),
  username: Yup.string().required(),
  email: Yup.string().email().required(),
  nrk: Yup.string().required(),
  noTelp: Yup.string().required(),
});

export const userCreateStudentDAO = Yup.object({
  fullName: Yup.string().required(),
  username: Yup.string().required(),
  email: Yup.string().email().required(),
  nis: Yup.string().required(),
  kelas: Yup.string().required(),
  noTelp: Yup.string().required(),
});

export type UserUpdate = Yup.InferType<typeof userUpdateDAO>;
export type UserCreateTeacher = Yup.InferType<typeof userCreateTeacherDAO>;
export type UserCreateStudent = Yup.InferType<typeof userCreateStudentDAO>;
