const mongoose = require("mongoose");

const notificationModel = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

notificationModel.index({
  admin_id: "text",
  user_id: "text",
  is_read: "text",
  title: "text",
  description: "text",
});

module.exports = mongoose.model("Notification", notificationModel);
