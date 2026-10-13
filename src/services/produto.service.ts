import { Prisma, PrismaClient, Produto } from "@prisma/client";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { AppError } from "@/types";

export const produtoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  sku: z.string().trim().min(1, "SKU é obrigatório"),
  descricao: z.string().nullable().optional(),
  preco: z.coerce.number().finite().positive("O preço deve ser maior que zero"),
  quantidade: z.number().int().nonnegative().optional(),
  estoqueMinimo: z.number().int().nonnegative().optional(),
  categoriaId: z.string().min(1, "Categoria é obrigatória"),
});

export const produtoUpdateSchema = produtoSchema.partial();

export type ProdutoInput = z.infer<typeof produtoSchema>;

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export class ProdutoService {
  constructor(private readonly database: Pick<PrismaClient, "produto"> = prisma) {}

  public async getAllProdutos(params: {
    page?: number;
    limit?: number;
    q?: string;
  } = {}): Promise<Produto[]> {
    const { page, limit } = paginationSchema.parse(params);
    const search = params.q?.trim();

    return prisma.produto.findMany({
      skip: (page - 1) * limit,
      take: limit,
      ...(search && {
        where: {
            OR: [
              { nome: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
        },
      }),
      orderBy: { nome: "asc" },
    });
  }

  public async getProdutoById(id: string): Promise<Produto | null> {
    return prisma.produto.findUnique({ where: { id } });
  }

  public async createProduto(input: unknown): Promise<Produto> {
    const data = produtoSchema.parse(input);
    const existingProduto = await prisma.produto.findUnique({
      where: { sku: data.sku },
    });

    if (existingProduto) {
      throw new AppError("Já existe um produto com este SKU", 409);
    }

    return prisma.produto.create({
      data: {
        nome: data.nome,
        sku: data.sku,
        preco: data.preco,
        categoriaId: data.categoriaId,
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.quantidade !== undefined && { quantidade: data.quantidade }),
        ...(data.estoqueMinimo !== undefined && {
          estoqueMinimo: data.estoqueMinimo,
        }),
      },
    });
  }

  public async updateProduto(id: string, input: unknown): Promise<Produto> {
    const data = produtoUpdateSchema.parse(input);

    if (Object.keys(data).length === 0) {
      throw new AppError("Informe ao menos um campo para atualizar", 400);
    }

    if (data.sku) {
      const existingProduto = await prisma.produto.findUnique({
        where: { sku: data.sku },
      });
      if (existingProduto && existingProduto.id !== id) {
        throw new AppError("Já existe um produto com este SKU", 409);
      }
    }

    return prisma.produto.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      } as Prisma.ProdutoUpdateInput,
    });
  }

  public async deleteProduto(id: string): Promise<void> {
    const produto = await this.database.produto.findUnique({
      where: { id },
      select: {
        id: true,
        movimentacoes: { select: { id: true }, take: 1 },
      },
    });

    if (!produto) {
      throw new AppError("Produto não encontrado", 404);
    }

    if (produto.movimentacoes.length > 0) {
      throw new AppError(
        "Produto possui movimentações registradas e não pode ser excluído",
        409,
      );
    }

    await this.database.produto.delete({ where: { id } });
  }

  public async getProdutosLowStock(): Promise<Produto[]> {
    return prisma.produto.findMany({
      where: {
        quantidade: { lte: prisma.produto.fields.estoqueMinimo },
      },
      orderBy: { quantidade: "asc" },
    });
  }
}