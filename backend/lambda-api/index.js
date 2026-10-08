const {
    SQSClient,
    SendMessageCommand
} = require("@aws-sdk/client-sqs");

const sqs = new SQSClient({
    region: process.env.AWS_REGION
});

const QUEUE_URL = process.env.QUEUE_URL;

exports.handler = async (event) => {

    console.log(
        "TalentFlow API Lambda started"
    );

    console.log(
        "Received API request:",
        JSON.stringify(event, null, 2)
    );

    try {

        // --------------------------------------------------
        // Parse request body
        // --------------------------------------------------

        let body = {};

        if (event.body) {
    const rawBody = event.body
        .replace(/^\uFEFF/, "")
        .trim();

    body = JSON.parse(rawBody);
}

        const bucket = body.bucket;
        const key = body.key;


        // --------------------------------------------------
        // Validate request
        // --------------------------------------------------

        if (!bucket || !key) {

            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: "bucket and key are required"
                })
            };
        }


        // --------------------------------------------------
        // Create S3-style event payload
        // --------------------------------------------------

        const message = {
            detail: {
                bucket: {
                    name: bucket
                },
                object: {
                    key: key
                }
            }
        };


        // --------------------------------------------------
        // Send asynchronous job to SQS
        // --------------------------------------------------

        const response = await sqs.send(
            new SendMessageCommand({
                QueueUrl: QUEUE_URL,
                MessageBody: JSON.stringify(message)
            })
        );


        console.log(
            "Message sent to SQS:",
            response.MessageId
        );


        // --------------------------------------------------
        // Return HTTP 202 Accepted
        // --------------------------------------------------

        return {
            statusCode: 202,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message:
                    "Resume processing request accepted",

                status:
                    "QUEUED",

                bucket:
                    bucket,

                key:
                    key,

                messageId:
                    response.MessageId
            })
        };


    } catch (error) {

        console.error(
            "API Lambda error:",
            error
        );

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message:
                    "Failed to queue resume processing request"
            })
        };
    }
};