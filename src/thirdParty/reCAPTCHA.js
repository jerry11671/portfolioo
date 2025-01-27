const axios = require("axios");

const { AppError } = require("../middleware/error");
const reCAPTCHA_secret_key = process.env.USERS_GOOGLE_RECAPTCHA_SECRET_KEY;
const reCAPTCHA_verify_api = process.env.USERS_GOOGLE_RECAPTCHA_API;

const verifyCAPTCHA = async (recaptcha_token) => {
  const params = new URLSearchParams({
    secret: reCAPTCHA_secret_key,
    response: recaptcha_token,
  });

  return axios
    .get(`${reCAPTCHA_verify_api}?${params}`)
    .then((data) => {
      if (data.data.success && data.data.score >= 0.5) {
        return true;
      } else {
        return false;
      }
    })

    .catch(() => {
      throw new AppError(500, "Internal server error.");
    });
};

module.exports = verifyCAPTCHA;
