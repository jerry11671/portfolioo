const lib = require("../lib/auths");

const trailsLib = require("../lib/trails");
const { notify } = require("../lib/notifications");
const { sendResponse } = require("../utils/helpers");

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

  // RGISTER- RESEND VALIDATION TOKEN
  async resendRegisterationVerificationCode(req, res, next) {
    try {
      // request
      const params = req.body;

      // process request
      const data = await lib.resendRegisterationVerificationCode(params);

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

  // REGISTER-  VALIDATE TOKEN & COMPLETE REGISTERATION
  async validateRegisterationToken(req, res, next) {
    try {
      // request
      const params = req.body;

      // process request
      const data = await lib.validateRegisterationToken(params);

      // response
      sendResponse(200, "Successful.")(req, res);

      // send email
      notify(
        {
          email: true,
        },
        "registeration_completed",
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
      // request
      const params = req.body;

      // process request
      const data = await lib.login(params);

      return sendResponse(200, "Successful.", data)(req, res);
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
