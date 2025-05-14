const lib = require("../lib/auths");

const trailsLib = require("../lib/trails");
const { notify } = require("../lib/notifications");
const { sendResponse } = require("../utils/helpers");

const {getToken} = require("../utils/auths");

const controller = {
  async registerUser(req, res, next) {
    try {
      // request
      const params = req.body;

      // process request
      const data = await lib.registerUser(params);

      // response
      sendResponse(200, "Successful.")(req, res);

      // send email
      notify(
        {
          email: true,
        },
        "verify_email",
        data,
        data
      );

      return;
    } catch (error) {
      next(error);
    }
  },

  // REGISTER- RESEND VALIDATION TOKEN
  async resendRegistrationVerificationCode(req, res, next) {
    try {
      // request
      const params = req.body;

      // process request
      const data = await lib.resendRegistrationVerificationCode(params);

      // response
      sendResponse(200, "Successful.")(req, res);

      // send email
      notify(
        {
          email: true,
        },
        "verify_email",
        data,
        data
      );

      return;
    } catch (error) {
      next(error);
    }
  },

  // REGISTER-  VALIDATE TOKEN & COMPLETE REGISTRATION
  async validateRegistrationToken(req, res, next) {
    try {
      // request
      const params = req.body;

      // process request
      const data = await lib.validateRegistrationToken(params);

      // response
      sendResponse(200, "Successful.")(req, res);

      // send email
      notify(
        {
          email: true,
        },
        "registration_completed",
        data,
        data
      );

      return;
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const user = req.user;

      const token = getToken(user);

      const data = {user, token};

      // response
      sendResponse(200, "Successful.", data)(req, res);
    } catch (error) {
      next(error);
    }
  },

  // FORGOT PASSWORD - SEND RESET PASSWORD VERIFICATION CODE
  async forgotPassword(req, res, next) {
    try {
      // request
      const params = req.body;

      // process request
      const data = await lib.generateResetPasswordToken(params);

      sendResponse(200, "Successful.")(req, res);

      // send email
      notify(
        {
          email: true,
        },
        "forgot_password",
        data,
        data
      );

      return;
    } catch (error) {
      next(error);
    }
  },

  // FORGOT PASSWORD - VALIDATE RESET PASSWORD OTP
  async validateResetPasswordToken(req, res, next) {
    try {
      // request
      const params = req.body;

      // process request
      await lib.validateResetPasswordToken(params);

      return sendResponse(200, "Successful.")(req, res);
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      // request
      const params = req.body;

      // process request
      const data = await lib.resetPassword(params);

      sendResponse(200, "Successful.")(req, res);

      // send email
      notify(
        {
          email: true,
        },
        "reset_password_success",
        data,
        data
      );

      return;
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      // request
      const params = req.body;
      params.user = req.user.currentUser;
      params.email = params.user.email;
      params.user_id = params.user._id;

      // process request
      const data = await lib.changePassword(params);

      sendResponse(200, "Successful.")(req, res);

      // send email
      notify(
        {
          email: true,
        },
        "change_password_success",
        data,
        data
      );

      // add trail
      trailsLib.create(req, "auths", "Changed their password.");

      return;
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controller;
