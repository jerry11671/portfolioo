const axios = require("axios");

const { formatPhoneNumber } = require("../utils/helpers");
const base_url = process.env.TERMII_BASE_URL;
const api_key = process.env.TERMII_API_KEY;
const logger = require("../logger");

const termii = {
  async sendSMS(params) {
    try {
      const data = {
        api_key: api_key,
        type: "plain",
        to: formatPhoneNumber(params.phone),
        from: "N-Alert",
        channel: "dnd",
        sms: params.message,
      };

      const response = await axios.post(`${base_url}/api/sms/send`, data);

      if (response.data && response.data.code == "ok") {
        return response.data;
      } else {
        return false;
      }
    } catch (error) {
      logger.error(`Error sending SMS: ${error}`);
      return false;
    }
  },

  async sendPhoneOTP(params) {
    try {
      const data = {
        api_key: api_key,
        message_type: "NUMERIC",
        to: formatPhoneNumber(params.phone),
        from: "N-Alert",
        channel: "dnd",
        pin_attempts: 10,
        pin_time_to_live: 5,
        pin_length: 4,
        pin_placeholder: "< 123456 >",
        message_text: params.message,
        pin_type: "NUMERIC",
      };

      const response = await axios.post(`${base_url}/api/sms/otp/send`, data);

      // Log and return the pin_id if available in response
      if (response.data && response.data.pin_id) {
        return response.data.pin_id; // Return the pin_id correctly
      } else {
        return false;
      }
    } catch (error) {
      logger.error(`Error sending OTP : ${error}`);
      return false;
    }
  },

  async verifyPhoneOTP(pin_id, code) {
    try {
      const data = {
        api_key: api_key,
        pin_id: pin_id,
        pin: code,
      };

      const response = await axios.post(`${base_url}/api/sms/otp/verify`, data);

      // Log and return the pin_id if available in response
      if (response.data && response.data?.verified == true) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      logger.error(`Error verifying OTP : ${error}`);
      return false;
    }
  },
};

module.exports = termii;
