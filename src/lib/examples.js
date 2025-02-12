const { listToCsv } = require("../utils/listToCsv");

// const { redisClient, redisCache } = require("../models/db/redis");
const { AppError } = require("../middleware/error");
const { exampleModel } = require("../models");
const { validateAddOrEdit } = require("./validations/examples");

const lib = {
  async create(params) {
    try {
      const { error } = validateAddOrEdit(params);

      if (error) throw new AppError(400, error.details[0].message);

      const example = await exampleModel.create({ ...params });

      if (!example) throw new AppError(500, "Internal server error.");

      return;
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
        filter = "createdAt",
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

      query["is_archived"] = false;

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
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
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
            title: 1,
            description: 1,
            user_id: 1,
            author: { $concat: ["$user.first_name", " ", "$user.last_name"] },
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
                    { author: new RegExp(search, "i") },
                  ],
                },
              },
            ]
          : []),
        sort,
      ];

      let examples;

      if (params.download) {
        examples = await listToCsv(params, exampleModel, pipeline);

        return examples;
      }

      examples = await exampleModel.aggregate([
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

      return examples;
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
      let example = await exampleModel.findById(params.id).lean();

      if (!example) throw new AppError(404, "Record not found.");

      return example;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  /*

  // read with redis cache

  async readSingle(params) {
    try {
      const fetchDB = async () => {
        const example = await exampleModel.findById(params.id);

        if (!example) throw new AppError(404, "Record not found.");

        return example;
      };

      // get or cache
      return await redisCache(`examples:${params.id}`, fetchDB);
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
      const { error } = validateAddOrEdit(params);

      if (error) throw new AppError(400, error.details[0].message);

      let example = await exampleModel.findById(params.id).lean();

      if (!example) throw new AppError(404, "Record not found.");

      let update_example = await exampleModel.findByIdAndUpdate(params.id, {
        $set: {
          ...params,
        },
      });

      if (!update_example) throw new AppError(500, "Internal server error.");

      return;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  /*

  // update with redis cache

  async update(params) {
    try {
      const { error } = validateAddOrEdit(params);

      if (error) throw new AppError(400, error.details[0].message);

      const cached_key = `examples:${params.id}`;

      const example = await lib.readSingle(params);

      const update_example = await exampleModel.findByIdAndUpdate(
        example._id,
        {
          $set: {
            ...params,
          },
        },
        { new: true }
      );

      if (!update_example) throw new AppError(500, "Internal server error.");

      // update only if the key already exists in redis db.
      await redisClient.SET(cached_key, JSON.stringify(update_example), {
        XX: true,
      });

      return update_example;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },
  */

  async delete(params) {
    try {
      let example = await exampleModel.findById(params.id).lean();

      if (!example) throw new AppError(404, "Record not found.");

      let delete_example = await exampleModel.findByIdAndDelete(params.id);

      if (!delete_example) throw new AppError(500, "internal server error.");

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
