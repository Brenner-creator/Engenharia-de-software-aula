import { Request, Response } from 'express';
import { CategoriaService } from '../services/categoria.service';

const categoriaService = new CategoriaService();

export class CategoriaController {
  async create(req: Request, res: Response) {
    try {
      const { nome, descricao } = req.body;

      if (!nome) {
        return res.status(400).json({ error: 'O nome da categoria é obrigatório.' });
      }

      const categoria = await categoriaService.create({ nome, descricao });
      return res.status(201).json(categoria);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao criar categoria.' });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const categorias = await categoriaService.findAll();
      return res.status(200).json(categorias);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao buscar categorias.' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const categoria = await categoriaService.findById(id);
      return res.status(200).json(categoria);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || 'Categoria não encontrada.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, descricao } = req.body;

      const categoria = await categoriaService.update(id, { nome, descricao });
      return res.status(200).json(categoria);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao atualizar categoria.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await categoriaService.delete(id);
      return res.status(200).json({ message: 'Categoria removida com sucesso.' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao remover categoria.' });
    }
  }
}