import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { ProdutoService } from "@/services/produto.service";
import { AppError } from "@/types";

export class ProdutoController {
  private produtoService: ProdutoService;

  constructor() {
    this.produtoService = new ProdutoService();
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Dados inválidos", errors: error.issues });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        res.status(409).json({ message: "Já existe um produto com este SKU" });
        return;
      }
      if (error.code === "P2025") {
        res.status(404).json({ message: "Produto não encontrado" });
        return;
      }
      if (error.code === "P2003") {
        res.status(400).json({ message: "Categoria informada não encontrada" });
        return;
      }
    }

    res.status(500).json({ message: "Erro interno ao processar produto" });
  }

  public getAllProdutos = async (req: Request, res: Response): Promise<void> => {
    try {
      const produtos = await this.produtoService.getAllProdutos({
        ...(req.pagination ?? { page: 1, limit: 10 }),
      });
      res.status(200).json(produtos);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getProdutosLowStock = async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const produtos = await this.produtoService.getProdutosLowStock();
      res.status(200).json(produtos);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getProdutoById = async (req: Request, res: Response): Promise<void> => {
    try {
      const produto = await this.produtoService.getProdutoById(req.params.id as string);
      if (!produto) {
        res.status(404).json({ message: "Produto não encontrado" });
        return;
      }
      res.status(200).json(produto);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public createProduto = async (req: Request, res: Response): Promise<void> => {
    try {
      const produto = await this.produtoService.createProduto(req.body);
      res.status(201).json(produto);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public updateProduto = async (req: Request, res: Response): Promise<void> => {
    try {
      const produto = await this.produtoService.updateProduto(
        req.params.id as string,
        req.body,
      );
      res.status(200).json(produto);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public deleteProduto = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.produtoService.deleteProduto(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        res.status(409).json({
          message: "Produto possui movimentações registradas e não pode ser excluído",
        });
        return;
      }
      this.handleError(error, res);
    }
  };
}