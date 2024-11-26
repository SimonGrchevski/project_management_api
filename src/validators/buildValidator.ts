import usernameValidator from "./usernameValidator";
import emailValidator from "./emailValidator";
import passwordValidator from "./passwordValidator";
import { ValidationChain } from "express-validator";

type Context = "register" | "login";
type Field = "username" | "email" | "password";

const validatorSchemas: Record<Field, Record<Context, ValidationChain[]>> = {
    username: usernameValidator,
    email: emailValidator,
    password: passwordValidator
};

export const buildValidator = (
    fields: (keyof typeof validatorSchemas)[],
    context: Context,
    
):ValidationChain[] => {
    return fields.flatMap((field) => validatorSchemas[field][context] || [] );
}