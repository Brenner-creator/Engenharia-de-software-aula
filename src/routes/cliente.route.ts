import { Router } from "express";
import { ClienteController } from "@/controllers/cliente.controller";
import { authenticate } from "@/middlewares/auth";

const router = Router();
const clienteController = new ClienteController();

router.use(authenticate);

router.get("/", clienteController.getAllClientes);
router.get("/:id", clienteController.getClienteById);
router.post("/", clienteController.createCliente);
router.put("/:id", clienteController.updateCliente);
router.delete("/:id", clienteController.deleteCliente);

export default router;