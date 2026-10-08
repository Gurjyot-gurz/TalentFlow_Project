const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { Upload } = require("@aws-sdk/lib-storage");

const s3 = require("../config/s3");

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function uploadResume(file, candidateId) {

    const safeFileName = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, "_");

    const key = `resumes/${candidateId}/${Date.now()}-${safeFileName}`;

    const upload = new Upload({
        client: s3,
        params: {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        }
    });

    await upload.done();

    return key;
}

async function generateDownloadUrl(key) {

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
    });

    const url = await getSignedUrl(s3, command, {
        expiresIn: 300
    });

    return url;
}

module.exports = {
    uploadResume,
    generateDownloadUrl
};