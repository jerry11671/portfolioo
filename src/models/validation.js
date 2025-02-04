const mongoose = require("mongoose");

const validationModel = new mongoose.Schema(
  {
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
    },
    is_verified: {
      token: {
        type: String,
        trim: true,
      },
      expires_in: {
        type: Date,
      },
      status: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

validationModel.index({
  first_name: "text",
  last_name: "text",
  email: "text",
  phone: "text",
});

module.exports = mongoose.model("Validation", validationModel);
