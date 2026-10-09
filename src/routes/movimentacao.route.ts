import { Router } from "express";
import { MovimentacaoController } from "@/controllers/movimentacao.controller";
import { authenticate } from "@/middlewares/auth";

const router = Router();
const movimentacaoController = new MovimentacaoController();

router.use(authenticate);

router.post("/", movimentacaoController.registrarMovimentacao);
router.get("/produto/:produtoId", movimentacaoController.listarMovimentacoesPorProduto);
router.get("/", movimentacaoController.listarMovimentacoes);

export default router;