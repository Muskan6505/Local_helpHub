import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ApiError } from "./utils/ApiError.js";
import messageRoutes from "./routes/message.routes.js";


const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173");

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
        return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(cookieParser())

import userRouter from "./routes/user.routes.js"
import responseRouter from "./routes/response.routes.js"
import helpRequestRouter from "./routes/helpRequest.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/responses", responseRouter)
app.use("/api/v1/help-requests", helpRequestRouter)
app.use("/api/v1/messages", messageRoutes);


app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            message: err.message,
            statusCode: err.statusCode
        });
    }
    
    // For other errors
    res.status(500).json({
        message: 'Internal Server Error',
        statusCode: 500
    });
});

export {app};