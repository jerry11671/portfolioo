const mongoose = require("mongoose");

const AutoIncrement = require("mongoose-sequence")(mongoose);

const userModel = new mongoose.Schema(
  {
    num: {
      type: Number,
    },
    status: {
      type: Boolean,
      default: true,
      required: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
      required: true,
    },
    is_archived: {
      type: Boolean,
      default: false,
      required: true,
    },
    photo: {
      type: String,
      trim: true,
      default:
        "https://uatdrive.s3.us-west-002.backblazeb2.com/587228_profile_photo.png",
    },
    first_name: {
      type: String,
      trim: true,
      required: true,
    },
    last_name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // ensure unique but allows multiple nulls
    },
    password: {
      type: String,
      select: false,
      required: true,
    },
    type: {
      type: String,
      default: "User",
      required: true,
    },
    role: {
      type: String,
      default: "User",
      required: true,
    },
    device_id: {
      type: String,
    },
    reset_password: {
      token: {
        type: String,
        select: false,
      },
      expires_in: {
        type: Date,
        select: false,
      },
      reset_password_at: {
        type: Date,
        select: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * This sets autoincrement numeric counter for the collection giving you 1, 2, 3...n
 */

userModel.plugin(AutoIncrement, {
  id: "user_seq",
  inc_field: "num",
});

userModel.index({
  num: "text",
  status: "text",
  first_name: "text",
  last_name: "text",
  email: "text",
  phone: "text",
  type: "text",
  role: "text",
  is_archived: "text",
  is_deleted: "text",
});

module.exports = mongoose.model("User", userModel);
