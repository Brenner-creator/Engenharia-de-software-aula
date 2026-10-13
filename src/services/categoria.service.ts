import { z } from "zod";
import prisma from '@/lib/prisma';
import { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "@/types";

export const categoriaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Categoria = z.infer<typeof categoriaSchema>;

export class CategoriaService {
  constructor(private readonly database: Pick<PrismaClient, "categoria"> = prisma) {}

  public async getAllCategorias(params: {
    page?: number;
    limit?: number;
    q?: string;
    orderBy?: { [key: string]: 'asc' | 'desc' };
  }): Promise<Categoria[]> {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit || 0;

    const where = params.q
      ? {
          OR: [
            { nome: { contains: params.q, mode: Prisma.QueryMode.insensitive } },
            { descricao: { contains: params.q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const orderBy = params.orderBy
      ? Object.entries(params.orderBy).map(([key, value]) => ({
          [key]: value === 'asc' ? ('asc' as const) : ('desc' as const),
        }))
      : { createdAt: 'desc' as const };

    const categorias = await prisma.categoria.findMany({
      skip,
      take: limit || 10,
      where,
      orderBy,
    });

    return categorias;
  }

  public async getCategoriaById(id: string): Promise<Categoria | null> {
    const categoria = await prisma.categoria.findUnique({
      where: { id },
    });
    return categoria;
  }

 public async createCategoria(
    categoriaData: Omit<Categoria, "id" | "createdAt" | "updatedAt">
  ): Promise<Categoria> {
    const cleanData = Object.fromEntries(
      Object.entries(categoriaData).filter(([_, value]) => value !== undefined)
    );

    const newCategoria = await prisma.categoria.create({
      data: {
        ...cleanData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Prisma.CategoriaCreateInput,
    });
    return newCategoria;
  }

  public async updateCategoria(
    id: string,
    categoriaData: Partial<Omit<Categoria, "id" | "createdAt" | "updatedAt">>
  ): Promise<Categoria | null> {
    // Remove propriedades com valor 'undefined' para ser compatível com exactOptionalPropertyTypes
    const cleanData = Object.fromEntries(
      Object.entries(categoriaData).filter(([_, value]) => value !== undefined)
    );

    const updatedCategoria = await prisma.categoria.update({
      where: { id },
      data: {
        ...cleanData,
        updatedAt: new Date(),
      } as Prisma.CategoriaUpdateInput,
    });
    return updatedCategoria;
  }

  public async deleteCategoria(id: string): Promise<boolean> {
    const categoria = await this.database.categoria.findUnique({
      where: { id },
      select: {
        id: true,
        produtos: { select: { id: true }, take: 1 },
      },
    });

    if (!categoria) {
      throw new AppError("Categoria não encontrada", 404);
    }

    if (categoria.produtos.length > 0) {
      throw new AppError(
        "Categoria possui produtos vinculados e não pode ser excluída",
        409,
      );
    }

    await this.database.categoria.delete({
      where: { id },
    });
    return true;
  }
}