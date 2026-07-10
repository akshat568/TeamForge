/**
 * Health Check Route
 * GET /api/health
 */

import express from "express";
import { getHealthStatus } from "../controllers/healthController.js";

const router = express.Router();

router.get("/", getHealthStatus);

export default router;
