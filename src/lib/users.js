const { AppError } = require("../middleware/error");

const { userModel } = require("../models");
const { listToCsv } = require("../utils/listToCsv");

const moment = require("moment");
moment().format();

const lib = {
  async read(params) {
    /* eslint-disable prefer-const */
    let {
      pageNo,
      limitNo,
      filter = "date",
      order = "-1",
      fromDate,
      toDate,
      status,
      search,
    } = params;
    /* eslint-disable prefer-const */

    pageNo = pageNo ? +pageNo : 1;
    limitNo = limitNo ? +limitNo : 10;

    const sort = { $sort: { date: -1 } };

    const query = {};

    query["is_deleted"] = false;
    query["is_archived"] = false;

    if (status == "active") {
      query["status"] = true;
    }

    if (status == "suspended") {
      query["status"] = false;
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
        $project: {
          ID: "$num",
          date: params.download // readable date for CSV | defaults to timestamp for JSON
            ? {
                $dateToString: {
                  date: "$createdAt",
                  format: "%d-%m-%Y %H:%M",
                },
              }
            : "$createdAt",
          name: { $concat: ["$first_name", " ", "$last_name"] },
          email: 1,
          phone_number: 1,
          status: params.download // readable text for CSV | defaults to boolean for JSON
            ? {
                $cond: {
                  if: { $eq: ["$status", true] },
                  then: "Active",
                  else: "Suspended",
                },
              }
            : "$status",
          role: 1,
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
                  { name: new RegExp(search, "i") },
                  { email: new RegExp(search, "i") },
                  { role: new RegExp(search, "i") },
                  { status: new RegExp(search, "i") },
                ],
              },
            },
          ]
        : []),
      sort,
    ];

    let users;

    if (params.download) {
      users = await listToCsv(params, userModel, pipeline);

      return users;
    }

    users = await userModel.aggregate([
      ...pipeline,
      sort,
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

    return users;
  },

  async readSingle(params) {
    const user_id = params.user_id;

    const user = await userModel.findById(user_id);

    if (!user) {
      throw new AppError(404, "Record not found.");
    }

    return user;
  },

  async update(params) {
    const user_id = params.user_id;
    const current_email = params.user_email;

    // check if new email is provided and is different from the current email
    if (params.email && params.email.trim().toLowerCase() !== current_email) {
      //check if new email is already in use
      const exisiting_user = await userModel.findOne({
        email: params.email.trim().toLowerCase(),
      });

      if (exisiting_user && String(exisiting_user._id) !== String(user_id)) {
        throw new AppError(409, "Email already in use.");
      }
    }

    const update_user = await userModel.findByIdAndUpdate(
      user_id,
      {
        ...params,
      },
      { new: true }
    );

    if (!update_user) {
      throw new AppError(500, "Internal server error.");
    }

    return update_user;
  },

  async delete(params) {
    const user_id = params.user_id;

    const _id = params._id;

    // do not allow current user to delete self
    if (String(_id) === String(user_id)) {
      throw new AppError(403, "You are not allowed to perform this action.");
    }

    const user = await userModel.findById(user_id);

    if (!user) {
      throw new AppError(404, "Record not found.");
    }

    // do not allow super admin to be deleted
    if (user.role === "super-admin") {
      throw new AppError(403, "You are not allowed to perform this action.");
    }

    const delete_user = await userModel.findByIdAndDelete(user_id);

    if (!delete_user) {
      throw new AppError(500, "Internal server error.");
    }

    const name = `${user.first_name} ${user.last_name}`;

    return { name };
  },

  async userExist(id, selectProperties) {
    let query = userModel.findOne({
      $or: [{ email: id }, { phone_number: id }],
    });

    if (selectProperties) query = query.select(selectProperties);

    return await query;
  },
};

module.exports = lib;
