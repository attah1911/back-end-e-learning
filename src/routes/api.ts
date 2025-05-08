import express from "express";
import authController from "../controllers/auth.controller";
import authMiddleware from "../middlewares/auth.middleware";
import aclMiddleware from "../middlewares/acl.middleware";
import { ROLES } from "../utils/constant";
import mediaMiddleware from "../middlewares/media.middleware";
import mediaController from "../controllers/media.controller";
import usersController from "../controllers/users.controller";
import teachersController from "../controllers/teachers.controller";
import studentsController from "../controllers/students.controller";
import mataPelajaranController from "../controllers/mataPelajaran.controller";
import materiPelajaranController from "../controllers/materiPelajaran.controller";

const router = express.Router();

// Auth Routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.me);
router.put("/auth/me", authMiddleware, authController.updateProfile);
router.post("/auth/activation", authController.activation);

// Media Routes
router.post(
  "/media/upload-single",
  [
    authMiddleware,
    aclMiddleware([ROLES.ADMIN, ROLES.GURU, ROLES.MURID]),
    mediaMiddleware.single("file"),
  ],
  mediaController.single
);
router.post(
  "/media/upload-multiple",
  [
    authMiddleware,
    aclMiddleware([ROLES.ADMIN, ROLES.GURU, ROLES.MURID]),
    mediaMiddleware.multiple("files"),
  ],
  mediaController.multiple
);
router.delete(
  "/media/remove",
  [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.GURU, ROLES.MURID])],
  mediaController.remove
);

// Teachers Management Routes (Admin Only)
router.post(
  "/users/teachers",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  teachersController.create
);
router.get(
  "/users/teachers",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  teachersController.findAll
);
router.get(
  "/users/teachers/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  teachersController.findOne
);
router.put(
  "/users/teachers/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  teachersController.update
);
router.delete(
  "/users/teachers/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  teachersController.remove
);

// Students Management Routes (Admin Only)
router.post(
  "/users/students",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  studentsController.create
);
router.get(
  "/users/students",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  studentsController.findAll
);
router.get(
  "/users/students/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  studentsController.findOne
);
router.put(
  "/users/students/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  studentsController.update
);
router.delete(
  "/users/students/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  studentsController.remove
);

// General User Management Routes (Admin Only)
router.post(
  "/users",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  usersController.create
);
router.get(
  "/users",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  usersController.findAll
);
router.get(
  "/users/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  usersController.findOne
);
router.put(
  "/users/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  usersController.update
);
router.delete(
  "/users/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN])],
  usersController.remove
);

// MataPelajaran Routes
router.post(
  "/mata-pelajaran",
  [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.GURU])],
  mataPelajaranController.create
);
router.get(
  "/mata-pelajaran",
  [authMiddleware],
  mataPelajaranController.findAll
);
router.get(
  "/mata-pelajaran/:id",
  [authMiddleware],
  mataPelajaranController.findOne
);
router.put(
  "/mata-pelajaran/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.GURU])],
  mataPelajaranController.update
);
router.delete(
  "/mata-pelajaran/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.GURU])],
  mataPelajaranController.remove
);

// MateriPelajaran Routes (Nested under MataPelajaran)
router.post(
  "/mata-pelajaran/:mataPelajaranId/materi",
  [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.GURU])],
  materiPelajaranController.create
);
router.get(
  "/mata-pelajaran/:mataPelajaranId/materi",
  [authMiddleware],
  materiPelajaranController.findAll
);
router.get(
  "/mata-pelajaran/:mataPelajaranId/materi/:id",
  [authMiddleware],
  materiPelajaranController.findOne
);
router.put(
  "/mata-pelajaran/:mataPelajaranId/materi/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.GURU])],
  materiPelajaranController.update
);
router.delete(
  "/mata-pelajaran/:mataPelajaranId/materi/:id",
  [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.GURU])],
  materiPelajaranController.remove
);

// Reorder MateriPelajaran
router.post(
  "/mata-pelajaran/:mataPelajaranId/materi/reorder",
  [authMiddleware, aclMiddleware([ROLES.ADMIN, ROLES.GURU])],
  materiPelajaranController.reorder
);

export default router;
