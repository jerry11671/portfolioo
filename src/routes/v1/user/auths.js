const router = require("express").Router();

const {
  setAppParam,
  validateGoogleRecaptchaToken,
  isLoggedIn,
} = require("../../../middleware/auth");

const {
  registerUser,
  resendRegisterationVerificationCode,
  validateRegisterationToken,
  login,
  forgotPassword,
  validateResetPasswordToken,
  resetPassword,
  changePassword,
} = require("../../../controllers/auths");

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
  resendRegisterationVerificationCode
);

router.post(
  "/auths/register/validate-code",
  setAppParam,
  validateRegisterationToken
);

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
  "/auths/forgot-password/validate-code",
  setAppParam,
  validateResetPasswordToken
);

// reset-password screen
router.post("/auths/reset-password", setAppParam, resetPassword);

// change password screen
router.patch("/auths/change-password", setAppParam, isLoggedIn, changePassword);

module.exports = router;
