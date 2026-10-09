import { AuthController } from "@/controllers/auth.controller";
import { rateLimit } from "express-rate-limit";
import { Router } from "express";
import { authenticate } from "@/middlewares/auth";

const router = Router();
const authController = new AuthController();
const loginRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: { message: "Too many login attempts. Please try again later." },
});
const registrationRateLimit = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 5,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: { message: "Muitas tentativas de cadastro. Tente novamente mais tarde." },
});
const passwordResetRateLimit = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 5,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: { message: "Muitas solicitações. Tente novamente mais tarde." },
});

router.post("/login", loginRateLimit, authController.login);
router.post("/register", registrationRateLimit, authController.register);
router.post("/forgot-password", passwordResetRateLimit, authController.forgotPassword);
router.post("/reset-password", passwordResetRateLimit, authController.resetPassword);
router.get("/me", authenticate, authController.me);

export default router;