const mongoose = require("mongoose");

const { AppError } = require("../middleware/error");
const { listToCsv } = require("../utils/listToCsv");
const { trailModel } = require("../models");
const logger = require("../logger");

const lib = {
  async create(req, resource, action, others = {}) {
    try {
      const user = req.user.currentUser;
      let admin_id;
      let user_id;

      if (user.type == "Admin") {
        admin_id = user._id;
      } else {
        user_id = user._id;
      }

      const trail = await trailModel.create({
        resource,
        user_id,
        admin_id,
        action,
        metadata: {
          ip: req.headers["x-forwarded-for"] || req.ip,
          agent: req.headers["user-agent"],
          url: req.originalUrl,
          method: req.method,
          params: req.params,
          query: req.query,
          ...(typeof others === "object" && others !== null ? others : {}),
        },
      });

      return trail;
    } catch (error) {
      logger.error(`Error adding to trail`);
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
        user_id,
        admin_id,
        user,
      } = params;
      /* eslint-disable prefer-const */

      pageNo = pageNo ? +pageNo : 1;
      limitNo = limitNo ? +limitNo : 10;

      const sort = { $sort: { date: -1 } };
      const query = {};

      if (user.type === "Admin") {
        query["admin_id"] = { $exists: true };
      }

      if (user.type === "User") {
        query["user_id"] = { $exists: true };
      }

      if (admin_id) {
        query["admin_id"] = mongoose.Types.ObjectId(admin_id);
      }

      if (user_id) {
        query["user_id"] = mongoose.Types.ObjectId(user_id);
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
        {
          $match: query,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "admins",
            localField: "admin_id",
            foreignField: "_id",
            as: "admin",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$admin",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            date: {
              $dateToString: {
                date: "$createdAt",
                format: "%d-%m-%Y %H:%M",
              },
            },
            resource: 1,
            admin_id: 1,
            user_id: 1,
            name: {
              $ifNull: [
                { $concat: ["$user.first_name", " ", "$user.last_name"] },
                { $concat: ["$admin.first_name", " ", "$admin.last_name"] },
              ],
            },
            operation: "$action",
            ip: "$metadata.ip",
            url: "$metadata.url",
            method: "$metadata.method",
          },
        },
        // partial and full word search
        // search also works on joint collection
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { name: new RegExp(search, "i") },
                    { operation: new RegExp(search, "i") },
                    { resource: new RegExp(search, "i") },
                  ],
                },
              },
            ]
          : []),
        sort,
      ];

      let trails;

      if (params.download) {
        trails = await listToCsv(params, trailModel, pipeline);

        return trails;
      }

      trails = await trailModel.aggregate([
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

      return trails;
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
