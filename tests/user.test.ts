import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { userSchema } from "../src/services/user.service";

describe("userSchema", () => {
  const validUser = {
    name: "Ana Silva",
    email: "ana@example.com",
    password: "senha123",
  };

  it("aceita um usuário com os campos obrigatórios válidos", () => {
    assert.equal(userSchema.safeParse(validUser).success, true);
  });

  it("rejeita nome vazio", () => {
    assert.equal(
      userSchema.safeParse({ ...validUser, name: "" }).success,
      false,
    );
  });

  it("rejeita e-mail em formato inválido", () => {
    assert.equal(
      userSchema.safeParse({ ...validUser, email: "email-invalido" }).success,
      false,
    );
  });

  it("rejeita senha com menos de seis caracteres", () => {
    assert.equal(
      userSchema.safeParse({ ...validUser, password: "12345" }).success,
      false,
    );
  });
});