import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { ClienteService } from "@/services/cliente.service";

export class ClienteController {
  private clienteService: ClienteService;

  constructor() {
    this.clienteService = new ClienteService();
  }

  private handleError(error: unknown, res: Response): void {
    if (error instanceof ZodError) {
      res.status(400).json({ message: "Dados inválidos", errors: error.issues });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        res.status(404).json({ message: "Cliente não encontrado" });
        return;
      }
      if (error.code === "P2002") {
        res.status(409).json({ message: "Já existe um cliente com esses dados" });
        return;
      }
      if (error.code === "P2003") {
        res.status(400).json({ message: "Referência informada é inválida" });
        return;
      }
    }

    res.status(500).json({ message: "Erro interno ao processar cliente" });
  }

  public getAllClientes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, q } = req.pagination ?? { page: 1, limit: 10 };
      const clientes = await this.clienteService.getAllClientes({
        skip: (page - 1) * limit,
        limit,
        ...(q !== undefined && { q }),
      });
      res.status(200).json(clientes);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getClienteById = async (req: Request, res: Response): Promise<void> => {
    try {
      const cliente = await this.clienteService.getClienteById(req.params.id as string);
      if (!cliente) {
        res.status(404).json({ message: "Cliente não encontrado" });
        return;
      }
      res.status(200).json(cliente);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public createCliente = async (req: Request, res: Response): Promise<void> => {
    try {
      const cliente = await this.clienteService.createCliente(req.body);
      res.status(201).json(cliente);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public updateCliente = async (req: Request, res: Response): Promise<void> => {
    try {
      const cliente = await this.clienteService.updateCliente(
        req.params.id as string,
        req.body,
      );
      res.status(200).json(cliente);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public deleteCliente = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.clienteService.deleteCliente(req.params.id as string);
      res.status(200).json({ message: "Cliente excluído com sucesso" });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}