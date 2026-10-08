const pool = require("../config/db");

const {
    uploadResume,
    generateDownloadUrl
} = require("../services/s3Service");


// ============================================================
// UPLOAD CANDIDATE RESUME
// ============================================================

async function uploadCandidateResume(req, res) {

    try {

        const candidateId = req.params.id;

        if (!req.file) {
            return res.status(400).json({
                message: "Resume file is required"
            });
        }

        // Check if candidate exists
        const [rows] = await pool.query(
            "SELECT id FROM candidates WHERE id = ?",
            [candidateId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Candidate not found"
            });
        }

        // Upload resume to S3
        const s3Key = await uploadResume(
            req.file,
            candidateId
        );

        // Store S3 object key in RDS
        await pool.query(
            "UPDATE candidates SET resume_s3_key = ? WHERE id = ?",
            [s3Key, candidateId]
        );

        res.status(200).json({
            message: "Resume uploaded successfully",
            candidateId: candidateId,
            s3Key: s3Key
        });

    } catch (error) {

        console.error("Resume upload error:", error);

        res.status(500).json({
            message: "Resume upload failed",
            error: error.message
        });
    }
}


// ============================================================
// GET CANDIDATE RESUME
// ============================================================

async function getCandidateResume(req, res) {

    try {

        const candidateId = req.params.id;

        // Get S3 key from RDS
        const [rows] = await pool.query(
            "SELECT resume_s3_key FROM candidates WHERE id = ?",
            [candidateId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Candidate not found"
            });
        }

        const s3Key = rows[0].resume_s3_key;

        if (!s3Key) {
            return res.status(404).json({
                message: "No resume uploaded for this candidate"
            });
        }

        // Generate temporary signed URL
        const url = await generateDownloadUrl(s3Key);

        res.status(200).json({
            candidateId: candidateId,
            url: url,
            expiresIn: 300
        });

    } catch (error) {

        console.error("Resume retrieval error:", error);

        res.status(500).json({
            message: "Could not generate resume URL",
            error: error.message
        });
    }
}


// ============================================================
// GET ALL CANDIDATES
// ============================================================

async function getCandidates(req, res) {

    try {

        const [rows] = await pool.query(`
            SELECT
                id,
                name,
                email,
                role,
                experience,
                score,
                stage,
                applied_date AS applied,
                source,
                resume_s3_key
            FROM candidates
            ORDER BY created_at DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch candidates"
        });
    }
}


// ============================================================
// GET SINGLE CANDIDATE
// ============================================================

async function getCandidate(req, res) {

    try {

        const [rows] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                role,
                experience,
                score,
                stage,
                applied_date AS applied,
                source,
                resume_s3_key
            FROM candidates
            WHERE id = ?
            `,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Candidate not found"
            });
        }

        res.json(rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch candidate"
        });
    }
}


// ============================================================
// CREATE CANDIDATE
// ============================================================

async function createCandidate(req, res) {

    try {

        const {
            name,
            email,
            role,
            experience,
            score,
            stage,
            applied,
            source
        } = req.body;

        if (!name || !email || !role) {
            return res.status(400).json({
                message: "Name, email and role are required"
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO candidates
            (
                name,
                email,
                role,
                experience,
                score,
                stage,
                applied_date,
                source,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                name,
                email,
                role,
                experience || null,
                score || 0,
                stage || "Applied",
                applied || new Date(),
                source || "Website",
                req.user.id
            ]
        );

        const [candidate] = await pool.query(
            `
            SELECT *
            FROM candidates
            WHERE id = ?
            `,
            [result.insertId]
        );

        res.status(201).json(candidate[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to create candidate"
        });
    }
}


// ============================================================
// UPDATE CANDIDATE STAGE
// ============================================================

async function updateCandidateStage(req, res) {

    try {

        const {
            stage
        } = req.body;

        const allowedStages = [
            "Applied",
            "Screening",
            "Shortlisted",
            "Interview",
            "Offer",
            "Hired",
            "Rejected"
        ];

        if (!allowedStages.includes(stage)) {
            return res.status(400).json({
                message: "Invalid candidate stage"
            });
        }

        const [result] = await pool.query(
            `
            UPDATE candidates
            SET stage = ?
            WHERE id = ?
            `,
            [
                stage,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Candidate not found"
            });
        }

        res.json({
            message: "Candidate stage updated"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update candidate"
        });
    }
}


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    getCandidates,
    getCandidate,
    createCandidate,
    updateCandidateStage,
    uploadCandidateResume,
    getCandidateResume
};