import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type DashboardMetricsRow = {
  totalProdutos: number;
  valorTotalEmEstoque: Prisma.Decimal;
  quantidadeTotal: number;
  produtosEstoqueBaixo: number;
};

export class DashboardService {
  public async getMétricasGerais(): Promise<{
    totalProdutos: number;
    valorTotalEmEstoque: number;
    quantidadeTotal: number;
    produtosEstoqueBaixo: number;
  }> {
    const [metrics] = await prisma.$queryRaw<DashboardMetricsRow[]>`
      SELECT
        COUNT(*)::int AS "totalProdutos",
        COALESCE(SUM("preco" * "quantidade"), 0)::numeric AS "valorTotalEmEstoque",
        COALESCE(SUM("quantidade"), 0)::int AS "quantidadeTotal",
        COUNT(*) FILTER (
          WHERE "quantidade" <= "estoqueMinimo"
        )::int AS "produtosEstoqueBaixo"
      FROM "produtos"
    `;

    return {
      totalProdutos: metrics?.totalProdutos ?? 0,
      valorTotalEmEstoque: metrics?.valorTotalEmEstoque.toNumber() ?? 0,
      quantidadeTotal: metrics?.quantidadeTotal ?? 0,
      produtosEstoqueBaixo: metrics?.produtosEstoqueBaixo ?? 0,
    };
  }

  public async getUltimasMovimentacoes() {
    return prisma.movimentacaoEstoque.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tipo: true,
        quantidade: true,
        observacao: true,
        createdAt: true,
        produto: {
          select: { id: true, nome: true, sku: true },
        },
        usuario: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}