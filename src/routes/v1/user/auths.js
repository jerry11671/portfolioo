require("../../../strategies/local-strategy");
const router = require("express").Router();

const {
  setAppParam,
  validateGoogleRecaptchaToken,
  isLoggedIn,
} = require("../../../middleware/auth");

const {
  registerUser,
  resendRegistrationVerificationCode,
  validateRegistrationToken,
  login,
  forgotPassword,
  validateResetPasswordToken,
  resetPassword,
  changePassword,
} = require("../../../controllers/auths");

const passport = require("passport");

// register screen
router.post(
  "/auths/register",
  setAppParam,
  validateGoogleRecaptchaToken,
  registerUser
);

router.post(
  "/auths/register/resend-code",
  setAppParam,
  resendRegistrationVerificationCode
);

router.post(
  "/auths/register/validate-code",
  setAppParam,
  validateRegistrationToken
);

// login screen
// router.post("/auths/login", setAppParam, validateGoogleRecaptchaToken, login);

router.post("/auths/login", setAppParam, validateGoogleRecaptchaToken, passport.authenticate("local", {session: true}), login);

// forgot-password screen
router.post(
  "/auths/forgot-password",
  setAppParam,
  validateGoogleRecaptchaToken,
  forgotPassword
);

// validate reset password OTP screen
router.post(
  "/auths/forgot-password/validate-code",
  setAppParam,
  validateResetPasswordToken
);

// reset-password screen
router.post("/auths/reset-password", setAppParam, resetPassword);

// change password screen
router.patch("/auths/change-password", setAppParam, isLoggedIn, changePassword);

module.exports = router;
