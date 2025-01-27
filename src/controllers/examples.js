const lib = require("../lib/examples");

const { sendResponse } = require("../utils/helpers");

const controllers = {
  async create(req, res, next) {
    try {
      const params = req.body;
      params.user_id = req.user.currentUser._id;

      await lib.create(params);

      return sendResponse(201, "Successful.")(req, res);
    } catch (error) {
      next(error);
    }
  },

  async read(req, res, next) {
    try {
      const params = req.query;

      const data = await lib.read(params);

      if (params.download) {
        res.attachment("all.csv");
        return res.status(200).send(data);
      }

      return sendResponse(200, "Successful.", data[0])(req, res);
    } catch (error) {
      next(error);
    }
  },

  async readSingle(req, res, next) {
    try {
      const params = req.params;
      params.id = req.params.id;

      const data = await lib.readSingle(params);

      return sendResponse(200, "Successful.", data)(req, res);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const params = req.body;
      params.id = req.params.id;

      await lib.update(params);

      return sendResponse(200, "Successful.")(req, res);
    } catch (error) {
      next(error);
    }
  },

  async deleteSingle(req, res, next) {
    try {
      const params = req.params;
      params.id = req.params.id;

      await lib.delete(params);

      return sendResponse(200, "Successful.")(req, res);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controllers;
