const axios = require("axios");

const bcrypt = require("bcrypt");
const { listToCsv } = require("../utils/listToCsv");
const { redisClient, redisCache } = require("../thirdParty/redis");
const randomstring = require("randomstring");
const { AppError } = require("../middleware/error");
const { adminModel } = require("../models");
const { validateAdd, validateEdit } = require("./validations/admins");
const salt_round = process.env.SALT_ROUND;
const admin_frontend_url = process.env.ADMIN_FRONTEND_URL;

const lib = {
  async create(params) {
    try {
      const { error } = validateAdd(params);

      if (error) throw new AppError(400, error.details[0].message);

      // check if user already exist
      const user = await lib.adminExist(params.email.trim().toLowerCase());

      if (user) {
        throw new AppError(409, "An account with this email already exists.");
      }

      const generatedPassword = randomstring.generate({
        length: 10,
        charset: "alphanumeric@#$%^&",
      });

      // hash password
      const password = bcrypt.hashSync(generatedPassword, Number(salt_round));

      const admin = await adminModel.create({ ...params, password });

      if (!admin) throw new AppError(500, "Internal server error.");

      return {
        email: admin.email,
        name: `${admin.first_name} ${admin.last_name}`,
        password: generatedPassword,
        link: admin_frontend_url,
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
        status,
        role,
        discovery,
      } = params;
      /* eslint-disable prefer-const */

      pageNo = pageNo ? +pageNo : 1;
      limitNo = limitNo ? +limitNo : 10;

      const sort = { $sort: { date: -1 } };

      const query = {};

      query["is_archived"] = false;

      if (role) {
        query["role"] = role;
      }

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
        { $match: query },
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
            status: params.download // readable text for CSV | defaults to boolean for JSON
              ? {
                  $cond: {
                    if: { $eq: ["$status", true] },
                    then: "Active",
                    else: "Suspended",
                  },
                }
              : "$status",
            name: { $concat: ["$first_name", " ", "$last_name"] },
            email: 1,
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

      let admins;

      if (params.download) {
        admins = await listToCsv(params, adminModel, pipeline);

        return admins;
      }

      if (discovery) {
        admins = await adminModel.aggregate([...pipeline]);

        return admins;
      }

      admins = await adminModel.aggregate([
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

      return admins;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  /*
  async readSingle(params) {
    try {
      const admin = await adminModel.findById(params.user_id);

      if (!admin) throw new AppError(404, "Record not found.");

      return admin;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },
  */

  async readSingle(params) {
    try {
      const fetchDB = async () => {
        const admin = await adminModel.findById(params.user_id);

        if (!admin) throw new AppError(404, "Record not found.");

        return admin;
      };

      // get or cache
      return await redisCache(`admins:${params.user_id}`, fetchDB);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  /*
  async update(params) {
    try {
      const { error } = validateEdit(params);

      if (error) throw new AppError(400, error.details[0].message);

      const admin = await adminModel.findById(params.user_id).lean();

      if (!admin) throw new AppError(404, "Record not found.");

      if (params.email) {
        const email_taken = await adminModel.findOne({
          $and: [
            { email: params.email.trim().toLowerCase() },
            { _id: { $ne: params.user_id } },
            { email: { $exists: true, $ne: "" } },
          ],
        });

        if (email_taken) throw new AppError(409, "Email address aready taken.");
      }

      const update_member = await adminModel.findByIdAndUpdate(params.user_id, {
        $set: {
          ...params,
        },
      });

      if (!update_member) throw new AppError(500, "Internal server error.");

  

      return update_member;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },
  */

  async update(params) {
    try {
      const { error } = validateEdit(params);

      if (error) throw new AppError(400, error.details[0].message);

      const cached_key = `admins:${params.user_id}`;

      const admin = await lib.readSingle(params);

      if (params.email) {
        const email_taken = await adminModel.findOne({
          $and: [
            { email: params.email.trim().toLowerCase() },
            { _id: { $ne: admin.id } },
            { email: { $exists: true, $ne: "" } },
          ],
        });

        if (email_taken) throw new AppError(409, "Email address aready taken.");
      }

      const update_member = await adminModel.findByIdAndUpdate(
        params.user_id,
        {
          $set: {
            ...params,
          },
        },
        { new: true }
      );

      if (!update_member) throw new AppError(500, "Internal server error.");

      // update only if the key already exists in redis db.
      await redisClient.SET(cached_key, JSON.stringify(update_member), {
        XX: true,
      });

      return update_member;
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

      const user = await adminModel.findById(params.user_id);

      if (!user) throw new AppError(404, "Record not found.");

      // do not allow current user to update self
      if (params.admin_id == params.user_id) {
        throw new AppError(403, "You are not allowed to perform this action.");
      }

      const update = await adminModel.findByIdAndUpdate(params.user_id, {
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

  async adminExist(id, selectProperties) {
    try {
      let query = adminModel.findOne({
        email: id,
      });

      if (selectProperties) query = query.select(selectProperties);

      return await query;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async readRedis() {
    const fetchData = async () => {
      const response = await axios.get(
        `https://jsonplaceholder.typicode.com/photos`
      );
      return response.data;
    };

    return await lib.getOrSetCache("photos", fetchData);
  },
};

module.exports = lib;
