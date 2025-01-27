const mongoose = require("mongoose");

const trailModel = new mongoose.Schema(
  {
    resource: {
      // e.g. products, invoices
      type: String,
      required: true,
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

trailModel.index({
  actions: "text",
  resource: "text",
});

module.exports = mongoose.model("Trail", trailModel);
