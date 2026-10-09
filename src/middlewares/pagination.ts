import { RequestHandler } from "express";
import { z } from "zod";

export type PaginationParams = {
  page: number;
  limit: number;
  q?: string;
};

declare global {
  namespace Express {
    interface Request {
      pagination?: PaginationParams;
    }
  }
}

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  q: z.string().trim().min(1).max(100).optional(),
});

export const paginationMiddleware: RequestHandler = (req, _res, next) => {
  const result = paginationSchema.safeParse({
    page: req.query.page,
    limit: req.query.limit,
    q: req.query.q,
  });

  if (!result.success) {
    next(result.error);
    return;
  }

  const { page, limit, q } = result.data;
  req.pagination = {
    page,
    limit,
    ...(q !== undefined && { q }),
  };
  next();
};