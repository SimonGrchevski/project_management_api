import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import bcrypt from "bcrypt";

const userRepo = AppDataSource.getRepository(User);

export class UserController {

    static async registerUser(req: Request, res: Response ): Promise<void> {
        const { username, password, email, role } = req.body;

        try{
            const existingUser = await userRepo.findOneBy({username,email});
            if( existingUser ) {
                res.status(400).json({msg:"username or email is already used"});
                return;
            }

            const hashedPassword = await bcrypt.hash(password,10);
            const newUser = userRepo.create({username,password:hashedPassword,email,role});
            const savedUser = await userRepo.save(newUser);
            res.status(201).json({id:savedUser.id, username:savedUser.username});

        } catch( err ) {
            res.status(500).json({msg:"Internal server error", err});
            return;
        }
    }
}