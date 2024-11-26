import express, { Express } from "express";
import { AppDataSource } from "./data-source";
import { MalformJsonMiddleware } from "./middlewares/malformedJsonMiddleware";
import { rateLimiterManager } from "./middlewares/rateLimiterManager";
import authRoutes from "./routes/auth";

interface AppWithDataSource {
    app: Express;
    dataSource: typeof AppDataSource;
}

export const createApp = () :AppWithDataSource => {
    const app = express();
    
    app.use(express.json());
    // middlewares
    app.use(MalformJsonMiddleware);
    app.use("/auth", rateLimiterManager.middleware);
    
    // public
    app.use("/auth", authRoutes);

    return {
        app,
        dataSource: AppDataSource,
    };
};

