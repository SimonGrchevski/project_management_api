import { check } from "express-validator";

const usernameValidator = {
    register: [
        check("username")
            .notEmpty().withMessage("Username is required")
            .matches(/^[a-zA-Z0-9]+$/).withMessage("Username must contain only letters and numbers")
            .isLength({ max: 255 }).withMessage("No excessively long inputs allowed")
    ],
    login: [
        check("username")
            .notEmpty().withMessage("Invalid credentials")
            .matches(/^[a-zA-Z0-9]+$/).withMessage("Invalid credentials")
            .isLength({ max: 255 }).withMessage("Invalid credentials")
    ]
};

export default usernameValidator;