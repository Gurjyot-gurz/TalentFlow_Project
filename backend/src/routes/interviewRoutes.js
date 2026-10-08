const express = require("express");

const {
    getInterviews,
    createInterview,
    updateInterviewStatus
} = require("../controllers/interviewController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    getInterviews
);

router.post(
    "/",
    authenticateToken,
    createInterview
);

router.patch(
    "/:id/status",
    authenticateToken,
    updateInterviewStatus
);

module.exports = router;