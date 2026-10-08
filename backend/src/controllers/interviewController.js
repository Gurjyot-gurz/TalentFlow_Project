const pool = require("../config/db");


async function getInterviews(req, res) {

    try {

        const [rows] = await pool.query(`
            SELECT
                i.id,

                i.candidate_id,
                c.name AS candidate_name,
                c.role AS candidate_role,

                i.application_id,

                i.interviewer_id,
                CONCAT(
                    u.first_name,
                    ' ',
                    u.last_name
                ) AS interviewer_name,

                i.interview_date,
                i.interview_time,
                i.status,
                i.meeting_link

            FROM interviews i

            JOIN candidates c
                ON i.candidate_id = c.id

            LEFT JOIN users u
                ON i.interviewer_id = u.id

            ORDER BY
                i.interview_date ASC,
                i.interview_time ASC
        `);

        res.json(rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to fetch interviews"
        });

    }
}


async function createInterview(req, res) {

    try {

        const {
            candidateId,
            applicationId,
            interviewerId,
            interviewDate,
            interviewTime,
            meetingLink
        } = req.body;

        if (
            !candidateId ||
            !interviewDate ||
            !interviewTime
        ) {

            return res.status(400).json({
                message:
                    "Candidate, date and time are required"
            });

        }

        const [result] = await pool.query(
            `
            INSERT INTO interviews
            (
                candidate_id,
                application_id,
                interviewer_id,
                interview_date,
                interview_time,
                meeting_link
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                candidateId,
                applicationId || null,
                interviewerId || null,
                interviewDate,
                interviewTime,
                meetingLink || null
            ]
        );

        res.status(201).json({
            message: "Interview scheduled",
            id: result.insertId
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to schedule interview"
        });

    }
}


async function updateInterviewStatus(req, res) {

    try {

        const {
            status
        } = req.body;

        const allowedStatuses = [
            "Scheduled",
            "Pending",
            "Completed",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(status)) {

            return res.status(400).json({
                message: "Invalid interview status"
            });

        }

        await pool.query(
            `
            UPDATE interviews
            SET status = ?
            WHERE id = ?
            `,
            [
                status,
                req.params.id
            ]
        );

        res.json({
            message: "Interview status updated"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to update interview"
        });

    }
}


module.exports = {
    getInterviews,
    createInterview,
    updateInterviewStatus
};