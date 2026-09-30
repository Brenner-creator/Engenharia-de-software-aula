import { Router } from "express";
import { CategoriaController } from "@/controllers/categoria.controller";
import { authenticate, authorize } from "@/middlewares/auth";
import { UserRole } from "@/types";

const router = Router();

const categoriaController = new CategoriaController();

// router.use(authenticate); // Descomente para proteger todas as rotas com autenticação

router.get("/", categoriaController.getAllCategorias);
router.get("/:id", categoriaController.getCategoriaById);
router.post("/", categoriaController.createCategoria);
router.put("/:id", categoriaController.updateCategoria);
router.delete("/:id", categoriaController.deleteCategoria);

export default router;