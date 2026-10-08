const pool = require("../config/db");


async function getApplications(req, res) {

    try {

        const [rows] = await pool.query(`
            SELECT
                a.id,
                a.status,
                a.applied_at,

                c.id AS candidate_id,
                c.name AS candidate_name,
                c.email AS candidate_email,

                j.id AS job_id,
                j.title AS job_title

            FROM applications a

            JOIN candidates c
                ON a.candidate_id = c.id

            JOIN jobs j
                ON a.job_id = j.id

            ORDER BY a.applied_at DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch applications"
        });

    }
}


async function createApplication(req, res) {

    try {

        const {
            candidateId,
            jobId
        } = req.body;

        if (!candidateId || !jobId) {
            return res.status(400).json({
                message: "Candidate and job are required"
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO applications
            (
                candidate_id,
                job_id
            )
            VALUES (?, ?)
            `,
            [
                candidateId,
                jobId
            ]
        );

        res.status(201).json({
            message: "Application created",
            id: result.insertId
        });

    } catch (error) {

        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                message: "Candidate already applied to this job"
            });

        }

        res.status(500).json({
            message: "Failed to create application"
        });

    }
}


async function updateApplicationStatus(req, res) {

    try {

        const {
            status
        } = req.body;

        await pool.query(
            `
            UPDATE applications
            SET status = ?
            WHERE id = ?
            `,
            [
                status,
                req.params.id
            ]
        );

        res.json({
            message: "Application status updated"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update application"
        });

    }
}


module.exports = {
    getApplications,
    createApplication,
    updateApplicationStatus
};