import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { CustomRequest } from "../types/customRequest";
import { ErrorFactory } from "../utility/errorFactory";
const userRepo = AppDataSource.getRepository(User);

export class AuthController {
    
    static async register(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {

        const err = validationResult(req);

        if (!err.isEmpty()) {
            return next(ErrorFactory.badRequest(err.array()));
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

            if (existingUser) {
                return next(ErrorFactory.badRequest(
                    err.array(),
                    "username or email is already used"
                ));
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = userRepo.create({
                username,
                password: hashedPassword,
                email,
                role
            });
            const savedUser = await userRepo.save(newUser);
            res.status(201).json({ id: savedUser.id, username: savedUser.username });

        } catch (error) {
            console.log("In the catch");
            return next(ErrorFactory.internal(err.array()))
        }
    }


    static async login(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {

        const err = validationResult(req);

        if (!err.isEmpty()) {
            const errCount = err.array().length
            return next(
                ErrorFactory.badRequest(
                    err.array(),
                    `Validation failed with ${errCount}error${errCount} > 1? "s":".".Check details for more info, }`
                )
            )
        }

        const { username, password } = req.body;

        try {

            // eventually wrap it in a reusable function
            const user = await userRepo
                .createQueryBuilder("user")
                .where("LOWER(user.username) = LOWER(:username)", { username })
                .getOne();

            if (!user) {
                return next(ErrorFactory.notFound(err.array(), "Invalid credentials!"));
            }

            const correctPassword = await bcrypt.compare(password, user.password);
            if (!correctPassword) {
                return next(ErrorFactory.unauthorized(err.array(), "Invalid credentials"));
            }

            const token = jwt.sign(
                {
                    id: user?.id,
                    username: user?.username,
                    aud: process.env.AUD,
                    iss: process.env.ISS,
                },
                process.env.SECRET_KEY!,
                { expiresIn: "1h", algorithm: 'HS512' }
            );

            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 3600000,
                sameSite: "strict",
            });

            res.status(200).json({ msg: "Login successful" });

        } catch (error) {
            next(ErrorFactory.internal(err.array()))
        }
    }


    static edit = async (
        req: CustomRequest,
        res: Response,
        next: NextFunction): Promise<void> => {

        const userId = req.currentUser?.id;
        const { username, password, email } = req.body || {};
        
        if (!username && !email && !password)
            return next(ErrorFactory.badRequest([], "The fields are empty"));
        
        const userRepo = AppDataSource.getRepository(User);

        try {
            
            const user = await userRepo.findOneBy({ id: userId });

            if (!user)
                return next(ErrorFactory.notFound([], "Account cant be found"));

            if (username) {
                
                const existingUser = await userRepo.findOne({ where: { username } });

                if (existingUser && existingUser.id !== userId)
                    return next(ErrorFactory.badRequest([], "Username already taken"));

                user.username = username;
            }

            if (email) {
                const existingUser = await userRepo.findOne({ where: { email } });
                if (existingUser && existingUser.id !== userId)
                    return next(ErrorFactory.badRequest([], "Email already in use"));

                user.email = email;
            }

            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }

            const savedUser = await userRepo.save(user)

            res.status(200).json({
                msg: "User updated successfully",
                user: {
                    username: savedUser.username,
                    email: savedUser.email,

                }
            });

        } catch (err) {
            return next(ErrorFactory.internal([], "Internal server error"));
        }
    }

    static delete = async (
        req: CustomRequest,
        res: Response,
        next: NextFunction): Promise<void> => {
        
        const {id} = req.body;
        
        try {

            const result = await AppDataSource.getRepository(User).delete({id: +id});
            if(result.affected === 0)
                return next(ErrorFactory.notFound([],"User cant be found"));

            res.status(200).json({
                msg: "User deleted successfully"
            })

        }catch(err) {
            return next(ErrorFactory.internal(err, "Internal server error"));
        }
    }
}