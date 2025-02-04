const lib = require("../lib/trails");

const { sendResponse } = require("../utils/helpers");

const controllers = {
  async read(req, res, next) {
    try {
      const params = req.query;
      params.user = req.user.currentUser;

      // process request
      const data = await lib.read(params);

      if (params.download) {
        res.attachment("trails.csv");
        return res.status(200).send(data);
      }

      return sendResponse(200, "Successful.", data[0])(req, res);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controllers;
