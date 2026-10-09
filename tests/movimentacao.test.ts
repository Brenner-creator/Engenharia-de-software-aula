import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../src/types";
import {
  MovimentacaoService,
  movimentacaoSchema,
} from "../src/services/movimentacao.service";

describe("movimentacaoSchema", () => {
  const validInput = {
    produtoId: "produto-1",
    quantidade: 2,
  };

  it("aceita movimentações de entrada e saída", () => {
    assert.equal(
      movimentacaoSchema.safeParse({ ...validInput, tipo: "ENTRADA" }).success,
      true,
    );
    assert.equal(
      movimentacaoSchema.safeParse({ ...validInput, tipo: "SAIDA" }).success,
      true,
    );
  });

  it("rejeita quantidades negativas ou iguais a zero", () => {
    assert.equal(
      movimentacaoSchema.safeParse({ ...validInput, tipo: "SAIDA", quantidade: 0 })
        .success,
      false,
    );
    assert.equal(
      movimentacaoSchema.safeParse({ ...validInput, tipo: "SAIDA", quantidade: -1 })
        .success,
      false,
    );
  });
});

describe("MovimentacaoService", () => {
  it("bloqueia saída quando o estoque disponível é insuficiente", async () => {
    const transaction = {
      produto: {
        findUnique: async () => ({ id: "produto-1", quantidade: 3 }),
      },
      movimentacaoEstoque: {
        create: async () => {
          throw new Error("Não deveria criar histórico para saída bloqueada");
        },
      },
    };
    const database = {
      $transaction: async (callback: (tx: typeof transaction) => unknown) =>
        callback(transaction),
    } as unknown as Pick<PrismaClient, "$transaction">;
    const service = new MovimentacaoService(database);

    await assert.rejects(
      service.registrarMovimentacao("usuario-1", {
        produtoId: "produto-1",
        tipo: "SAIDA",
        quantidade: 4,
      }),
      (error: unknown) =>
        error instanceof AppError &&
        error.statusCode === 409 &&
        error.message.includes("Disponível: 3"),
    );
  });
});