import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interfaces";
import MateriPelajaranModel, { materiPelajaranDAO } from "../models/materiPelajaran.model";
import MataPelajaranModel from "../models/mataPelajaran.model";
import response from "../utils/response";
import mongoose from "mongoose";
import { ROLES } from "../utils/constant";

export default {
  async create(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['MateriPelajaran']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { mataPelajaranId } = req.params;
      
      // Validate input
      await materiPelajaranDAO.validate(req.body);

      // Get mata pelajaran and verify it exists
      const mataPelajaran = await MataPelajaranModel.findById(mataPelajaranId);
      if (!mataPelajaran) {
        return response.error(res, null, "Data mata pelajaran tidak ditemukan");
      }

      // If user is a guru, verify ownership of mata pelajaran
      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher || mataPelajaran.guru.toString() !== teacher._id.toString()) {
          return response.error(res, null, "Anda tidak memiliki akses ke mata pelajaran ini");
        }
      }

      // Get max order number for this mata pelajaran
      const maxOrder = await MateriPelajaranModel.findOne({ mataPelajaran: mataPelajaranId })
        .sort({ order: -1 })
        .select('order');
      
      const nextOrder = maxOrder ? maxOrder.order + 1 : 1;

      // Create materi pelajaran
      const materiPelajaran = await MateriPelajaranModel.create([{
        ...req.body,
        mataPelajaran: mataPelajaranId,
        order: nextOrder
      }], { session });

      // Update mata pelajaran's materiPelajaran array
      await MataPelajaranModel.findByIdAndUpdate(
        mataPelajaranId,
        { $push: { materiPelajaran: materiPelajaran[0]._id } },
        { session }
      );

      await session.commitTransaction();
      response.success(res, materiPelajaran[0], "Sukses membuat materi pelajaran");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal membuat materi pelajaran");
    } finally {
      session.endSession();
    }
  },

  async findAll(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['MateriPelajaran']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
    const {
      page = 1,
      limit = 10,
      search,
    } = req.query as unknown as IPaginationQuery;
    const { mataPelajaranId } = req.params;

    try {
      // Verify mata pelajaran exists
      const mataPelajaran = await MataPelajaranModel.findById(mataPelajaranId);
      if (!mataPelajaran) {
        return response.error(res, null, "Data mata pelajaran tidak ditemukan");
      }

      // If user is a guru, verify ownership
      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher || mataPelajaran.guru.toString() !== teacher._id.toString()) {
          return response.error(res, null, "Anda tidak memiliki akses ke mata pelajaran ini");
        }
      }

      const query: any = { mataPelajaran: mataPelajaranId };

      if (search) {
        Object.assign(query, {
          $or: [
            { judul: { $regex: search, $options: "i" } },
            { "konten.teks": { $regex: search, $options: "i" } },
          ],
        });
      }

      const result = await MateriPelajaranModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ order: 1 })
        .exec();

      const count = await MateriPelajaranModel.countDocuments(query);
      response.pagination(
        res,
        result,
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          current: page,
        },
        "Sukses mengambil data materi pelajaran"
      );
    } catch (error) {
      response.error(res, error, "Gagal mengambil data materi pelajaran");
    }
  },

  async findOne(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['MateriPelajaran']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
    try {
      const { id, mataPelajaranId } = req.params;

      const materiPelajaran = await MateriPelajaranModel.findOne({
        _id: id,
        mataPelajaran: mataPelajaranId
      });

      if (!materiPelajaran) {
        return response.error(res, null, "Data materi pelajaran tidak ditemukan");
      }

      // Verify mata pelajaran exists and check ownership
      const mataPelajaran = await MataPelajaranModel.findById(mataPelajaranId);
      if (!mataPelajaran) {
        return response.error(res, null, "Data mata pelajaran tidak ditemukan");
      }

      // If user is a guru, verify ownership
      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher || mataPelajaran.guru.toString() !== teacher._id.toString()) {
          return response.error(res, null, "Anda tidak memiliki akses ke mata pelajaran ini");
        }
      }

      response.success(res, materiPelajaran, "Sukses mengambil data materi pelajaran");
    } catch (error) {
      response.error(res, error, "Gagal mengambil data materi pelajaran");
    }
  },

  async update(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['MateriPelajaran']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id, mataPelajaranId } = req.params;

      // Validate input
      await materiPelajaranDAO.validate(req.body);

      // Get existing data
      const materiPelajaran = await MateriPelajaranModel.findOne({
        _id: id,
        mataPelajaran: mataPelajaranId
      });

      if (!materiPelajaran) {
        return response.error(res, null, "Data materi pelajaran tidak ditemukan");
      }

      // Verify mata pelajaran exists and check ownership
      const mataPelajaran = await MataPelajaranModel.findById(mataPelajaranId);
      if (!mataPelajaran) {
        return response.error(res, null, "Data mata pelajaran tidak ditemukan");
      }

      // If user is a guru, verify ownership
      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher || mataPelajaran.guru.toString() !== teacher._id.toString()) {
          return response.error(res, null, "Anda tidak memiliki akses ke mata pelajaran ini");
        }
      }

      // If order is being changed, ensure it's valid
      if (req.body.order && req.body.order !== materiPelajaran.order) {
        const count = await MateriPelajaranModel.countDocuments({ mataPelajaran: mataPelajaranId });
        if (req.body.order < 1 || req.body.order > count) {
          return response.error(res, null, "Urutan tidak valid");
        }

        // Reorder other items if necessary
        if (req.body.order > materiPelajaran.order) {
          await MateriPelajaranModel.updateMany(
            {
              mataPelajaran: mataPelajaranId,
              order: { $gt: materiPelajaran.order, $lte: req.body.order }
            },
            { $inc: { order: -1 } },
            { session }
          );
        } else {
          await MateriPelajaranModel.updateMany(
            {
              mataPelajaran: mataPelajaranId,
              order: { $gte: req.body.order, $lt: materiPelajaran.order }
            },
            { $inc: { order: 1 } },
            { session }
          );
        }
      }

      // Update materi pelajaran
      const result = await MateriPelajaranModel.findByIdAndUpdate(
        id,
        req.body,
        { new: true, session }
      );

      await session.commitTransaction();
      response.success(res, result, "Sukses mengupdate materi pelajaran");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal mengupdate materi pelajaran");
    } finally {
      session.endSession();
    }
  },

  async remove(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['MateriPelajaran']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id, mataPelajaranId } = req.params;

      // Get existing data
      const materiPelajaran = await MateriPelajaranModel.findOne({
        _id: id,
        mataPelajaran: mataPelajaranId
      });

      if (!materiPelajaran) {
        return response.error(res, null, "Data materi pelajaran tidak ditemukan");
      }

      // Verify mata pelajaran exists and check ownership
      const mataPelajaran = await MataPelajaranModel.findById(mataPelajaranId);
      if (!mataPelajaran) {
        return response.error(res, null, "Data mata pelajaran tidak ditemukan");
      }

      // If user is a guru, verify ownership
      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher || mataPelajaran.guru.toString() !== teacher._id.toString()) {
          return response.error(res, null, "Anda tidak memiliki akses ke mata pelajaran ini");
        }
      }

      // Delete materi pelajaran
      await MateriPelajaranModel.findByIdAndDelete(id, { session });

      // Update order of remaining items
      await MateriPelajaranModel.updateMany(
        {
          mataPelajaran: mataPelajaranId,
          order: { $gt: materiPelajaran.order }
        },
        { $inc: { order: -1 } },
        { session }
      );

      // Remove reference from mata pelajaran
      await MataPelajaranModel.findByIdAndUpdate(
        mataPelajaranId,
        { $pull: { materiPelajaran: id } },
        { session }
      );

      await session.commitTransaction();
      response.success(res, null, "Sukses menghapus materi pelajaran");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal menghapus materi pelajaran");
    } finally {
      session.endSession();
    }
  },

  async reorder(req: IReqUser, res: Response) {
    /**
     #swagger.tags = ['MateriPelajaran']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { mataPelajaranId } = req.params;
      const { items } = req.body as { items: { id: string; order: number }[] };

      // Verify mata pelajaran exists and check ownership
      const mataPelajaran = await MataPelajaranModel.findById(mataPelajaranId);
      if (!mataPelajaran) {
        return response.error(res, null, "Data mata pelajaran tidak ditemukan");
      }

      // If user is a guru, verify ownership
      if (req.user?.role === ROLES.GURU) {
        const teacher = await mongoose.model('Teacher').findOne({ userId: req.user.id });
        if (!teacher || mataPelajaran.guru.toString() !== teacher._id.toString()) {
          return response.error(res, null, "Anda tidak memiliki akses ke mata pelajaran ini");
        }
      }

      // Validate order numbers
      const count = await MateriPelajaranModel.countDocuments({ mataPelajaran: mataPelajaranId });
      const orderSet = new Set(items.map(item => item.order));
      if (orderSet.size !== items.length || 
          Math.min(...items.map(i => i.order)) < 1 || 
          Math.max(...items.map(i => i.order)) > count) {
        return response.error(res, null, "Urutan tidak valid");
      }

      // Update order for each item
      const updates = items.map(item => 
        MateriPelajaranModel.findOneAndUpdate(
          { _id: item.id, mataPelajaran: mataPelajaranId },
          { order: item.order },
          { session }
        )
      );

      await Promise.all(updates);
      await session.commitTransaction();

      const result = await MateriPelajaranModel.find({ mataPelajaran: mataPelajaranId })
        .sort({ order: 1 });

      response.success(res, result, "Sukses mengubah urutan materi pelajaran");
    } catch (error) {
      await session.abortTransaction();
      response.error(res, error, "Gagal mengubah urutan materi pelajaran");
    } finally {
      session.endSession();
    }
  }
};