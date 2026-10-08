const express = require("express");

const {
    getApplications,
    createApplication,
    updateApplicationStatus
} = require("../controllers/applicationController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    getApplications
);

router.post(
    "/",
    authenticateToken,
    createApplication
);

router.patch(
    "/:id/status",
    authenticateToken,
    updateApplicationStatus
);

module.exports = router;