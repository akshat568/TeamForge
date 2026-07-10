/**
 * Health Check Controller
 * Returns server status and basic diagnostics
 */

import mongoose from "mongoose";

export const getHealthStatus = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus =
    dbState === 1
      ? "connected"
      : dbState === 2
      ? "connecting"
      : dbState === 3
      ? "disconnecting"
      : "disconnected";

  res.status(200).json({
    success: true,
    message: "TeamForge API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
    },
    version: "1.0.0",
  });
};
