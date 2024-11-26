import { check } from "express-validator";

const passwordValidator = {
    register: [
        check("password")
            .isLength({min:8}).withMessage("Password must be at least 8 characters long")
            .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
            .matches(/\d/).withMessage("Password must contain at least one number")
    ],
    login: [
        check("password")
            .isLength({min:8}).withMessage("Invalid credentials")
            .exists().withMessage("Password is required")
            .matches(/[A-Z]/).withMessage("Invalid credentials")
            .matches(/\d/).withMessage("Invalid credentials")
    ]
};

export default passwordValidator;