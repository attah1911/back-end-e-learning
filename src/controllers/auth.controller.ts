import { Request, Response } from "express";
import * as Yup from "yup";

import UserModel from "../models/user.model";
import { encrypt } from "../utils/encryption";
import { generateToken } from "../utils/jwt";
import { IReqUser } from "../utils/interfaces";
import response from "../utils/response";
import { userUpdateDAO } from "../models/user.dao";

type TRegister = {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type TLogin = {
  identifier: string;
  password: string;
};

const registerValidateSchema = Yup.object({
  fullName: Yup.string().required(),
  username: Yup.string().required(),
  email: Yup.string().email().required(),
  password: Yup.string()
    .required()
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
    ),
  confirmPassword: Yup.string()
    .required()
    .oneOf([Yup.ref("password"), ""], "Password tidak sesuai"),
});

export default {
  async updateProfile(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
    try {
      const user = req.user;
      const { fullName, username, email, profilePicture } = req.body;

      // Only allow updating these fields
      const updateData = {
        fullName,
        username,
        email,
        profilePicture
      };

      // Validate the update data
      await userUpdateDAO.validate(updateData);

      // Check if username is already taken
      if (updateData.username) {
        const existingUser = await UserModel.findOne({
          username: updateData.username,
          _id: { $ne: user?.id }
        });
        if (existingUser) {
          return response.error(res, null, "Username sudah digunakan");
        }
      }

      // Check if email is already taken
      if (updateData.email) {
        const existingUser = await UserModel.findOne({
          email: updateData.email,
          _id: { $ne: user?.id }
        });
        if (existingUser) {
          return response.error(res, null, "Email sudah digunakan");
        }
      }

      // Update user data
      const result = await UserModel.findByIdAndUpdate(
        user?.id,
        updateData,
        { new: true }
      );

      if (!result) {
        return response.error(res, null, "Data pengguna tidak ditemukan");
      }

      response.success(res, result, "Sukses mengupdate profil");
    } catch (error) {
      response.error(res, error, "Gagal mengupdate profil");
    }
  },

  async register(req: Request, res: Response) {
    /**
     #swagger.tags = ['Auth']
     */
    const { fullName, username, email, password, confirmPassword } =
      req.body as unknown as TRegister;

    try {
      await registerValidateSchema.validate({
        fullName,
        username,
        email,
        password,
        confirmPassword,
      });

      const result = await UserModel.create({
        fullName,
        email,
        username,
        password,
      });

      response.success(res, result, "Registrasi Sukses");
    } catch (error) {
      response.error(res, error, "Registrasi gagal");
    }
  },

  async login(req: Request, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.requestBody = {
      required: true,
      schema: {$ref: "#/components/schemas/LoginRequest"}
     }
     */
    const { identifier, password } = req.body as unknown as TLogin;

    try {
      // ambil data user berdasarkan "identifier" -> email dan username

      const userByIdentifier = await UserModel.findOne({
        $or: [
          {
            email: identifier,
          },
          {
            username: identifier,
          },
        ],
        isActive: true,
      });

      if (!userByIdentifier) {
        return response.unauthorized(res, "User tidak ditemukan");
      }

      // validasi password
      const validatePassword: boolean =
        encrypt(password) === userByIdentifier.password;

      if (!validatePassword) {
        return response.unauthorized(res, "Password Salah");
      }

      const token = generateToken({
        id: userByIdentifier._id,
        role: userByIdentifier.role,
      });

      response.success(res, token, "Login Sukses");
    } catch (error) {
      response.error(res, error, "Login Gagal");
    }
  },

  async me(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.security =[{
      "bearerAuth": []
     }]
     */

    try {
      const user = req.user;
      const result = await UserModel.findById(user?.id);

      response.success(res, result, "Sukses mengambil user profile");
    } catch (error) {
      response.error(res, error, "Gagal mengambil user profile");
    }
  },

  async activation(req: Request, res: Response) {
    /**
     #swagger.tags = ['Auth']
     #swagger.requestBody = {
       required: true,
       schema: {$ref: '#/components/schemas/ActivationRequest'}
     }
     */
    try {
      const { code } = req.body as { code: string };

      const user = await UserModel.findOneAndUpdate(
        {
          activationCode: code,
        },
        {
          isActive: true,
        },
        {
          new: true,
        }
      );

      response.success(res, user, "User berhasil diaktivasi");
    } catch (error) {
      response.error(res, error, 'User gagal diaktivasi')
    }
  },
};
