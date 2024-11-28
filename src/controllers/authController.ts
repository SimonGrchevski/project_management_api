import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";


interface CustomRequest extends Request {
    [key: string]: any;
}

const userRepo = AppDataSource.getRepository(User);

export class AuthController {

    static async register(req: Request, res: Response): Promise<void> {

        const err = validationResult(req);

        if (!err.isEmpty()) {
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

            if (existingUser) {
                res.status(400).json({ msg: "username or email is already used" });
                return;
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

        } catch (err) {
            res.status(500).json({ msg: "Internal server error", err });
            return;
        }
    }


    static async login(req: Request, res: Response): Promise<void> {

        const err = validationResult(req);

        if (!err.isEmpty()) {
            res.status(400).json({ errors: err.array() });
            return;
        }

        const { username, password } = req.body;

        try {

            // eventually wrap it in a reusuible function
            const user = await userRepo
                .createQueryBuilder("user")
                .where("LOWER(user.username) = LOWER(:username)", { username })
                .getOne();

            if (!user) {
                res.status(404).json({ msg: "Invalid credentials!" });
                return;
            }

            const correctPassword = await bcrypt.compare(password, user.password);
            if (!correctPassword) {
                res.status(401).json({ msg: "Invalid credentials!" });
                return;
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

        } catch (err) {
            res.status(500).json(err);
        }
    }

    static edit = async (req: CustomRequest, res: Response): Promise<void> => {
        const userId = req.currentUser?.id;
        const { username, password, email } = req.body;

        const userRepo = AppDataSource.getRepository(User);
        try {

            const user = await userRepo.findOneBy({ id: userId });

            if (!user) {
                res.status(404).json({ msg: "Acount cant be found!" });
                return;
            }
            if (username) {
                const existingUser = await userRepo.findOne({ where: { username } });

                if (existingUser && existingUser.id !== userId) {
                    res.status(400).json({ msg: "Username already taken" });
                    return;
                }
                user.username = username;
            }

            if (email) {
                const existingUser = await userRepo.findOne({ where: { email } });
                if (existingUser && existingUser.id !== userId) {
                    res.status(400).json({ msg: "Email already in use" });
                    return;
                }
                user.email = email;
            }

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                user.password = hashedPassword;
            }

            await userRepo.save(user)

            res.status(200).json({
                msg: "User updated successfully",
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,

                }
            });

        } catch (err) {
            console.log("Error updating the user:", err);
            res.status(500).json({ msg: "Internal server errror" });
        }
    }
}