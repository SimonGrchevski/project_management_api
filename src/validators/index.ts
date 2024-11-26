import { buildValidator } from "./buildValidator";

export const registerValidator = buildValidator(["username","password","email"],"register");
export const loginValidator = buildValidator(["username","password"],"login");