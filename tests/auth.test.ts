import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { forgotPasswordSchema, registerSchema, resetPasswordSchema } from "../src/services/auth.service";

describe("auth input schemas", () => {
  it("normalizes e-mail and accepts a strong registration password", () => {
    const result = registerSchema.parse({
      name: "  Ana Silva  ",
      email: " ANA@EXAMPLE.COM ",
      password: "StockHub2026Seguro",
    });

    assert.equal(result.name, "Ana Silva");
    assert.equal(result.email, "ana@example.com");
  });

  it("rejects short or weak registration passwords", () => {
    assert.equal(registerSchema.safeParse({ name: "Ana", email: "ana@example.com", password: "senha123" }).success, false);
    assert.equal(registerSchema.safeParse({ name: "Ana", email: "ana@example.com", password: "somenteletrasfortes" }).success, false);
  });

  it("accepts valid reset requests and rejects malformed email", () => {
    assert.equal(forgotPasswordSchema.safeParse({ email: "ana@example.com" }).success, true);
    assert.equal(forgotPasswordSchema.safeParse({ email: "email-invalido" }).success, false);
    assert.equal(resetPasswordSchema.safeParse({ token: "token", password: "StockHub2026Seguro" }).success, true);
  });
});
