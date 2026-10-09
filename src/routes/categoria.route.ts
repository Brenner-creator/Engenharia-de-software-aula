import { Router } from "express";
import { CategoriaController } from "@/controllers/categoria.controller";
import { authenticate, authorize } from "@/middlewares/auth";
import { UserRole } from "@/types";

const router = Router();

const categoriaController = new CategoriaController();

router.use(authenticate);

router.get("/", categoriaController.getAllCategorias);
router.get("/:id", categoriaController.getCategoriaById);
router.post("/", authorize(UserRole.ADMIN), categoriaController.createCategoria);
router.put("/:id", authorize(UserRole.ADMIN), categoriaController.updateCategoria);
router.delete("/:id", authorize(UserRole.ADMIN), categoriaController.deleteCategoria);

export default router;