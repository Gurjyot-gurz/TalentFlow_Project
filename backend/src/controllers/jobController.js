const pool = require("../config/db");


async function getJobs(req, res) {

    try {

        const [rows] = await pool.query(`
            SELECT
                j.id,
                j.title,
                j.department,
                j.location,
                j.type,
                j.status,
                COUNT(a.id) AS applicants
            FROM jobs j
            LEFT JOIN applications a
                ON j.id = a.job_id
            GROUP BY
                j.id,
                j.title,
                j.department,
                j.location,
                j.type,
                j.status
            ORDER BY j.created_at DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch jobs"
        });

    }
}


async function createJob(req, res) {

    try {

        const {
            title,
            department,
            location,
            type
        } = req.body;

        if (!title || !department) {
            return res.status(400).json({
                message: "Title and department are required"
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO jobs
            (
                title,
                department,
                location,
                type,
                created_by
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                title,
                department,
                location || null,
                type || "Full-time",
                req.user.id
            ]
        );

        const [job] = await pool.query(
            `
            SELECT *
            FROM jobs
            WHERE id = ?
            `,
            [result.insertId]
        );

        res.status(201).json(job[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to create job"
        });

    }
}


module.exports = {
    getJobs,
    createJob
};