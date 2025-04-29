import { Response } from "express";
import { IPaginationQuery, IReqUser } from "../utils/interfaces";
import CategoryModel, { categoryDAO } from "../models/category.model";
import response from "../utils/response";

export default {
  async create(req: IReqUser, res: Response) {
    try {
      await categoryDAO.validate(req.body);
      const result = await CategoryModel.create(req.body);
      response.success(res, result, "Sukses membuat kategori");
    } catch (error) {
      response.error(res, error, "Gagal membuat kategori");
    }
  },

  async findAll(req: IReqUser, res: Response) {
    const {
      page = 1,
      limit = 10,
      search,
    } = req.query as unknown as IPaginationQuery;
    try {
      const query = {};

      if (search) {
        Object.assign(query, {
          $or: [
            {
              name: { $regex: search, $options: "i" },
            },
            {
              descripton: { $regex: search, $options: "i" },
            },
          ],
        });
      }

      const result = await CategoryModel.find(query)
        .limit(limit)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 })
        .exec();

      const count = await CategoryModel.countDocuments(query);
      response.pagination(
        res,
        result,
        {
          total: count,
          totalPages: Math.ceil(count / limit),
          current: page,
        },
        "Sukses mengambil semua kategori"
      );
    } catch (error) {
      response.error(res, error, "Gagal mengambil semua kategori");
    }
  },

  async findOne(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await CategoryModel.findById(id);
      response.success(res, result, "Sukses mengambil kategori");
    } catch (error) {
      response.error(res, error, "Gagal mengambil kategori");
    }
  },

  async update(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await CategoryModel.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      response.success(res, result, "Sukses update kategori");
    } catch (error) {
      response.error(res, error, "Gagal mengupdate kategori");
    }
  },

  async remove(req: IReqUser, res: Response) {
    try {
      const { id } = req.params;
      const result = await CategoryModel.findByIdAndDelete(id);
      response.success(res, result, "Sukses menghapus kategori");
    } catch (error) {
      response.error(res, error, "Gagal menghapus kategori");
    }
  },
};
