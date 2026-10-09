import { MovimentacaoEstoque, Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { AppError } from "@/types";

export const movimentacaoSchema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  quantidade: z.number().int().positive("A quantidade deve ser maior que zero"),
  produtoId: z.string().trim().min(1, "Produto é obrigatório"),
  observacao: z.string().trim().max(500).nullable().optional(),
});

export type MovimentacaoInput = z.infer<typeof movimentacaoSchema>;

const filtrosMovimentacaoSchema = z
  .object({
    produtoId: z.string().trim().min(1).optional(),
    dataInicio: z.coerce.date().optional(),
    dataFim: z.coerce.date().optional(),
  })
  .refine(
    ({ dataInicio, dataFim }) =>
      !dataInicio || !dataFim || dataInicio <= dataFim,
    { message: "A data inicial deve ser anterior à data final", path: ["dataFim"] },
  );

export class MovimentacaoService {
  constructor(
    private readonly database: Pick<PrismaClient, "$transaction"> = prisma,
  ) {}

  public async registrarMovimentacao(
    usuarioId: string,
    input: unknown,
  ): Promise<MovimentacaoEstoque> {
    const data = movimentacaoSchema.parse(input);

    return this.database.$transaction(async (transaction) => {
      const produto = await transaction.produto.findUnique({
        where: { id: data.produtoId },
        select: { id: true, quantidade: true },
      });

      if (!produto) {
        throw new AppError("Produto não encontrado", 404);
      }

      if (data.tipo === "SAIDA") {
        if (produto.quantidade < data.quantidade) {
          throw new AppError(
            `Estoque insuficiente. Disponível: ${produto.quantidade} unidade(s).`,
            409,
          );
        }

        const updated = await transaction.produto.updateMany({
          where: {
            id: produto.id,
            quantidade: { gte: data.quantidade },
          },
          data: { quantidade: { decrement: data.quantidade } },
        });

        if (updated.count === 0) {
          const saldoAtual = await transaction.produto.findUnique({
            where: { id: produto.id },
            select: { quantidade: true },
          });
          const disponivel = saldoAtual?.quantidade ?? 0;
          throw new AppError(
            `Estoque insuficiente. Disponível: ${disponivel} unidade(s).`,
            409,
          );
        }
      } else {
        await transaction.produto.update({
          where: { id: produto.id },
          data: { quantidade: { increment: data.quantidade } },
        });
      }

      return transaction.movimentacaoEstoque.create({
        data: {
          produtoId: produto.id,
          usuarioId,
          tipo: data.tipo,
          quantidade: data.quantidade,
          ...(data.observacao !== undefined && {
            observacao: data.observacao,
          }),
        },
      });
    });
  }

  public async listarMovimentacoes(params: {
    produtoId?: string;
    dataInicio?: string;
    dataFim?: string;
    page?: number;
    limit?: number;
    q?: string;
  } = {}): Promise<MovimentacaoEstoque[]> {
    const filtros = filtrosMovimentacaoSchema.parse(params);
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const where: Prisma.MovimentacaoEstoqueWhereInput = {
      ...(filtros.produtoId && { produtoId: filtros.produtoId }),
      ...(params.q && {
        OR: [
          { tipo: { contains: params.q, mode: Prisma.QueryMode.insensitive } },
          { observacao: { contains: params.q, mode: Prisma.QueryMode.insensitive } },
          {
            produto: {
              is: {
                OR: [
                  { nome: { contains: params.q, mode: Prisma.QueryMode.insensitive } },
                  { sku: { contains: params.q, mode: Prisma.QueryMode.insensitive } },
                ],
              },
            },
          },
        ],
      }),
      ...((filtros.dataInicio || filtros.dataFim) && {
        createdAt: {
          ...(filtros.dataInicio && { gte: filtros.dataInicio }),
          ...(filtros.dataFim && { lte: filtros.dataFim }),
        },
      }),
    };

    return prisma.movimentacaoEstoque.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: { createdAt: "desc" },
    });
  }
}