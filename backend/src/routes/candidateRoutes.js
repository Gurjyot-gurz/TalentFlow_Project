const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const {
    getCandidates,
    getCandidate,
    createCandidate,
    updateCandidateStage,
    uploadCandidateResume,
    getCandidateResume
} = require("../controllers/candidateController");


// Get all candidates
router.get(
    "/",
    authenticateToken,
    getCandidates
);


// Get single candidate
router.get(
    "/:id",
    authenticateToken,
    getCandidate
);


// Create candidate
router.post(
    "/",
    authenticateToken,
    createCandidate
);


// Update candidate stage
router.patch(
    "/:id/stage",
    authenticateToken,
    updateCandidateStage
);


// Upload candidate resume
router.post(
    "/:id/resume",
    authenticateToken,
    upload.single("resume"),
    uploadCandidateResume
);


// Get candidate resume
router.get(
    "/:id/resume",
    authenticateToken,
    getCandidateResume
);


module.exports = router;