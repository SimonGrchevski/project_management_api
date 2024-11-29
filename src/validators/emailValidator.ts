import { check } from "express-validator";

const emailValidator = {
    register: [
        check("email")
            .isEmail().withMessage("Invalid email format")
    ],
    login:[],
    edit: [
        check("email")
            .optional()
            .isEmail().withMessage("Invalid email format")
    ]
};

export default emailValidator;