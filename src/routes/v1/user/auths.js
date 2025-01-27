const router = require("express").Router();

const {
  setAppParam,
  validateGoogleRecaptchaToken,
  isLoggedIn,
} = require("../../../middleware/auth");

const {
  registerUser,
  resendRegisterationVerificationCode,
  login,
  forgotPassword,
  validateResetPasswordToken,
  resetPassword,
  changePassword,
} = require("../../../controllers/auths");

// register screen
router.post(
  "/register",
  setAppParam,
  validateGoogleRecaptchaToken,
  registerUser
);

router.post(
  "/register/resend-code",
  setAppParam,
  resendRegisterationVerificationCode
);

router.post(
  "/register/validate-code",
  setAppParam,
  resendRegisterationVerificationCode
);

// login screen
router.post("/login", setAppParam, validateGoogleRecaptchaToken, login);

// forgot-password screen
router.post(
  "/forgot-password",
  setAppParam,
  validateGoogleRecaptchaToken,
  forgotPassword
);

// validate reset password OTP screen
router.post(
  "/forgot-password/validate-code",
  setAppParam,
  validateResetPasswordToken
);

// reset-password screen
router.post("/reset-password", setAppParam, resetPassword);

// change password screen
router.patch("/change-password", setAppParam, isLoggedIn, changePassword);

module.exports = router;
