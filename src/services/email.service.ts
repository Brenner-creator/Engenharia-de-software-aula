import nodemailer from "nodemailer";

type PasswordResetEmail = {
  to: string;
  name: string;
  resetUrl: string;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: process.env.SMTP_SECURE === "true",
  ...(process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      }
    : {}),
});

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmail): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'StockHub <no-reply@stockhub.local>',
    to,
    subject: "Redefinição de senha do StockHub",
    text: `Olá, ${name}. Use este link para redefinir sua senha (válido por 30 minutos): ${resetUrl}`,
    html: `<p>Olá, ${escapeHtml(name)}.</p><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${escapeAttribute(resetUrl)}">Criar uma nova senha</a></p><p>O link expira em 30 minutos. Se você não pediu a redefinição, ignore esta mensagem.</p>`,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
