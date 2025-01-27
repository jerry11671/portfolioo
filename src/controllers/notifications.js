const { sendResponse } = require("../utils/helpers");

const { AppError } = require("../middleware/error");
const { userModel } = require("../models");
const { validateSendPush } = require("../lib/validations/notifications");
const trailsLib = require("../lib/trails");
const lib = require("../lib/notifications");
// const sendPush = require("../thirdParty/firebase");

const controllers = {
  // MOBILE PUSH NOTIFICATION TEST

  async sendPush(req, res, next) {
    try {
      const user = await userModel.findById(req.user.currentUser._id);
      const params = req.body;
      params.device_id = user.device_id ? user.device_id : "123";

      const { error } = validateSendPush(params);

      if (error) {
        throw new AppError(400, error.details[0].message);
      }

      /*
      sendPush(
        params.title,
        params.description,
        params.device_id,
        params.metadata
      );
      */

      return sendResponse(200, "Successful.")(req, res);
    } catch (error) {
      next(error);
    }
  },

  async read(req, res, next) {
    try {
      const params = req.query;
      params.user = req.user.currentUser;

      // process request
      const notifications = await lib.read(params);

      sendResponse(200, "Successful.", notifications[0])(req, res);

      trailsLib.create(req, "notifications", "Read their notifications.");

      return;
    } catch (error) {
      next(error);
    }
  },

  async checkNotificationAvailablility(req, res, next) {
    try {
      const params = req.params;
      params.user = req.user.currentUser;

      const data = await lib.checkNotificationAvailablility(params);

      return sendResponse(200, "Successful", data)(req, res);
    } catch (error) {
      next(error);
    }
  },

  async deleteSingle(req, res, next) {
    try {
      // process request
      const params = req.body;
      params.notification_id = req.params.notification_id;

      await lib.delete(params);

      sendResponse(200, "Successful")(req, res);

      trailsLib.create(req, "notifications", "Deleted a notification.");

      return;
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controllers;
