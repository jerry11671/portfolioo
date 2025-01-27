const { uploadManyToS3 } = require("../thirdParty/S3");

const { sendResponse } = require("../utils/helpers");
const { multerMiddleware, uploadManyToMulter } = require("../utils/multer");

const controller = {
  async upload(req, res, next) {
    try {
      await multerMiddleware(req, res, uploadManyToMulter);

      if (!req.files) {
        return sendResponse(
          400,
          "File not found. Please select a file to upload."
        )(req, res);
      }

      const results = await uploadManyToS3(req.files);

      return sendResponse(200, "Successful.", results)(req, res);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controller;
