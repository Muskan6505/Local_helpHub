import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import http from "http";
import { initSocket } from "./utils/Socket.js";

const server = http.createServer(app);
initSocket(server);

server.listen(process.env.CHATPORT || 5000, () => {
    console.log("Server running");
});


dotenv.config({
    path: './.env'
})

connectDB()
.then(()=> {
    app.on("error", (error) => {
        console.log("ERROR: ", error);
        throw error
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port: ${process.env.PORT || 8000}`)
    })
})
.catch((err) =>{
    console.log("MongoDB connection failed !!", err);
})