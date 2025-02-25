const bcrypt = require("bcrypt");

const {
  exampleModel,
  adminModel,
  userModel,
  notificationModel,
  trailModel,
} = require("../../models/index");

const helpers = {
  async createExample() {
    const user = await helpers.createUser();

    let example = new exampleModel({
      title: "example title",
      description: "example description",
      user_id: user._id,
    });

    example = await example.save();

    return example;
  },

  async createAdmin() {
    let user = new adminModel({
      first_name: "Super",
      last_name: "Admin",
      email: `admin${Date.now()}@yopmail.com`,
      password: bcrypt.hashSync("password", 8),
      role: "Super Admin",
    });

    user = await user.save();

    return user;
  },

  async createUser() {
    let user = new userModel({
      first_name: "John",
      last_name: "Doe",
      email: `user${Date.now()}@yopmail.com`,
      password: bcrypt.hashSync("password", 8),
    });

    user = await user.save();

    return user;
  },

  async createNotification() {
    const user = await helpers.createUser();

    let notification = new notificationModel({
      user_id: user._id,
      title: "Example title",
      description: "Example description",
    });

    notification = await notification.save();

    return notification;
  },

  async createTrail() {
    const admin = await helpers.createAdmin();

    let trail = new trailModel({
      resource: "example",
      admin_id: admin._id,
      action: "Added example to list.",
    });

    trail = await trail.save();

    return trail;
  },
};

module.exports = helpers;
