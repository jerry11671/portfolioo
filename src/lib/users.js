const { AppError } = require("../middleware/error");

const { userModel } = require("../models");
const { listToCsv } = require("../utils/listToCsv");
const { validateEdit } = require("./validations/users");

const lib = {
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
            phone: 1,
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
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async readSingle(params) {
    try {
      const user_id = params.user_id;

      const user = await userModel.findById(user_id);

      if (!user) throw new AppError(404, "Record not found.");

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async update(params) {
    try {
      const { error } = validateEdit(params);

      if (error) {
        throw new AppError(400, error.details[0].message);
      }

      const user = await userModel.findById(params.user_id).lean();

      if (!user) throw new AppError(404, "Record not found.");

      if (params.email) {
        const email_taken = await userModel.findOne({
          $and: [
            { email: params.email.trim().toLowerCase() },
            { _id: { $ne: params.user_id } },
            { email: { $exists: true, $ne: "" } },
          ],
        });

        if (email_taken) throw new AppError(409, "Email address aready taken.");
      }

      if (params.phone) {
        const phone_taken = await userModel.findOne({
          $and: [
            { phone: params.phone.trim() },
            { _id: { $ne: params.user_id } },
            { phone: { $exists: true, $ne: "" } },
          ],
        });

        if (phone_taken) throw new AppError(409, "Phone number aready taken.");
      }

      const update_user = await userModel.findByIdAndUpdate(
        params.user_id,
        {
          ...params,
        },
        { new: true }
      );

      if (!update_user) throw new AppError(500, "Internal server error.");

      return update_user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async updateStatus(params) {
    try {
      // eslint-disable-next-line no-undefined
      if (params.status === undefined) {
        throw new AppError(400, "'status' is required.");
      }

      const user = await userModel.findById(params.user_id);

      if (!user) throw new AppError(404, "Record not found.");

      // do not allow current user to update self
      if (params.admin_id == params.user_id) {
        throw new AppError(403, "You are not allowed to perform this action.");
      }

      const update = await userModel.findByIdAndUpdate(params.user_id, {
        status: params.status,
      });

      if (!update) throw new AppError(500, "Internal server error.");

      return update;
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
      const user = await userModel.findById(params.user_id);

      if (!user) {
        throw new AppError(404, "Record not found.");
      }

      const delete_user = await userModel.findByIdAndUpdate(params.user_id, {
        is_deleted: true,
        status: false,
      });

      if (!delete_user) {
        throw new AppError(500, "Internal server error.");
      }

      return { name: `${user.first_name} ${user.last_name}` };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async userExist(id, selectProperties) {
    let query = userModel.findOne({
      $or: [{ email: id }, { phone: id }],
    });

    if (selectProperties) query = query.select(selectProperties);

    return await query;
  },
};

module.exports = lib;
