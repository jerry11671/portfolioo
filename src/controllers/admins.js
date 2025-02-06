const lib = require("../lib/admins");

const trailsLib = require("../lib/trails");
const { notify } = require("../lib/notifications");
const { sendResponse } = require("../utils/helpers");

const controller = {
  async create(req, res, next) {
    try {
      const params = req.body;

      const data = await lib.create(params);

      sendResponse(201, "Successful.")(req, res);

      // send email
      notify(
        {
          email: true,
        },
        "add_team_member",
        data,
        data
      );

      // add trail
      trailsLib.create(req, "admins", "Added a new team member.");

      return;
    } catch (error) {
      next(error);
    }
  },

  async read(req, res, next) {
    try {
      // request
      const params = req.query;

      // process request
      const data = await lib.read(params);

      if (params.download) {
        res.attachment("team.csv");
        return res.status(200).send(data);
      }

      return sendResponse(200, "Successful.", data[0])(req, res);
    } catch (error) {
      next(error);
    }
  },

  async readSingle(req, res, next) {
    try {
      // request
      const params = req.params;
      params.user_id = req.params.user_id;

      if (!params.user_id) {
        params.user_id = req.user.currentUser._id;
      }

      // process request
      const data = await lib.readSingle(params);

      return sendResponse(200, "Successful.", data)(req, res);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const params = req.body;
      params.user = req.user.currentUser;
      params.admin_id = params.user._id;
      params.user_id = req.params.user_id;

      delete params.password;
      delete params.is_archived;
      delete params.type;
      delete params.status;

      // process request
      await lib.update(params);

      sendResponse(200, "Successful.")(req, res);

      // add trail
      trailsLib.create(req, "admins", "Updated a team member's profile.");

      return;
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const params = req.body;
      params.user = req.user.currentUser;
      params.admin_id = params.user._id;
      params.user_id = req.params.user_id;

      let status;

      if (params.status == false) {
        status = "Suspended";
      } else {
        status = "Activated";
      }

      // process request
      const data = await lib.updateStatus(params);

      // response
      sendResponse(200, "Successful.")(req, res);

      // send email
      if (status == "Suspended") {
        notify(
          {
            email: true,
          },
          "suspend_user",
          data,
          data
        );
      } else {
        notify(
          {
            email: true,
          },
          "activate_user",
          data,
          data
        );
      }

      // add trail
      trailsLib.create(req, "admins", `${status} a team member.`);

      return;
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controller;
