import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "@/types";

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      })),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({ message: "A record with this value already exists" });
      return;
    }
    if (error.code === "P2025") {
      res.status(404).json({ message: "Record not found" });
      return;
    }
  }

  res.status(500).json({ message: "Internal Server Error" });
};

export default errorHandler;