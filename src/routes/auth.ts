import express from "express";
import { UserController } from "../controllers/userController";
import { validateRequest } from "../middlewares/validate";
import { 
    usernameValidator,
    emailValidator,
    passwordValidator
} from "../validators/common";

const router = express.Router();

router.post(
    "/register",
    [
        usernameValidator(),
        emailValidator(),
        ...passwordValidator()
    ],
    validateRequest,
    UserController.registerUser
);

export default router;
