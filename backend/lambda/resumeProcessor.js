const {
    S3Client,
    HeadObjectCommand
} = require("@aws-sdk/client-s3");

const {
    SNSClient,
    PublishCommand
} = require("@aws-sdk/client-sns");

const mysql = require("mysql2/promise");


// --------------------------------------------------
// AWS Clients
// --------------------------------------------------

const s3 = new S3Client({
    region: process.env.AWS_REGION
});

const sns = new SNSClient({
    region: process.env.AWS_REGION
});


// --------------------------------------------------
// MySQL Connection Pool
// --------------------------------------------------

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 2
});


// --------------------------------------------------
// Ensure Resume Processing Status Column Exists
// --------------------------------------------------

async function ensureResumeStatusColumn() {

    const [columns] = await db.query(`
        SHOW COLUMNS
        FROM candidates
        LIKE 'resume_processing_status'
    `);

    if (columns.length === 0) {

        await db.query(`
            ALTER TABLE candidates
            ADD COLUMN resume_processing_status ENUM(
                'PENDING',
                'PROCESSING',
                'COMPLETED',
                'FAILED'
            ) DEFAULT 'PENDING'
        `);

        console.log(
            "resume_processing_status column created."
        );

    } else {

        console.log(
            "resume_processing_status column already exists."
        );
    }
}


// --------------------------------------------------
// Lambda Handler
// --------------------------------------------------

exports.handler = async (event) => {

    console.log(
        "TalentFlow Resume Processor started"
    );

    // Ensure database column exists
    await ensureResumeStatusColumn();

    console.log(
        "Received event:",
        JSON.stringify(event, null, 2)
    );


    // --------------------------------------------------
    // Process each SQS record
    // --------------------------------------------------

    for (const record of event.Records || []) {

        let candidateId = null;

        try {

            // --------------------------------------------------
            // 1. Parse SQS message
            // --------------------------------------------------

            const body = JSON.parse(record.body);

            console.log(
                "SQS message body:",
                JSON.stringify(body, null, 2)
            );


            // --------------------------------------------------
            // 2. Extract S3 event information
            // --------------------------------------------------

            const s3Event = body.detail;

            if (
                !s3Event ||
                !s3Event.bucket ||
                !s3Event.object
            ) {

                console.log(
                    "No S3 object information found in message."
                );

                continue;
            }


            const bucket = s3Event.bucket.name;

            const key = decodeURIComponent(
                s3Event.object.key.replace(/\+/g, " ")
            );


            console.log(
                `Processing resume: s3://${bucket}/${key}`
            );


            // --------------------------------------------------
            // 3. Verify resume exists in S3
            // --------------------------------------------------

            const response = await s3.send(
                new HeadObjectCommand({
                    Bucket: bucket,
                    Key: key
                })
            );


            console.log(
                "Resume object found successfully."
            );

            console.log(
                "Content-Type:",
                response.ContentType
            );

            console.log(
                "Content-Length:",
                response.ContentLength
            );

            console.log(
                "Last-Modified:",
                response.LastModified
            );


            // --------------------------------------------------
            // 4. Find candidate using resume S3 key
            // --------------------------------------------------

            const [candidates] = await db.query(
                `
                SELECT id
                FROM candidates
                WHERE resume_s3_key = ?
                LIMIT 1
                `,
                [key]
            );


            if (candidates.length === 0) {

                console.log(
                    `No candidate found for resume_s3_key: ${key}`
                );

                // Ignore unrelated/test S3 objects.
                continue;
            }


            candidateId = candidates[0].id;


            console.log(
                `Candidate found: ${candidateId}`
            );


            // --------------------------------------------------
            // 5. Set processing status = PROCESSING
            // --------------------------------------------------

            await db.query(
                `
                UPDATE candidates
                SET resume_processing_status = 'PROCESSING'
                WHERE id = ?
                `,
                [candidateId]
            );


            console.log(
                `Candidate ${candidateId} status updated to PROCESSING`
            );


            // --------------------------------------------------
            // 6. Resume Processing
            // --------------------------------------------------

            // Actual AI resume analysis will be implemented
            // separately.
            //
            // For Step 10.10, successful S3 verification
            // represents successful resume processing.

            console.log(
                `Resume processing completed for s3://${bucket}/${key}`
            );


            // --------------------------------------------------
            // 7. Set processing status = COMPLETED
            // --------------------------------------------------

            await db.query(
                `
                UPDATE candidates
                SET resume_processing_status = 'COMPLETED'
                WHERE id = ?
                `,
                [candidateId]
            );


            console.log(
                `Candidate ${candidateId} status updated to COMPLETED`
            );


            // --------------------------------------------------
            // 8. Publish SNS Notification
            // --------------------------------------------------

            const notificationMessage = {

                message:
                    "TalentFlow resume processing completed",

                candidateId:
                    candidateId,

                bucket:
                    bucket,

                key:
                    key,

                status:
                    "COMPLETED"
            };


            await sns.send(
                new PublishCommand({

                    TopicArn:
                        process.env.SNS_TOPIC_ARN,

                    Subject:
                        "TalentFlow Resume Processing Completed",

                    Message:
                        JSON.stringify(notificationMessage)
                })
            );


            console.log(
                "SNS notification published successfully."
            );


        } catch (error) {

            // --------------------------------------------------
            // 9. Processing Failed
            // --------------------------------------------------

            console.error(
                "Resume processing failed:",
                error
            );


            // --------------------------------------------------
            // 10. Set processing status = FAILED
            // --------------------------------------------------

            if (candidateId) {

                try {

                    await db.query(
                        `
                        UPDATE candidates
                        SET resume_processing_status = 'FAILED'
                        WHERE id = ?
                        `,
                        [candidateId]
                    );


                    console.log(
                        `Candidate ${candidateId} status updated to FAILED`
                    );


                } catch (dbError) {

                    console.error(
                        "Failed to update candidate status to FAILED:",
                        dbError
                    );
                }
            }


            // --------------------------------------------------
            // 11. Throw Error
            // --------------------------------------------------
            //
            // Throwing the error causes Lambda/SQS to retry
            // the message. After the configured retry limit,
            // SQS moves the message to the DLQ.

            throw error;
        }
    }


    // --------------------------------------------------
    // Lambda Response
    // --------------------------------------------------

    return {

        statusCode: 200,

        message:
            "Resume processing completed"
    };
};