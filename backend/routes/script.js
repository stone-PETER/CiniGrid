import express from "express";
import multer from "multer";
import {
  uploadScript,
  getScriptAnalysis,
  deleteScript,
} from "../controllers/scriptController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

// All routes require authentication
router.use(authenticate);

// Upload screenplay and analyze
router.post("/:projectId/script/upload", upload.single("script"), uploadScript);

// Get script analysis
router.get("/:projectId/script", getScriptAnalysis);

// Delete script
router.delete("/:projectId/script", deleteScript);

export default router;
