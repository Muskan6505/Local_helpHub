import { Router } from "express";

import {
    createRequest,
    getAllRequests,
    getRequestById,
    updateRequest,
    deleteRequest,
    getFilteredRequests
} from "../controllers/helpRequest.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT, createRequest);
router.get("/", verifyJWT, getAllRequests);
router.get("/:id", verifyJWT, getRequestById);
router.put("/:id", verifyJWT, updateRequest);
router.delete("/:id", verifyJWT, deleteRequest);
router.get("/filter/query", verifyJWT, getFilteredRequests);

export default router;