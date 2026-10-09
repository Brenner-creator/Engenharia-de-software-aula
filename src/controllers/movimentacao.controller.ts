import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { MovimentacaoService } from "@/services/movimentacao.service";
import { AppError } from "@/types";

export class MovimentacaoController {
  private movimentacaoService: MovimentacaoService;

  constructor() {
    this.movimentacaoService = new MovimentacaoService();
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
      if (error.code === "P2025" || error.code === "P2003") {
        res.status(404).json({ message: "Produto ou usuário não encontrado" });
        return;
      }
    }

    res.status(500).json({ message: "Erro interno ao processar movimentação" });
  }

  public registrarMovimentacao = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      res.status(401).json({ message: "Usuário não autenticado" });
      return;
    }

    try {
      const movimentacao = await this.movimentacaoService.registrarMovimentacao(
        usuarioId,
        req.body,
      );
      res.status(201).json(movimentacao);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public listarMovimentacoes = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const movimentacoes = await this.movimentacaoService.listarMovimentacoes({
        ...(req.pagination ?? { page: 1, limit: 10 }),
        ...(typeof req.query.produtoId === "string" && {
          produtoId: req.query.produtoId,
        }),
        ...(typeof req.query.dataInicio === "string" && {
          dataInicio: req.query.dataInicio,
        }),
        ...(typeof req.query.dataFim === "string" && {
          dataFim: req.query.dataFim,
        }),
      });
      res.status(200).json(movimentacoes);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public listarMovimentacoesPorProduto = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const movimentacoes = await this.movimentacaoService.listarMovimentacoes({
        produtoId: req.params.produtoId as string,
        ...(req.pagination ?? { page: 1, limit: 10 }),
        ...(typeof req.query.dataInicio === "string" && {
          dataInicio: req.query.dataInicio,
        }),
        ...(typeof req.query.dataFim === "string" && {
          dataFim: req.query.dataFim,
        }),
      });
      res.status(200).json(movimentacoes);
    } catch (error) {
      this.handleError(error, res);
    }
  };
}