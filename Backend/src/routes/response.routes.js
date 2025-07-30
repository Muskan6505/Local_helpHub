import { Router } from "express";
import {
    createResponse,
    getMyResponses, 
    getResponseByRequest,
    updateResponseStatus
} from "../controllers/response.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/new").post(verifyJWT, createResponse)
router.route("/").get(verifyJWT, getMyResponses)
router.route("/:helpRequest").get(verifyJWT, getResponseByRequest)
router.route("/:responseId").patch(verifyJWT, updateResponseStatus)

export default router;