const router = require("express").Router();

const {
  setAppParam,
  validateGoogleRecaptchaToken,
  isLoggedIn,
} = require("../../../middleware/auth");

const {
  login,
  forgotPassword,
  validateResetPasswordToken,
  resetPassword,
  changePassword,
} = require("../../../controllers/auths");

// login screen
router.post("/auths/login", setAppParam, validateGoogleRecaptchaToken, login);

// forgot-password screen
router.post(
  "/auths/forgot-password",
  setAppParam,
  validateGoogleRecaptchaToken,
  forgotPassword
);

// validate reset password OTP screen
router.post(
  "/auths/validate-reset-password-code",
  setAppParam,
  validateResetPasswordToken
);

// reset-password screen
router.post("/auths/reset-password", setAppParam, resetPassword);

// change password screen
router.patch("/auths/change-password", setAppParam, isLoggedIn, changePassword);

module.exports = router;
