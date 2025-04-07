"use strict";

const {
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const { Upload } = require("@aws-sdk/lib-storage");
const path = require("path");
const mime = require("mime-types");
const validUrl = require("valid-url");
const logger = require("../logger");

// Create S3 client instance
const s3Client = new S3Client({
  region: process.env.STORAGE_REGION,
  credentials: {
    accessKeyId: process.env.STORAGE_KEY_ID,
    secretAccessKey: process.env.STORAGE_KEY_SECRET,
  },
  endpoint: process.env.S3_ENDPOINT,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumCalculation: "WHEN_REQUIRED",
});

// middleware to remove unsupported checksum headers
s3Client.middlewareStack.add(
  (next) => async (args) => {
    if (args.request && args.request.headers) {
      delete args.request.headers["x-amz-checksum-crc32"];
      delete args.request.headers["x-amz-checksum-crc32c"];
      delete args.request.headers["x-amz-checksum-sha1"];
      delete args.request.headers["x-amz-checksum-sha256"];
    }
    return next(args);
  },
  {
    step: "build",
    name: "removeChecksumHeadersMiddleware",
    priority: "high",
  }
);

// upload many to S3
const uploadManyToS3 = async (files) => {
  const results = [];

  for (const file of files) {
    const uploadParallel = new Upload({
      client: s3Client,
      queueSize: 10,
      partSize: 5542880,
      leavePartsOnError: false,
      params: {
        Bucket: process.env.STORAGE_BUCKET_NAME,
        Key: `${Math.floor(Math.random() * 1000000) + 1}_${file.originalname}`,
        Body: file.buffer,
      },
    });

    let mime_type = file.mimetype;
    const streamMimeTypes = [
      "application/octet-stream",
      "application/stream+xml",
      "application/stream",
    ];

    if (streamMimeTypes.includes(file.mimetype)) {
      const file_extension = path.extname(file.originalname);
      mime_type = mime.lookup(file_extension) || "N/A";
    }
    let type;
    if (mime_type.startsWith("image/")) {
      type = "image";
    } else if (mime_type.startsWith("audio/")) {
      type = "audio";
    } else if (mime_type.startsWith("video/")) {
      type = "video";
    } else {
      type = mime_type;
    }

    const result = await uploadParallel.done();

    if (!validUrl.isUri(result.Location)) {
      result.Location = `${process.env.STORAGE_ENDPOINT}/${result.Key}`;
    }

    results.push({
      src: result.Location,
      title: file.originalname,
      type,
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
    });
  }

  return results;
};

// delete file from S3
const deleteSingleFromS3 = async (objectKey) => {
  const command = new DeleteObjectCommand({
    Bucket: process.env.STORAGE_BUCKET_NAME,
    Key: objectKey,
  });

  try {
    await s3Client.send(command);
  } catch (err) {
    logger.error(err);
  }
};

const deleteManyFromS3 = async (objects) => {
  const command = new DeleteObjectsCommand({
    Bucket: process.env.STORAGE_BUCKET_NAME,
    Delete: {
      Objects: objects,
    },
  });

  try {
    await s3Client.send(command);
  } catch (err) {
    logger.error(err);
  }
};

module.exports = { uploadManyToS3, deleteSingleFromS3, deleteManyFromS3 };
