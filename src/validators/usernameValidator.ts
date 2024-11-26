import { check } from "express-validator";

const usernameValidator = {
    register: [
        check("username")
            .notEmpty().withMessage("Username is required")
            .isAlphanumeric().withMessage("Username must contain only letters and numbers")
            .isLength({ max: 255 }).withMessage("No excessively long inputs allowed")
    ],
    login: [
        check("username")
            .exists().withMessage("Username is required")
            .notEmpty().withMessage("Username is required")
            .isAlphanumeric().withMessage("Invalid credentials")
            .isLength({ max: 255 }).withMessage("Invalid credentials")
    ]
};

export default usernameValidator;