import { check } from "express-validator";

const emailValidator = {
    register: [
        check("email")
            .isEmail().withMessage("Invalid email format")
    ],
    login:[]
};

export default emailValidator;