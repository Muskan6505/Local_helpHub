import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
// import {initSocket} from "./utils/Socket.js"


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true
}))

// const server = http.createServer(app);
// initSocket(server);

// server.listen(5000, () => {
//     console.log("Server running on port 5000");
// });

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.use(cookieParser())

import userRouter from "./routes/user.routes.js"
import responseRouter from "./routes/response.routes.js"
import helpRequestRouter from "./routes/helpRequest.routes.js"

app.use("/api/v1/users", userRouter)
app.use("/api/v1/responses", responseRouter)
app.use("/api/v1/help-requests", helpRequestRouter)


app.use((req, res, next) => {
    res.status(404).json({ error: "Not Found" });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
});

export {app};