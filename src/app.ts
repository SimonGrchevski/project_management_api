// import express from "express";
// import authRoute from "./routes/auth"
// import { handleMalformJsonMiddleware } from "./middlewares/malformedJsonMiddleware";
// import { rateLimiterMiddleware } from "./middlewares/rateLimiterMiddleware";
// import { Request, Response, NextFunction } from "express";

// const app = express();

// app.use(express.json());
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//     handleMalformJsonMiddleware(err, req, res, next);
// });
// app.use(rateLimiterMiddleware);

// app.use("/auth", authRoute);




// export default app;

import express, { Express, Request, Response, NextFunction } from "express";
import { AppDataSource } from "./data-source";
import { rateLimiterMiddleware } from "./middlewares/rateLimiterMiddleware";
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
    app.use("/auth", rateLimiterMiddleware);

    app.use("/auth", authRoutes);


    
    

    return {
        app,
        dataSource: AppDataSource,
    };
};

