import { Router } from "express";
import { ProdutoController } from "@/controllers/produto.controller";
import { authenticate } from "@/middlewares/auth";

const router = Router();
const produtoController = new ProdutoController();

router.use(authenticate);

router.get("/", produtoController.getAllProdutos);
router.get("/alertas/estoque-baixo", produtoController.getProdutosLowStock);
router.get("/:id", produtoController.getProdutoById);
router.post("/", produtoController.createProduto);
router.put("/:id", produtoController.updateProduto);
router.delete("/:id", produtoController.deleteProduto);

export default router;