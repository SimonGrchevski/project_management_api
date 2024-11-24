import express from "express";
import { UserController } from "../controllers/userController";
import { validateRequest } from "../middlewares/validate";
import { check } from "express-validator";

const router = express.Router();

router.post(
    "/register",
    [
        check("username")
            .notEmpty()
            .withMessage("Username is required"),
        check("email")
            .isEmail()
            .withMessage("Invalid email format"),
        check("password")
            .isLength({min:8})
            .withMessage("Password must be at least 8 characters long")
            .matches(/[A-Z]/)
            .withMessage("Password must contain at least one uppercase letter")
            .matches(/\d/)
            .withMessage("Password must contain at least one number")
    ],
    validateRequest,
    UserController.registerUser
);

export default router;
