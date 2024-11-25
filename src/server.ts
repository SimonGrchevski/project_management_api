import "reflect-metadata";
import dotenv from "dotenv";
import { createApp } from "./app";


dotenv.config();

const { app, dataSource } = createApp();


dataSource.initialize()
    .then(() => {

        console.log("Database connected successfully!");
        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    })
    .catch((err) => {
        console.error("Database connection failed:",err);
        process.exit(1);
    });
