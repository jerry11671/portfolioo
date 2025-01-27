const moment = require("moment");

const { sendPhoneOTP, verifyPhoneOTP } = require("../thirdParty/termii");
moment().format();

const OTP = {
  async generate(digits, address, environment = "development") {
    try {
      let data;
      const channel = OTP.checkEmailOrPhone(address);

      if (environment == "production") {
        if (channel == "phone") {
          data = await sendPhoneOTP(address);
        } else if (channel == "email") {
          data = OTP.generateOTP(environment, digits);
        }
      } else if (environment == "uat") {
        if (channel == "phone") {
          data = await sendPhoneOTP(address);
        } else if (channel == "email") {
          data = OTP.generateOTP(environment, digits);
        }
      } else {
        data = OTP.generateOTP(environment, digits);
        if (channel == "email") {
          data = OTP.generateOTP(environment, digits);
        }
      }

      return data;
    } catch (error) {
      return false;
    }
  },

  async verify(mode_value, userInput) {
    try {
      if (mode_value.length > 3 && mode_value.length <= 6) {
        //token
        if (mode_value === userInput) {
          return true;
        }
      } else {
        const verify = await verifyPhoneOTP(mode_value, userInput);
        if (verify) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  generateOTP(environment, digits = 4) {
    const digitNumber = digits;
    let OTP = "1234";

    if (environment == "production" || environment == "uat") {
      OTP = "";
      const digits = "0123456789";
      for (let i = 0; i < digitNumber; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }
    }

    return OTP;
  },

  checkEmailOrPhone(input) {
    // Regular expression for validating an email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Regular expression for validating a phone number
    // This pattern matches phone numbers with optional spaces, dashes, parentheses, and country codes
    const phonePattern = /^\+?(\d[\d\-\(\)\s]{7,}\d)$/;

    if (emailPattern.test(input)) {
      return "email";
    } else if (phonePattern.test(input)) {
      return "phone";
    } else {
      return "invalid input";
    }
  },

  checkOTPExpiryTime(expiry_time) {
    const token_expiry_time = moment(expiry_time);
    const current_time = moment().format();

    if (token_expiry_time.isBefore(current_time)) {
      return false;
    }

    return true;
  },
};

module.exports = OTP;
