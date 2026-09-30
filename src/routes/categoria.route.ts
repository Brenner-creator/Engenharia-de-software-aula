import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller';
import { authMiddleware } from '../middlewares/auth';

const categoriaRoutes = Router();
const categoriaController = new CategoriaController();

categoriaRoutes.post('/', authMiddleware, categoriaController.create);
categoriaRoutes.get('/', categoriaController.findAll);
categoriaRoutes.get('/:id', categoriaController.findById);
categoriaRoutes.put('/:id', authMiddleware, categoriaController.update);
categoriaRoutes.delete('/:id', authMiddleware, categoriaController.delete);

export default categoriaRoutes;