const mongoose = require("mongoose");

const AutoIncrement = require("mongoose-sequence")(mongoose);

const exampleModel = new mongoose.Schema(
  {
    num: {
      type: Number,
    },
    is_archived: {
      type: Boolean,
      default: false,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * This sets autoincrement numeric counter for the collection giving you 1, 2, 3...n
 */

exampleModel.plugin(AutoIncrement, {
  id: "example_seq",
  inc_field: "num",
});

exampleModel.index({
  num: "text",
  title: "text",
  description: "text",
  user_id: "text",
  is_archived: "text",
});

module.exports = mongoose.model("Example", exampleModel);
