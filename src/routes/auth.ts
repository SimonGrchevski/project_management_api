import express from "express";
import { AuthController } from "../controllers/authController";
import {
    validateRequest,
    inputNormalizer,
    authenticateToken
} from "../middlewares/";

import { registerValidator, loginValidator } from "../validators";

const router = express.Router();


router.post(
    "/register",
    inputNormalizer(["username", "email"]),
    registerValidator,
    validateRequest,
    AuthController.register
);

router.post(
    "/login",
    inputNormalizer(["username"]),
    loginValidator,
    validateRequest,
    AuthController.login,
);

router.put(
    "/edit",
    authenticateToken("currentUser"),
    validateRequest,
    AuthController.edit
)



export default router;
