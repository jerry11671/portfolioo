const { lib } = require("../lib/trails");

const { sendResponse } = require("../utils/helpers");

const controllers = {
  async getAll(req, res, next) {
    try {
      const params = req.query;

      // process request
      const trails = await lib.getAll(params);

      if (params.download) {
        res.attachment("trails.csv");
        return res.status(200).send(trails);
      }

      return sendResponse(200, "Successful.", trails[0])(req, res);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controllers;
