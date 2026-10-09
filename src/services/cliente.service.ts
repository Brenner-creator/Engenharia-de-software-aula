import prisma from "@/lib/prisma";
import { Cliente, Prisma } from "@prisma/client";
import { z } from "zod";

const nomeSchema = z.string()
    .min(5, 'O nome deve ter pelo menos 5 caracteres')
    .max(100);

export const clienteSchema = z.discriminatedUnion('tipoCliente', [
    z.object({
        tipoCliente: z.literal('F'),
        nome: nomeSchema,
        fisica: z.object({
            cpf: z.string()
                .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido'),
            rg: z.string()
                .max(20, 'O RG deve ter no máximo 20 caracteres')
                .optional(),
        }),
    }),
    z.object({
        tipoCliente: z.literal('J'),
        nome: nomeSchema,
        juridica: z.object({
            cnpj: z.string()
                .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido'),
            inscricaoEstadual: z.string()
                .max(20, 'A inscrição estadual deve ter no máximo 20 caracteres')
                .optional(),
        }),
    }),
]);

export type ClienteInput = z.infer<typeof clienteSchema>;

export class ClienteService {
    async getAllClientes(params: {
        skip?: number;
        limit?: number;
        q?: string;
    }): Promise<Cliente[]> {
        const { skip = 0, limit = 10, q } = params;
        const clientes = await prisma.cliente.findMany({
            skip,
            take: limit,
            where: q ? { id: { contains: q, mode: Prisma.QueryMode.insensitive } } : {},
            orderBy: { createdAt: 'desc' },
        });
        return clientes;
    }

    async getClienteById(id: string): Promise<Cliente | null> {
        const cliente = await prisma.cliente.findUnique({
            where: { id },
        });
        return cliente;
    }

    async createCliente(input: unknown): Promise<Cliente> {
        const data = clienteSchema.parse(input);

        return prisma.$transaction(async (transaction) => {
            const pessoa = await transaction.pessoa.create({
                data: { tipoPessoa: data.tipoCliente },
            });

            if (data.tipoCliente === 'F') {
                await transaction.pessoaFisica.create({
                    data: {
                        pessoaId: pessoa.id,
                        cpf: data.fisica.cpf,
                        nome: data.nome,
                    },
                });
            } else {
                await transaction.pessoaJuridica.create({
                    data: {
                        pessoaId: pessoa.id,
                        cnpj: data.juridica.cnpj,
                        razaoSocial: data.nome,
                    },
                });
            }

            return transaction.cliente.create({
                data: { pessoaId: pessoa.id },
            });
        });
    }

    async updateCliente(id: string, data: Prisma.ClienteUpdateInput): Promise<Cliente | null> {
        const updatedCliente = await prisma.cliente.update({
            where: { id },
            data,
        });
        return updatedCliente;
    }

    async deleteCliente(id: string): Promise<Cliente | null> {
        const deletedCliente = await prisma.cliente.delete({
            where: { id },
        });
        return deletedCliente;
    }
}