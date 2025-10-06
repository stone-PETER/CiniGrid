import express from "express";
import {
  createLocationRecord,
  getLocationRecords,
  getLocationRecord,
  updateLocationRecord,
  deleteLocationRecord,
  getPotentialLocationsForRecord,
  getFinalizedLocationsForRecord,
  compareLocationsForRecord,
} from "../controllers/locationRecordController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Location record CRUD
router.post("/", authMiddleware, createLocationRecord);
router.get("/:projectId", authMiddleware, getLocationRecords);
router.get("/single/:recordId", authMiddleware, getLocationRecord);
router.patch("/:recordId", authMiddleware, updateLocationRecord);
router.delete("/:recordId", authMiddleware, deleteLocationRecord);

// Get locations for a record
router.get(
  "/:recordId/potentials",
  authMiddleware,
  getPotentialLocationsForRecord
);
router.get(
  "/:recordId/finalized",
  authMiddleware,
  getFinalizedLocationsForRecord
);

// Compare potential locations for a record
router.post("/:recordId/compare", authMiddleware, compareLocationsForRecord);

export default router;
