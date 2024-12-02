import express, { Express } from "express";
import { Request, Response } from "express";// temporary
import { AppDataSource } from "./data-source";
import authRoutes from "./routes/auth";
import cookieParser from "cookie-parser";
import {
    malformedJson,
    rateLimiterManager,
    errorHandler,
    authenticateToken
} from "./middlewares/";

interface AppWithDataSource {
    app: Express;
    dataSource: typeof AppDataSource;
}

interface CustomRequest extends Request {
    [key: string]: any;
}

export const createApp = (): AppWithDataSource => {

    const app = express();

    app.use(express.json({ limit: "5kb" }));
    app.use(cookieParser());
    app.use(malformedJson);

    app.use("/auth", rateLimiterManager.middleware);

    app.use("/auth", authRoutes);


    // test protected for now
    app.get("/user/me", authenticateToken("currentUser"), async (req: CustomRequest, res: Response) => {
        const user = req.currentUser;
        if (!user) {
            res.status(404).json({ msg: 'User not found' });
        }
        console.log("Welcome user", user);
        res.status(200).json(user);
    })


    app.use(errorHandler);

    return {
        app,
        dataSource: AppDataSource
    }
};

