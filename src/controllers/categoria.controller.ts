import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { Categoria, CategoriaService } from '@/services/categoria.service';
import { AppError } from '@/types';

export class CategoriaController {
  private categoriaService: CategoriaService;

  constructor() {
    this.categoriaService = new CategoriaService();
  }

  public getAllCategorias = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, q } = req.pagination ?? { page: 1, limit: 10 };
      const categorias = await this.categoriaService.getAllCategorias({
        page,
        limit,
        ...(q !== undefined && { q }),
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
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          res.status(409).json({ message: 'Categoria possui produtos vinculados e não pode ser excluída' });
          return;
        }
        if (error.code === 'P2025') {
          res.status(404).json({ message: 'Categoria não encontrada' });
          return;
        }
      }
      res.status(500).json({ message: 'Erro interno ao excluir categoria' });
    }
  };
}