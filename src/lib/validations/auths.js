const Joi = require("joi");

exports.validateLogin = (users) => {
  const schema = Joi.object({
    id: Joi.string().required().email().messages({
      "any.required": "Email address is required.",
      "string.empty": "Email address is required.",
      "string.email": "Please provide a valid email address.",
    }),
    password: Joi.string().required().min(8).messages({
      "any.required": "Password is required.",
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters long.",
    }),
  }).unknown(true);

  return schema.validate(users);
};
exports.validateId = (users) => {
  const schema = Joi.object({
    id: Joi.string().required().email().messages({
      "any.required": "Email address is required.",
      "string.empty": "Email address is required.",
      "string.email": "Please provide a valid email address.",
    }),
  }).unknown(true);
  return schema.validate(users);
};

exports.validateOTP = (users) => {
  const schema = Joi.object({
    id: Joi.string().required().email().messages({
      "any.required": "Email address is required.",
      "string.empty": "Email address is required.",
      "string.email": "Please provide a valid email address.",
    }),
    verification_code: Joi.string().min(4).max(4).required().messages({
      "any.required": "Please provide your 4-digit verification code.",
      "string.empty": "Please provide your 4-digit verification code.",
      "string.min": "Invalid verification code.",
      "string.max": "Invalid verification code.",
    }),
  }).unknown(true);
  return schema.validate(users);
};

exports.validateResetPassword = (users) => {
  const schema = Joi.object({
    id: Joi.string().required().email().messages({
      "any.required": "Email address is required.",
      "string.empty": "Email address is required.",
      "string.email": "Please provide a valid email address.",
    }),
    verification_code: Joi.string().min(4).max(4).required().messages({
      "any.required": "Please provide your 4-digit verification code.",
      "string.empty": "Please provide your 4-digit verification code.",
      "string.min": "Invalid verification code.",
      "string.max": "Invalid verification code.",
    }),
    new_password: Joi.string().required().min(8).messages({
      "any.required": "New password is required.",
      "string.empty": "New password is required.",
      "string.min": "New password must be at least 8 characters long.",
    }),
    confirm_password: Joi.string()
      .valid(Joi.ref("new_password"))
      .required()
      .messages({
        "any.required": "Confirm new password.",
        "string.empty": "Confirm new password.",
        "any.only": "Password doesn't match.",
      }),
  }).unknown(true);
  return schema.validate(users);
};

exports.validateChangePassword = (users) => {
  const schema = Joi.object({
    email: Joi.string().required().email().messages({
      "any.required": "Email address is required.",
      "string.empty": "Email address is required.",
      "string.email": "Please provide a valid email address.",
    }),
    current_password: Joi.string().required().min(8).messages({
      "any.required": "Current password is required.",
      "string.empty": "Current password is required.",
      "string.min": "Current password must be at least 8 characters long.",
    }),
    new_password: Joi.string().required().min(8).messages({
      "any.required": "New password is required.",
      "string.empty": "New password is required.",
      "string.min": "New password must be at least 8 characters long.",
    }),
    confirm_password: Joi.string()
      .valid(Joi.ref("new_password"))
      .required()
      .messages({
        "any.required": "Confirm new password.",
        "string.empty": "Confirm new password.",
        "any.only": "Password doesn't match.",
      }),
  }).unknown(true);
  return schema.validate(users);
};
