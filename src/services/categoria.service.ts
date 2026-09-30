import { prisma } from '../lib/prisma';

export interface CreateCategoriaDTO {
  nome: string;
  descricao?: string;
}

export interface UpdateCategoriaDTO {
  nome?: string;
  descricao?: string;
}

export class CategoriaService {
  async create(data: CreateCategoriaDTO) {
    return await prisma.categoria.create({
      data,
    });
  }

  async findAll() {
    return await prisma.categoria.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id: string) {
    const categoria = await prisma.categoria.findUnique({
      where: { id },
    });

    if (!categoria) {
      throw new Error('Categoria não encontrada.');
    }

    return categoria;
  }

  async update(id: string, data: UpdateCategoriaDTO) {
    await this.findById(id);

    return await prisma.categoria.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return await prisma.categoria.delete({
      where: { id },
    });
  }
}