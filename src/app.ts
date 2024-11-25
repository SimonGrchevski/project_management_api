import express, { Express, Request, Response, NextFunction } from "express";
import { AppDataSource } from "./data-source";
import { rateLimiterManager } from "./middlewares/rateLimiterManager";
import authRoutes from "./routes/auth";
import { MalformJsonMiddleware } from "./middlewares/malformedJsonMiddleware";

interface AppWithDataSource {
    app: Express;
    dataSource: typeof AppDataSource;
}

export const createApp = () :AppWithDataSource => {
    const app = express();
    
    app.use(express.json());
    app.use(MalformJsonMiddleware);
    app.use("/auth", rateLimiterManager.middleware);
    
    app.use("/auth", authRoutes);

    return {
        app,
        dataSource: AppDataSource,
    };
};

