var admin = require("firebase-admin");

var serviceAccount = require("../../example-1-firebase-adminsdk-u91x5-ba4b0a014e.json");

const logger = require("../logger");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

function sendPush(title, description, device_id, metadata) {
  try {
    if (!title || typeof title != "string") {
      logger.info("Push notification title is required: ", title);
      return false;
    }

    if (!description || typeof description != "string") {
      logger.info("Push notification description is required: ", description);
      return false;
    }

    if (!isValidFCMToken(device_id)) {
      logger.info("Push notification device_token is invalid: ", device_id);
      return false;
    }

    const message = {
      notification: {
        title: title,
        body: description,
      },
      token: device_id,
      data: metadata,
    };

    admin
      .messaging()
      .send(message)
      .then((response) => {
        logger.info("Push notification sent:", response);
      })
      .catch((error) => {
        logger.error("Error sending push notification:", error);
      });
  } catch (error) {
    logger.error("Error sending push notification:", error);
  }
}

function isValidFCMToken(token) {
  return typeof token === "string" && token.length > 100;
}

module.exports = sendPush;
