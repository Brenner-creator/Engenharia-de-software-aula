import { Router } from "express";
import userRoutes from "./user.route";
import authRoutes from "./auth.route";
import categoriaRoutes from './categoria.route';
const routes = Router();

routes.use("/users", userRoutes);
routes.use("/auth", authRoutes);
routes.use('/categorias', categoriaRoutes);

routes.get("/", (req, res) => {
  res.json({ message: "Store API - Node.js + Express + TypeScript" });
});

export default routes;