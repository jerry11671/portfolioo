const bcrypt = require("bcrypt");

const moment = require("moment");
const { AppError } = require("../middleware/error");
const { validationModel, adminModel, userModel } = require("../models");
const { getToken } = require("../utils/auths");
const { formatPhoneNumber } = require("../utils/helpers");
const { storeSession } = require("../thirdParty/redis");

const {
  validateRegisteration,
  validateId,
  validateLogin,
  validateOTP,
  validateResetPassword,
  validateChangePassword,
} = require("./validations/auths");

const environment = process.env.NODE_ENV;
const salt_round = process.env.SALT_ROUND;
const adminLib = require("./admins");
const userLib = require("./users");
const OTP = require("../utils/OTP");
moment().format();

const appMap = {
  admin: {
    type: "admin",
    userExistFn: adminLib.adminExist,
    Model: adminModel,
  },
  user: {
    type: "user",
    userExistFn: userLib.userExist,
    Model: userModel,
  },
};

const lib = {
  // RGISTER
  async processRegisterUser(params) {
    try {
      // check if user exists
      const user = await userLib.userExist(params.email);

      if (user) {
        throw new AppError(409, "Account already exists.");
      }

      // delete previous/pendig validation document if user is yet to verify their email
      const pending_validation = await validationModel.findOne({
        email: params.email,
        "is_verified.status": false,
      });

      if (pending_validation) {
        const delete_pending_validation =
          await validationModel.findByIdAndDelete(pending_validation.id);

        if (!delete_pending_validation) {
          throw new AppError(500, "Internal server error.");
        }
      }

      // create new validation document
      const hash_password = bcrypt.hashSync(
        params.password,
        Number(salt_round)
      );

      const validation_document = await validationModel.create({
        ...params,
        password: hash_password,
      });

      if (!validation_document) {
        throw new AppError(500, "Internal server error.");
      }

      return {
        email: params.email,
        name: `${params.first_name} ${params.last_name}`,
        verification_code: params.verification_code,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async registerUser(params) {
    const { error } = validateRegisteration(params);

    if (error) {
      throw new AppError(400, error.details[0].message);
    }

    params.email = params.email.trim().toLowerCase();
    params.phone_number = formatPhoneNumber(params.phone_number.trim());
    // generate a 4-digit random number as the verification code
    params.verification_code = await OTP.generate(4, params.email, environment);

    params.is_verified = {
      token: params.verification_code,
      expires_in: moment().add(10, "m"), // 10 minutes
      status: false,
    };

    const register = await lib.processRegisterUser(params);

    return register;
  },

  //  REGISTER- RESEND VERIFICATION CODE
  async resendRegisterationVerificationCode(params) {
    try {
      const { error } = validateId(params);

      if (error) {
        throw new AppError(400, error.details[0].message);
      }

      params.id = params.id.trim().toLowerCase();

      // generate a 4-digit random number as the verification code
      const verification_code = await OTP.generate(4, params.id, environment);

      params.is_verified = {
        token: verification_code,
        expires_in: moment().add(10, "m"), // 10 minutes
        status: false,
      };

      // check if user is yet to signup
      const validation_document = await validationModel.findOne({
        email: params.id,
      });

      if (!validation_document) {
        throw new AppError(400, "You are yet to sign up.");
      }

      // update document
      const update_validation_document = await validationModel.findOneAndUpdate(
        { email: params.id },
        {
          $set: {
            ...params,
          },
        }
      );

      if (!update_validation_document) {
        throw new AppError(500, "Internal server error.");
      }

      return {
        id: params.id,
        name: `${validation_document.first_name} ${validation_document.last_name}`,
        verification_code,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  // REGISTER - VALIDATE TOKEN & COMPLETE REGISTERATION
  async validateRegisterationToken(params) {
    try {
      const { error } = validateOTP(params);

      if (error) {
        throw new AppError(400, error.details[0].message);
      }

      params.id = params.id.trim().toLowerCase();

      const validation_document = await lib.checkOTP({
        params: params,
        Model: validationModel,
        verification_type: "register",
      });

      // validate OTP
      if (!validation_document) {
        throw new AppError(498, "Invalid OTP.");
      }

      // check if verification code is expired
      const expiry_time = OTP.checkOTPExpiryTime(
        validation_document.is_verified.expires_in
      );

      if (!expiry_time) throw new AppError(498, "OTP Expired.");

      // complete registeration
      const user = await userModel.create({ ...validation_document });

      if (user) {
        await validationModel.findByIdAndDelete(validation_document.id);
      } else {
        throw new AppError(500, "Internal server error.");
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  // LOGIN
  async processLogin({ params, userExistFn }) {
    try {
      // find the user and include the password field
      const user_properties = "+password";
      const user = await userExistFn(params.id, user_properties);

      if (!user || !user.password) {
        throw new AppError(
          400,
          "Incorrect login credentials. Please check and try again."
        );
      }

      if (!user.status) throw new AppError(403, "Account restricted.");

      // validate password
      const valid_password = bcrypt.compareSync(params.password, user.password);

      if (!valid_password) {
        throw new AppError(
          400,
          "Incorrect login credentials. Please check and try again."
        );
      }

      user.password = null;
      const token = getToken(user);

      await storeSession(user._id, token);

      return {
        user,
        token,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async login(params) {
    const { error } = validateLogin(params);

    if (error) {
      throw new AppError(400, error.details[0].message);
    }

    params.id = params.id.trim().toLowerCase();

    const app_config = appMap[params.app];

    let userExistFn;

    if (app_config) {
      params.type = app_config.type;
      userExistFn = app_config.userExistFn;
    }

    const login = await lib.processLogin({
      params: params,
      userExistFn: userExistFn,
    });

    return login;
  },

  // FORGOT PASSWORD - GENERATE RESET PASSWORD VERIFICATION CODE
  async processGenerateResetPasswordToken({ id, Model }) {
    try {
      // generate a 4-digit random number as the verification code
      const verification_code = await OTP.generate(4, id, environment);

      // find the user by email and update the reset_password field
      const user = await Model.findOneAndUpdate(
        {
          $or: [{ email: id }, { phone: id }],
        },
        {
          reset_password: {
            token: verification_code,
            expires_in: moment().add(10, "m"), // 10 minutes
          },
        },
        { new: true }
      );

      if (!user) throw new AppError(404, "Account not found.");

      return {
        id,
        name: `${user.first_name} ${user.last_name}`,
        verification_code,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async generateResetPasswordToken(params) {
    const { error } = validateId(params);

    if (error) {
      throw new AppError(400, error.details[0].message);
    }

    params.id = params.id.trim().toLowerCase();

    const app_config = appMap[params.app];

    let Model;

    if (app_config) {
      params.type = app_config.type;
      Model = app_config.Model;
    }

    const generate_token = await lib.processGenerateResetPasswordToken({
      id: params.id,
      Model: Model,
    });

    return generate_token;
  },

  // CHECK OTP
  async checkOTP({ params, Model, verification_type = "reset" }) {
    try {
      //if it's a tracking pin
      const user = await Model.findOne({
        $or: [
          { email: params.id },
          { phone: params.id },
          { username: params.id },
        ],
      }).select("+reset_password.token +reset_password.expires_in");

      let token;

      if (verification_type === "reset") {
        token = user.reset_password.token;
      } else if (verification_type === "register") {
        token = user.is_verified.token;
      }

      const verify = await OTP.verify(token, params.verification_code);

      if (!verify) {
        throw new AppError(498, "Invalid OTP.");
      }

      let expiry_time = false;

      if (verification_type === "reset") {
        expiry_time = OTP.checkOTPExpiryTime(user.reset_password.expires_in);
      } else if (verification_type === "register") {
        expiry_time = OTP.checkOTPExpiryTime(user.is_verified.expires_in);
      }

      if (!expiry_time) {
        throw new AppError(498, "OTP Expired.");
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  // FORGOT PASSWORD - VALIDATE RESET PASSWORD OTP
  async validateResetPasswordToken(params) {
    const { error } = validateOTP(params);

    if (error) {
      throw new AppError(400, error.details[0].message);
    }

    params.id = params.id.trim().toLowerCase();

    const app_config = appMap[params.app];

    let Model;

    if (app_config) {
      params.type = app_config.type;
      Model = app_config.Model;
    }

    const validate_code = await lib.checkOTP({
      params: params,
      Model: Model,
      verification_type: "reset",
    });

    return validate_code;
  },

  // RESET PASSWORD
  async processPasswordReset({ params, Model }) {
    try {
      // validate token & get user
      const user = await lib.checkOTP({
        params: params,
        Model: Model,
        verification_type: "reset",
      });

      // hash the new password
      const hashed_password = bcrypt.hashSync(
        params.new_password,
        Number(salt_round)
      );

      // update user's password and clear reset_password fields
      const update_user = await Model.findByIdAndUpdate(user._id, {
        password: hashed_password,
        reset_password: {
          token: null,
          expires_in: null,
          reset_password_at: new Date(),
        },
      });

      if (!update_user) throw new AppError(500, "Internal server error.");

      return { id: params.id, name: `${user.first_name} ${user.last_name}` };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async resetPassword(params) {
    const { error } = validateResetPassword(params);

    if (error) {
      throw new AppError(400, error.details[0].message);
    }

    params.id = params.id.trim().toLowerCase();

    const app_config = appMap[params.app];

    let Model;

    if (app_config) {
      params.type = app_config.type;
      Model = app_config.Model;
    }

    const reset_password = await lib.processPasswordReset({
      params: params,
      Model: Model,
    });

    return reset_password;
  },

  // CHANGE PASSWORD
  async processChangePassword({ params, Model }) {
    try {
      const user = await Model.findOne({ email: params.email }).select(
        "+password"
      );

      if (!user) throw new AppError(404, "Resource not found.");

      // check if current password matches
      const is_current_password_match = bcrypt.compareSync(
        params.current_password,
        user.password
      );

      if (!is_current_password_match) {
        throw new AppError(400, "Current password is incorrect.");
      }

      // hash the new password
      const hash_password = bcrypt.hashSync(
        params.new_password,
        Number(salt_round)
      );

      // update user's password
      const update_password = await user.updateOne({
        password: hash_password,
      });

      if (!update_password) throw new AppError(500, "Internal server error.");

      return {
        email: params.email,
        name: `${user.first_name} ${user.last_name}`,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      } else {
        throw new AppError(500, "Internal server error.");
      }
    }
  },

  async changePassword(params) {
    const { error } = validateChangePassword(params);

    if (error) {
      throw new AppError(400, error.details[0].message);
    }

    const app_config = appMap[params.app];

    let Model;

    if (app_config) {
      params.type = app_config.type;
      Model = app_config.Model;
    }

    const password_change = await lib.processChangePassword({
      params: params,
      Model: Model,
    });

    return password_change;
  },
};

module.exports = lib;
