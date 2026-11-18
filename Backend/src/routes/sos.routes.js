import { Router } from "express";
import {
  triggerSOS,
  getMySOS,
  getNearbyActiveSOS,
  respondToSOS,
  resolveSOS,
  cancelSOS,
} from "../controllers/sos.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All SOS routes require authentication
router.use(verifyJWT);

// POST   /api/v1/sos             → trigger a new SOS
router.post("/", triggerSOS);

// GET    /api/v1/sos/mine        → current user's SOS history (must be before /:id)
router.get("/mine", getMySOS);

// GET    /api/v1/sos             → nearby active SOS (responders view)
router.get("/", getNearbyActiveSOS);

// PATCH  /api/v1/sos/:id/respond → volunteer accepts an SOS
router.patch("/:id/respond", respondToSOS);

// PATCH  /api/v1/sos/:id/resolve → mark SOS as resolved
router.patch("/:id/resolve", resolveSOS);

// PATCH  /api/v1/sos/:id/cancel  → requester cancels with reason
router.patch("/:id/cancel", cancelSOS);

export default router;
