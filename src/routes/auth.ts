import express from "express";
import { UserController } from "../controllers/userController";
import { validateRequest } from "../middlewares/validate";
import { 
    usernameValidator,
    emailValidator,
    passwordValidator
} from "../validators/common";
import { inputNormalizer } from "../middlewares/inputNormalizer";

const router = express.Router();

router.post(
    "/register",
    inputNormalizer,
    [
        ...usernameValidator(),
        ...emailValidator(),
        ...passwordValidator()
    ],
    validateRequest,
    UserController.registerUser
);

export default router;
