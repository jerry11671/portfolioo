const bcrypt = require("bcrypt");

const { userModel, exampleModel, trailModel } = require("../../models/index");

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

  async createUser() {
    let user = new userModel({
      first_name: "Super",
      last_name: "Admin",
      email: "admin.template@yopmail.com",
      password: bcrypt.hashSync("password", 8),
      role: "admin",
    });

    user = await user.save();

    return user;
  },

  async createTrail() {
    const user = await helpers.createUser();

    let trail = new trailModel({
      user_id: user._id,
      action: "Added example to list.",
    });

    trail = await trail.save();

    return trail;
  },
};

module.exports = helpers;
