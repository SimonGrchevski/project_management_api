import { buildValidator } from "./buildValidator";

export const registerValidator = buildValidator(["username","password","email"],"register");
export const loginValidator = buildValidator(["username","password"],"login");
export const editValidator = buildValidator(["username","password","email"],"edit")
