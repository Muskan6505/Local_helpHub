import express from "express";
import { getMessagesByRequest, getUnreadCount } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:requestId", verifyJWT, getMessagesByRequest);
router.get("/unread/count", verifyJWT, getUnreadCount);


export default router;