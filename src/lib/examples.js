const { listToCsv } = require("../utils/listToCsv");

const { AppError } = require("../middleware/error");
const { exampleModel } = require("../models");
const { validateAddOrEdit } = require("./validations/examples");

const lib = {
  async create(params) {
    const { error } = validateAddOrEdit(params);

    if (error) throw new AppError(400, error.details[0].message);

    const example = await exampleModel.create({ ...params });

    if (!example) throw new AppError(500, "Internal server error.");

    return;
  },

  async read(params) {
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
  },

  async readSingle(params) {
    let example = await exampleModel.findById(params.id).lean();

    if (!example) throw new AppError(404, "Record not found.");

    return example;
  },

  async update(params) {
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
  },

  async delete(params) {
    let example = await exampleModel.findById(params.id).lean();

    if (!example) throw new AppError(404, "Record not found.");

    let delete_example = await exampleModel.findByIdAndDelete(params.id);

    if (!delete_example) throw new AppError(500, "internal server error.");

    return;
  },
};

module.exports = lib;
