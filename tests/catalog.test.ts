import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../src/types";
import { CategoriaService } from "../src/services/categoria.service";
import { ProdutoService } from "../src/services/produto.service";

describe("exclusão de produtos", () => {
  it("bloqueia produto com movimentações registradas", async () => {
    let deleted = false;
    const database = {
      produto: {
        findUnique: async () => ({ id: "produto-1", movimentacoes: [{ id: "mov-1" }] }),
        delete: async () => {
          deleted = true;
        },
      },
    } as unknown as Pick<PrismaClient, "produto">;

    await assert.rejects(
      new ProdutoService(database).deleteProduto("produto-1"),
      (error: unknown) => error instanceof AppError && error.statusCode === 409,
    );
    assert.equal(deleted, false);
  });

  it("remove produto sem movimentações", async () => {
    let deleted = false;
    const database = {
      produto: {
        findUnique: async () => ({ id: "produto-1", movimentacoes: [] }),
        delete: async () => {
          deleted = true;
        },
      },
    } as unknown as Pick<PrismaClient, "produto">;

    await new ProdutoService(database).deleteProduto("produto-1");
    assert.equal(deleted, true);
  });
});

describe("exclusão de categorias", () => {
  it("bloqueia categoria com produtos vinculados", async () => {
    let deleted = false;
    const database = {
      categoria: {
        findUnique: async () => ({ id: "categoria-1", produtos: [{ id: "produto-1" }] }),
        delete: async () => {
          deleted = true;
        },
      },
    } as unknown as Pick<PrismaClient, "categoria">;

    await assert.rejects(
      new CategoriaService(database).deleteCategoria("categoria-1"),
      (error: unknown) => error instanceof AppError && error.statusCode === 409,
    );
    assert.equal(deleted, false);
  });

  it("remove categoria sem produtos", async () => {
    let deleted = false;
    const database = {
      categoria: {
        findUnique: async () => ({ id: "categoria-1", produtos: [] }),
        delete: async () => {
          deleted = true;
        },
      },
    } as unknown as Pick<PrismaClient, "categoria">;

    await new CategoriaService(database).deleteCategoria("categoria-1");
    assert.equal(deleted, true);
  });
});