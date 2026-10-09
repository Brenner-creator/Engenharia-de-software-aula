import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { AppError } from "@/types";
import { comparePasswords, hashPassword } from "@/utils/password";
import { toAuthUser, toPublicUser } from "@/utils/user.mapper";
import { signToken } from "@/utils/jwt";
import { sendPasswordResetEmail } from "@/services/email.service";

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").transform((value) => value.toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(12, "A senha deve ter pelo menos 12 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres")
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "A senha excede o limite seguro")
    .refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value), {
      message: "Use letras maiúsculas, minúsculas e números",
    }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("E-mail inválido").transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token de redefinição obrigatório"),
  password: z
    .string()
    .min(12, "A senha deve ter pelo menos 12 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres")
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "A senha excede o limite seguro")
    .refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value), {
      message: "Use letras maiúsculas, minúsculas e números",
    }),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, "Old password must be at least 6 characters long"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export class AuthService {
  public async login(input: unknown): Promise<{ token: string; user: ReturnType<typeof toAuthUser> }> {
    const data = loginSchema.parse(input);
    const user = await prisma.user.findUnique({
        include: { roles: true },
        where: { email: data.email },
    });

    if (!user) {
      throw new AppError("E-mail ou senha inválidos", 401);
    }

    const isPasswordValid = await comparePasswords(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError("E-mail ou senha inválidos", 401);
    }

    const authUser = toAuthUser(user);
    const token = signToken(authUser);

    return { token, user: authUser };
  }

  public async register(input: unknown): Promise<{ token: string; user: ReturnType<typeof toAuthUser> }> {
    const data = registerSchema.parse(input);
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError("Este e-mail já está cadastrado", 409);
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: await hashPassword(data.password),
        roles: {
          connectOrCreate: {
            where: { name: "USER" },
            create: { name: "USER" },
          },
        },
      },
      include: { roles: true },
    });
    const authUser = toAuthUser(user);
    return { token: signToken(authUser), user: authUser };
  }

  public async requestPasswordReset(input: unknown): Promise<void> {
    const { email } = forgotPasswordSchema.parse(input);
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true } });
    if (!user) return;

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
    ]);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = new URL("/reset-password", frontendUrl);
    resetUrl.searchParams.set("token", rawToken);
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl: resetUrl.toString() });
  }

  public async resetPassword(input: unknown): Promise<void> {
    const data = resetPasswordSchema.parse(input);
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const newPasswordHash = await hashPassword(data.password);
    const now = new Date();

    await prisma.$transaction(async (transaction) => {
      const resetToken = await transaction.passwordResetToken.findUnique({ where: { tokenHash } });
      if (!resetToken || resetToken.expiresAt <= now) {
        throw new AppError("Link inválido ou expirado. Solicite uma nova recuperação.", 400);
      }

      const consumed = await transaction.passwordResetToken.deleteMany({
        where: { id: resetToken.id, expiresAt: { gt: now } },
      });
      if (consumed.count !== 1) {
        throw new AppError("Link inválido ou expirado. Solicite uma nova recuperação.", 400);
      }

      await transaction.user.update({
        where: { id: resetToken.userId },
        data: { password: newPasswordHash },
      });
      await transaction.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });
    });
  }

  public async me(userId: string): Promise<ReturnType<typeof toPublicUser> | null> {
    const user = await prisma.user.findUnique({
      include: { roles: true },
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    return toPublicUser(user);
  }
}