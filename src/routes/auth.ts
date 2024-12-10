import express from "express";
import { AuthController } from "../controllers/authController";

import {
    validateRequest,
    inputNormalizer,
    authenticateToken,
    verifyOwnership
} from "../middlewares/";

import {
    registerValidator,
    loginValidator,
    editValidator,
} from "../validators";

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
    inputNormalizer(["username", "email"]),
    authenticateToken("currentUser"),
    editValidator,
    validateRequest,
    verifyOwnership,
    AuthController.edit
)

router.delete(
    "/delete",
    authenticateToken("currentUser"),
    verifyOwnership,
    AuthController.delete
)



export default router;
