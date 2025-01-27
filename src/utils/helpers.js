const moment = require("moment");
moment().format();

const helpers = {
  sendResponse(status_code, message, data) {
    return (req, res) => {
      // ensure that this function will only be called once
      if (res.headersSent) {
        return;
      }

      res.status(status_code).json({
        status_code,
        message: message,
        // eslint-disable-next-line no-undefined
        data: data ? data : undefined,
      });
    };
  },

  formatPhoneNumber(input) {
    if (!input) return null;

    // Remove any non-numeric characters except '+' for safety
    let phoneNumber = input.replace(/[^\d+]/g, "");

    // If the number starts with '+', we assume it's a valid international number, so leave it unchanged
    if (phoneNumber.startsWith("+")) {
      // Check if it starts with '+234'
      if (phoneNumber.startsWith("+234")) {
        // Ensure it's in the correct format (13 characters after '+234')
        if (phoneNumber.length === 14) {
          return phoneNumber; // The number is valid
        }
        return phoneNumber; // Incorrect length for +234
      } else {
        return phoneNumber; // Some other country code, leave it as is
      }
    }

    // If the number doesn't start with '+', process it as a Nigerian number
    phoneNumber = phoneNumber.replace(/\D/g, ""); // Remove any non-numeric characters

    // If the number starts with '0', remove it
    if (phoneNumber.startsWith("0")) {
      phoneNumber = phoneNumber.substring(1);
    }

    // If the number starts with '234', add '+' if it's missing
    if (phoneNumber.startsWith("234")) {
      phoneNumber = `+${phoneNumber}`;
    }
    // If the number doesn't start with '234', prepend '+234'
    else if (!phoneNumber.startsWith("+234")) {
      phoneNumber = `+234${phoneNumber}`;
    }

    // Make sure the phone number is now in the correct format and length
    if (phoneNumber.length === 14) {
      return phoneNumber; // The number is in the correct format
    }

    return phoneNumber; // Handle invalid numbers (e.g., incorrect length)
  },
};

module.exports = helpers;
