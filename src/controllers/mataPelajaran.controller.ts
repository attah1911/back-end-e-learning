import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interfaces";
import MataPelajaranModel, { mataPelajaranDAO } from "../models/mataPelajaran.model";
import MateriPelajaranModel from "../models/materiPelajaran.model";
import response from "../utils/response";
import mongoose from "mongoose";
import { ROLES } from "../utils/constant";

export default {
  async create(req: IReqUser, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate input
      await mataPelajaranDAO.validate(req.body);

      // Verify that the guru exists and matches the provided ID
      const guruId = req.body.guru;
      const guru = await mongoose.model('Teacher').findById(guruId);
      if (!guru) {
        return response.error(res, null, "Data guru tidak ditemukan");
      }

      // Create mata pelajaran
      const mataPelajaran = await MataPelajaranModel.create([{
        ...req.body,
        guru: guruId
      }], { session });

      // Populate the guru data before sending response
      const populatedMataPelajaran = await MataPelajaranModel.findById(mataPelajaran[0]._id)
        .populate('guru', 'fullName email nip');

      await session.commitTransaction();
      response.success(res, populatedMataPelajaran, "Sukses membuat mata pelajaran");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal membuat mata pelajaran");
    } finally {
      session.endSession();
    }
  },

  async findAll(req: IReqUser, res: Response) {
    const {
      page = 1,
      limit = 10,
      search,
      kategori,
      guru
    } = req.query as unknown as IPaginationQuery & { kategori?: string; guru?: string };

    try {
      const query: any = {};

      if (search) {
        Object.assign(query, {
          $or: [
            { judul: { $regex: search, $options: "i" } },
            { deskripsi: { $regex: search, $options: "i" } },
          ],
        });
      }

      if (kategori) {
        query.kategori = kategori;
      }

      if (guru) {
        query.guru = guru;
      }

      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher) {
          return response.error(res, null, "Data guru tidak ditemukan");
        }
        query.guru = teacher._id;
      }

      const result = await MataPelajaranModel.find(query)
        .populate('guru', 'fullName email nip') // Include necessary teacher fields
        .populate({
          path: 'materiPelajaranList',
          options: { sort: { order: 1 } }
        })
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .exec();

      const count = await MataPelajaranModel.countDocuments(query);
      response.pagination(
        res,
        result,
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          current: page,
        },
        "Sukses mengambil data mata pelajaran"
      );
    } catch (error) {
      response.error(res, error, "Gagal mengambil data mata pelajaran");
    }
  },

  async findOne(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;

      const result = await MataPelajaranModel.findById(id)
        .populate('guru', 'fullName email nip')
        .populate({
          path: 'materiPelajaranList',
          options: { sort: { order: 1 } }
        });

      if (!result) {
        return response.error(res, null, "Data mata pelajaran tidak ditemukan");
      }

      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher || result.guru._id.toString() !== teacher._id.toString()) {
          return response.error(res, null, "Anda tidak memiliki akses ke mata pelajaran ini");
        }
      }

      response.success(res, result, "Sukses mengambil data mata pelajaran");
    } catch (error) {
      response.error(res, error, "Gagal mengambil data mata pelajaran");
    }
  },

  async update(req: IReqUser, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;

      await mataPelajaranDAO.validate(req.body);

      const mataPelajaran = await MataPelajaranModel.findById(id);
      if (!mataPelajaran) {
        return response.error(res, null, "Data mata pelajaran tidak ditemukan");
      }

      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher || mataPelajaran.guru.toString() !== teacher._id.toString()) {
          return response.error(res, null, "Anda tidak memiliki akses ke mata pelajaran ini");
        }
      }

      const result = await MataPelajaranModel.findByIdAndUpdate(
        id,
        req.body,
        { new: true, session }
      ).populate('guru', 'fullName email nip')
       .populate({
         path: 'materiPelajaranList',
         options: { sort: { order: 1 } }
       });

      await session.commitTransaction();
      response.success(res, result, "Sukses mengupdate mata pelajaran");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal mengupdate mata pelajaran");
    } finally {
      session.endSession();
    }
  },

  async remove(req: IReqUser, res: Response) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;

      const mataPelajaran = await MataPelajaranModel.findById(id);
      if (!mataPelajaran) {
        return response.error(res, null, "Data mata pelajaran tidak ditemukan");
      }

      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher || mataPelajaran.guru.toString() !== teacher._id.toString()) {
          return response.error(res, null, "Anda tidak memiliki akses ke mata pelajaran ini");
        }
      }

      await MateriPelajaranModel.deleteMany(
        { mataPelajaran: id },
        { session }
      );

      await MataPelajaranModel.findByIdAndDelete(id, { session });

      await session.commitTransaction();
      response.success(res, null, "Sukses menghapus mata pelajaran");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal menghapus mata pelajaran");
    } finally {
      session.endSession();
    }
  }
};