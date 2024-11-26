import express from "express";
import { AuthController } from "../controllers/authController";
import { validateRequest } from "../middlewares/validate";
import { inputNormalizer } from "../middlewares/inputNormalizer";
import { registerValidator, loginValidator } from "../validators";

const router = express.Router();

router.post(
    "/register",
    inputNormalizer,
    registerValidator,
    validateRequest,
    AuthController.register
);

router.post(
    "/login",
    loginValidator,
    validateRequest,
    AuthController.login
);

export default router;
