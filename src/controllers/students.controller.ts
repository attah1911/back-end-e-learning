import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interfaces";
import UserModel from "../models/user.model";
import StudentModel from "../models/student.model";
import { studentDAO } from "../models/student.model";
import response from "../utils/response";
import { ROLES } from "../utils/constant";
import mongoose from "mongoose";
import { encrypt } from "../utils/encryption";

const default_password_murid = "Smpn37Jakartamurid";
export default {
  async create(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Student']
     #swagger.security = [{
       "bearerAuth": []
     }]
     #swagger.requestBody = {
       required: true,
       schema: { $ref: "#/components/schemas/CreateStudentRequest" }
     }
     */
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate student data
      await studentDAO.validate(req.body);
      
      const { fullName, email, nis, kelas, noTelp } = req.body;

      // Create user account with generated username and password
      const username = email.split('@')[0]; // use email prefix as username
      const password = default_password_murid; // generate simple password

      const userData = {
        fullName,
        username,
        email,
        password,
        role: ROLES.MURID,
        isActive: true // students are active by default
      };

      const user = await UserModel.create([userData], { session });
      
      // Create student profile
      const studentData = {
        fullName,
        email,
        nis,
        kelas,
        noTelp,
        userId: user[0]._id
      };

      const student = await StudentModel.create([studentData], { session });

      await session.commitTransaction();
      response.success(res, { user: user[0], student: student[0] }, "Sukses membuat data murid");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal membuat data murid");
    } finally {
      session.endSession();
    }
  },

  async findAll(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Student']
     #swagger.security = [{
       "bearerAuth": []
     }]
     #swagger.parameters['page'] = {
       in: 'query',
       description: 'Page number',
       required: false
     }
     #swagger.parameters['limit'] = {
       in: 'query',
       description: 'Items per page',
       required: false
     }
     #swagger.parameters['search'] = {
       in: 'query',
       description: 'Search term',
       required: false
     }
     */
     const {
      page = 1,
      limit = 10,
      search,
    } = req.query as unknown as IPaginationQuery;

    try {
      const query: any = {};

      if (search) {
        Object.assign(query, {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { nis: { $regex: search, $options: "i" } },
            { kelas: { $regex: search, $options: "i" } },
            { noTelp: { $regex: search, $options: "i" } },
          ],
        });
      }

      const resultPromise = StudentModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .select('fullName email nis kelas noTelp') // Only select needed fields
        .lean() // Get plain JavaScript objects instead of Mongoose documents
        .exec();

      const countPromise = StudentModel.countDocuments(query).exec();

      // Execute both queries concurrently
      const [result, count] = await Promise.all([resultPromise, countPromise]);

      return response.pagination(
        res,
        result,
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          current: page,
        },
        "Sukses mengambil data murid"
      );
    } catch (error) {
      return response.error(res, error, "Gagal mengambil data murid");
    }
  },

  async findOne(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Student']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
     try {
      const { id } = req.params;
      const result = await StudentModel.findById(id);
      if (!result) {
        return response.error(res, null, "Data murid tidak ditemukan");
      }
      response.success(res, result, "Sukses mengambil data murid");
    } catch (error) {
      response.error(res, error, "Gagal mengambil data murid");
    }
  },

  async update(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Student']
     #swagger.security = [{
       "bearerAuth": []
     }]
     #swagger.requestBody = {
       required: true,
       schema: { $ref: "#/components/schemas/UpdateStudentRequest" }
     }
     */
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const { fullName, email, nis, kelas, noTelp } = req.body;

      const student = await StudentModel.findById(id);
      if (!student) {
        return response.error(res, null, "Data murid tidak ditemukan");
      }

      // Update student data
      const updatedStudent = await StudentModel.findByIdAndUpdate(
        id,
        { fullName, email, nis, kelas, noTelp },
        { new: true, session }
      );

      // Update related user data
      await UserModel.findByIdAndUpdate(
        student.userId,
        { fullName, email },
        { session }
      );

      await session.commitTransaction();
      response.success(res, updatedStudent, "Sukses mengupdate data murid");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal mengupdate data murid");
    } finally {
      session.endSession();
    }
  },

  async remove(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['Student']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;
      const student = await StudentModel.findById(id);
      if (!student) {
        return response.error(res, null, "Data murid tidak ditemukan");
      }

      await StudentModel.findByIdAndDelete(id, { session });
      await UserModel.findByIdAndDelete(student.userId, { session });

      await session.commitTransaction();
      response.success(res, null, "Sukses menghapus data murid");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal menghapus data murid");
    } finally {
      session.endSession();
    }
  },
};