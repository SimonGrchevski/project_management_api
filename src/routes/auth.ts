import express from "express";
import { UserController } from "../controllers/userController";
import { validateRequest } from "../middlewares/validate";
import { inputNormalizer } from "../middlewares/inputNormalizer";
import { registerValidator, loginValidator } from "../validators";

const router = express.Router();

router.post(
    "/register",
    inputNormalizer,
    registerValidator,
    validateRequest,
    UserController.registerUser
);

router.post(
    "/login",
    loginValidator,
    validateRequest,
    UserController.login
);

export default router;
