import { AuthService, LoginInput } from "@/services/auth.service";
import { NextFunction, Request, Response } from "express";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, user } = await this.authService.login(req.body as LoginInput);
      res.json({ token, user });
    } catch (error) {
      next(error);
    }
  };

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.requestPasswordReset(req.body);
      res.status(202).json({ message: "Se houver uma conta com esse e-mail, enviaremos um link de recuperação." });
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.resetPassword(req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.me(req.user!.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}