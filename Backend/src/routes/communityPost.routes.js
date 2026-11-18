import { Router } from "express";
import {
  createPost,
  getNearbyPosts,
  getPostById,
  toggleUpvote,
  toggleVolunteer,
  addComment,
  updateStatus,
  deletePost
} from "../controllers/communityPost.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/", verifyJWT, upload.array("images", 5), createPost);
router.get("/", verifyJWT, getNearbyPosts);
router.get("/:id", verifyJWT, getPostById);
router.patch("/:id/upvote", verifyJWT, toggleUpvote);
router.patch("/:id/volunteer", verifyJWT, toggleVolunteer);
router.post("/:id/comments", verifyJWT, addComment);
router.patch("/:id/status", verifyJWT, upload.single("proofImage"), updateStatus);
router.delete("/:id", verifyJWT, deletePost);

export default router;
