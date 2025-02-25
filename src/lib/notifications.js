const mongoose = require("mongoose");

const fs = require("fs");
const path = require("path");
const { notificationModel } = require("../models");
const { AppError } = require("../middleware/error");
const { sendSMS } = require("../thirdParty/termii");
const sendMail = require("../thirdParty/sendMail");
// const sendPush = require("../thirdParty/firebase");
const project_title = process.env.PROJECT_TITLE;
const support_email = process.env.SUPPORT_EMAIL;
const logger = require("../logger");

const lib = {
  async notify(
    options = { email: false, sms: false, inapp: false, push: false },
    template,
    user = { id: "", email: "", phone: "", type: "" },
    params = {}
  ) {
    try {
      // send email
      if (options.email) {
        params.project_title = project_title;
        params.support_email = support_email;

        await sendMail({
          email: user.email ? user.email : user.id,
          subject: await lib.getTemplateString(
            "email.json",
            `subject.${template}`,
            params
          ),
          message: await lib.getTemplateString(
            "email.json",
            `body.${template}`,
            params
          ),
        });
      }

      //send SMS
      if (options.sms) {
        params.project_title = project_title;

        await sendSMS({
          phone: user.phone,
          message: await lib.getTemplateString(
            "sms.json",
            `${template}`,
            params
          ),
        });
      }

      //send in-app notification
      if (options.inapp) {
        if (user.type == "Admin") {
          params.admin_id = user.id;
        }

        if (user.type == "User") {
          params.user_id = user.id;
        }

        params.title = await lib.getTemplateString(
          "inapp.json",
          `title.${template}`,
          params
        );

        params.description = await lib.getTemplateString(
          "inapp.json",
          `description.${template}`,
          params
        );

        await notificationModel.create({
          ...params,
        });
      }

      //send push notification
      /*
      if (options.push) {
        const title = await lib.getTemplateString(
          "push.json",
          `title.${template}`,
          params
        );

        const description = await lib.getTemplateString(
          "push.json",
          `description.${template}`,
          params
        );

        sendPush(title, description, user.device_id, params.metadata);
      }
      */

      return true;
    } catch (error) {
      logger.error(error);
    }
  },

  async getTemplateString(jsonFileName, key, data) {
    try {
      // Construct the full file path (assuming JSON is stored in the "template" folder)
      const jsonFilePath = path.join(__dirname, "../templates", jsonFileName);

      // Load and parse the JSON file
      const rawData = fs.readFileSync(jsonFilePath, "utf8");
      const jsonObject = JSON.parse(rawData);

      // Get the nested value from the JSON using dot notation
      const getNestedValue = (obj, key) => {
        return key.split(".").reduce((o, i) => (o ? o[i] : null), obj);
      };

      const template = getNestedValue(jsonObject, key);

      if (!template) {
        throw new Error(`Key '${key}' not found in the JSON file`);
      }

      // Function to replace placeholders in the template
      const parseTemplate = (template, data) => {
        return template.replace(/{{\s*([^}\s]+)\s*}}/g, (match, key) => {
          return data[key] || match; // Replace with value from 'data' or keep placeholder if not found
        });
      };

      // Return the parsed string with placeholders replaced
      return parseTemplate(template, data);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async checkNotificationAvailability(params) {
    try {
      let count_unread;

      const query = {};

      query["is_read"] = false;

      if (params.user.type == "Admin") {
        count_unread = await notificationModel.countDocuments({
          ...query,
          admin_id: params.user._id,
        });
      }

      if (params.user.type == "User") {
        count_unread = await notificationModel.countDocuments({
          ...query,
          user_id: params.user._id,
        });
      }

      let is_available;

      if (count_unread >= 1) {
        is_available = true;
      } else {
        is_available = false;
      }

      return {
        is_available,
        count: count_unread,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async read(params) {
    try {
      /* eslint-disable prefer-const */
      let {
        pageNo,
        limitNo,
        filter = "date",
        order = "-1",
        fromDate,
        toDate,
        search,
      } = params;
      /* eslint-disable prefer-const */

      pageNo = pageNo ? +pageNo : 1;
      limitNo = limitNo ? +limitNo : 10;

      const sort = { $sort: { date: -1 } };
      const query = {};

      if (params.user.type == "Admin") {
        query["admin_id"] = mongoose.Types.ObjectId(params.user._id);
      }

      if (params.user.type == "User") {
        query["user_id"] = mongoose.Types.ObjectId(params.user._id);
      }

      if (filter) {
        if (!order) order = 1;
        sort["$sort"][filter] = parseInt(order);
      }

      if (fromDate && toDate) {
        fromDate = new Date(fromDate) || new Date(null);
        toDate = new Date(toDate) || new Date(null);
        query["createdAt"] = {
          $gte: fromDate,
          $lte: new Date(toDate.getTime() + 86399999),
        };
      }

      const pipeline = [
        { $match: query },
        {
          $project: {
            date: "$createdAt",
            admin_id: 1,
            user_id: 1,
            is_read: 1,
            title: 1,
            description: 1,
          },
        },
        // partial and full word search
        // search also works on joint collection
        // returns empty list if no match
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { title: new RegExp(search, "i") },
                    { description: new RegExp(search, "i") },
                  ],
                },
              },
            ]
          : []),
        sort,
      ];

      let notifications;

      notifications = await notificationModel.aggregate([
        ...pipeline,
        {
          $facet: {
            metadata: [
              { $count: "total" },
              {
                $addFields: {
                  page: pageNo,
                  limit: limitNo,
                  pages: { $ceil: { $divide: ["$total", limitNo] } },
                },
              },
            ],
            data: [{ $skip: pageNo * limitNo - limitNo }, { $limit: limitNo }],
          },
        },
        {
          $addFields: {
            metadata: { $arrayElemAt: ["$metadata", 0] },
          },
        },
      ]);

      // mark notifications as read
      await notificationModel.updateMany(
        { ...query },
        {
          is_read: true,
        }
      );

      return notifications;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async delete(params) {
    try {
      const notification = await notificationModel
        .findOne({ _id: params.notification_id })
        .lean();

      if (!notification) throw new AppError(404, "Record not found.");

      const delete_notification = await notificationModel.findByIdAndDelete(
        params.notification_id
      );

      if (!delete_notification) {
        throw new AppError(500, "Internal server error.");
      }

      return;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },
};

module.exports = lib;
