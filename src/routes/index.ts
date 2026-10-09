import { Router } from "express";
import userRoutes from "./user.route";
import authRoutes from "./auth.route";
import categoriaRoutes from './categoria.route';
import produtoRoutes from "./produto.route";
import movimentacaoRoutes from "./movimentacao.route";
import clienteRoutes from "./cliente.route";
import dashboardRoutes from "./dashboard.route";
const routes = Router();

routes.use("/users", userRoutes);
routes.use("/auth", authRoutes);
routes.use('/categorias', categoriaRoutes);
routes.use("/produtos", produtoRoutes);
routes.use("/movimentacoes", movimentacaoRoutes);
routes.use("/clientes", clienteRoutes);
routes.use("/dashboard", dashboardRoutes);

routes.get("/", (req, res) => {
  res.json({ message: "Store API - Node.js + Express + TypeScript" });
});

export default routes;