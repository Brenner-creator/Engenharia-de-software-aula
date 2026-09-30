import { z } from "zod";
import prisma from '@/lib/prisma';
import { Prisma } from "@prisma/client";

export const categoriaSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Categoria = z.infer<typeof categoriaSchema>;

export class CategoriaService {
  public async getAllCategorias(params: {
    page?: number;
    limit?: number;
    where?: Partial<Categoria>;
    orderBy?: { [key: string]: 'asc' | 'desc' };
  }): Promise<Categoria[]> {
    const { page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit || 0;

    const where = params.where
      ? {
          OR: Object.entries(params.where)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => ({
              [key]: { contains: String(value), mode: Prisma.QueryMode.insensitive },
            })),
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
    await prisma.categoria.delete({
      where: { id },
    });
    return true;
  }
}