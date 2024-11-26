import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

const userRepo = AppDataSource.getRepository(User);

export class UserController {

    static async registerUser(req: Request, res: Response ): Promise<void> {

        const err = validationResult(req);

        if(!err.isEmpty()) {
            res.status(400).json({ errors: err.array() });
            return;
        }

        const { username, password, email, role } = req.body;

        try {

            const existingUser = await userRepo
                .createQueryBuilder("user")
                .where("LOWER(user.username) = :username OR LOWER(user.email) = :email", {
                    username,
                    email
                })
                .getOne();

            if( existingUser ) {
                res.status(400).json({msg:"username or email is already used"});
                return;
            }

            const hashedPassword = await bcrypt.hash(password,10);
            const newUser = userRepo.create({
                username,
                password:hashedPassword,
                email,
                role
            });
            const savedUser = await userRepo.save(newUser);
            res.status(201).json({id:savedUser.id, username:savedUser.username});

        } catch( err ) {
            res.status(500).json({msg:"Internal server error", err});
            return;
        }
    }

    static async login(req: Request, res: Response ): Promise<void> {
        
        const { username, password } = req.body;
        try {

            const user = await AppDataSource.getRepository(User).findOneBy({username} );
            if(!user) {
                res.status(404).json({msg:"Invalid credentials!"});
                return;
            }
            
            const correctPassword = await bcrypt.compare(password,user.password);
            if(!correctPassword) {
                res.status(401).json({msg:"Invalid credentials!"});
                return;
            }

            const token = jwt.sign({id:user.id, username:user.username},process.env.SECRET_KEY!,{
                expiresIn:"1h",
                algorithm:"HS512"
            })

            res.cookie("authToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 60 * 60 * 1000,
            });

        }catch(err) {
            res.status(500).json(err);
        }
    }

}