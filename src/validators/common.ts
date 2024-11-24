import { check } from "express-validator";

export const usernameValidator = () => 
    check("username").notEmpty().withMessage("Username is required");

export const emailValidator = () =>
    check("email").isEmail().withMessage("Invalid email format")

export const passwordValidator = () => [
    check("password")
            .isLength({min:8})
            .withMessage("Password must be at least 8 characters long")
            .matches(/[A-Z]/)
            .withMessage("Password must contain at least one uppercase letter")
            .matches(/\d/)
            .withMessage("Password must contain at least one number")
];