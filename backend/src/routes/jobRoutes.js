const express = require("express");

const {
    getJobs,
    createJob
} = require("../controllers/jobController");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    getJobs
);

router.post(
    "/",
    authenticateToken,
    createJob
);

module.exports = router;