import { Request, Response } from 'express';
import { Categoria, CategoriaService } from '@/services/categoria.service';

export class CategoriaController {
  private categoriaService: CategoriaService;

  constructor() {
    this.categoriaService = new CategoriaService();
  }

  public getAllCategorias = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, q, orderBy } = req.query as any;
      const categorias = await this.categoriaService.getAllCategorias({
        page: Number(page),
        limit: Number(limit),
        where: q,
        orderBy,
      });
      res.status(200).json(categorias);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories', error });
    }
  };

  public getCategoriaById = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoriaId = req.params.id as string;
      const categoria = await this.categoriaService.getCategoriaById(categoriaId);
      if (categoria) {
        res.status(200).json(categoria);
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error fetching category', error });
    }
  };

  public createCategoria = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoriaData = req.body;
      const newCategoria = await this.categoriaService.createCategoria(categoriaData);
      res.status(201).json(newCategoria);
    } catch (error) {
      res.status(500).json({ message: 'Error creating category', error });
    }
  };

  public updateCategoria = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoriaId = req.params.id as string;
      const categoriaData = req.body;
      const updatedCategoria = await this.categoriaService.updateCategoria(categoriaId, categoriaData);
      if (updatedCategoria) {
        res.status(200).json(updatedCategoria);
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error updating category', error });
    }
  };

  public deleteCategoria = async (req: Request, res: Response): Promise<void> => {
    try {
      const categoriaId = req.params.id as string;
      const deleted = await this.categoriaService.deleteCategoria(categoriaId);
      if (deleted) {
        res.status(200).json({ message: 'Category deleted successfully' });
      } else {
        res.status(404).json({ message: 'Category not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting category', error });
    }
  };
}