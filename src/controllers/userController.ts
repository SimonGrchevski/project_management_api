import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";

const userRepo = AppDataSource.getRepository(User);

export class UserController {

    static async registerUser(req: Request, res: Response ) {
        try{
            
            res.status(201).json({msg:"All is good"});
        } catch( err ) {

        }
    }
}