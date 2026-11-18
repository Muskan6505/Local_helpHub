import express from "express";
import {
  getMessagesByRequest,
  getUnreadCount,
  uploadChatImage,
  markMessagesAsRead
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

router.get("/unread/count", verifyJWT, getUnreadCount);
router.post("/upload", verifyJWT, upload.single("image"), uploadChatImage);
router.patch("/:requestId/read", verifyJWT, markMessagesAsRead);
router.get("/:requestId", verifyJWT, getMessagesByRequest);

export default router;
