const { sendResponse } = require("../utils/helpers");

class AppError extends Error {
  constructor(status_code, message) {
    super();
    this.status_code = status_code;
    this.message = message;
  }
}

const handleError = (err, req, res) => {
  const { status_code = 500, message } = err;
 
  sendResponse(status_code, message)(req, res);
};

module.exports = {
  AppError,
  handleError,
};
