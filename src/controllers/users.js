const lib = require("../lib/users");

const trailsLib = require("../lib/trails");
const { notify } = require("../lib/notifications");
const { sendResponse } = require("../utils/helpers");

const controller = {
  async read(req, res, next) {
    try {
      // request
      const params = req.query;

      // process request
      const data = await lib.read(params);

      if (params.download) {
        res.attachment("users.csv");
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
      // request
      const params = req.body;

      delete params.is_deleted;
      delete params.is_archived;
      delete params.status;
      delete params.role;
      delete params.type;
      delete params.password;
      delete params.reset_password;
      delete params.createdAt;

      params.user_id = req.user._id;
      params.user_email = req.user.email;

      // process request
      const data = await lib.update(params);

      sendResponse(200, "Successful.", data)(req, res);

      // add trail
      if (params.user.type == "Admin") {
        trailsLib.create(
          req,
          "users",
          `Updated ${data.first_name} ${data.last_name}'s profile.`
        );
      }

      if (params.user.type == "User") {
        trailsLib.create(
          req,
          "users",
          `${data.first_name} ${data.last_name} updated their profile.`
        );
      }

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
      trailsLib.create(req, "users", `${status} a team member.`);

      return;
    } catch (error) {
      next(error);
    }
  },

  async deleteSingle(req, res, next) {
    try {
      // process request
      const params = req.body;
      params.user = req.user.currentUser;
      params.user_id = req.params.user_id;

      if (!params.user_id) {
        params.user_id = req.user.currentUser._id;
      }

      const data = await lib.delete(params);

      // response
      sendResponse(200, "Successful.")(req, res);

      // add trail
      if (params.user.type == "Admin") {
        trailsLib.create(req, "users", `Deleted ${data.name}'s account.`);
      }

      if (params.user.type == "User") {
        trailsLib.create(req, "users", `${data.name} deleted their account.`);
      }

      return;
    } catch (error) {
      next(error);
    }
  },
};

module.exports = controller;
