const Joi = require("joi");

exports.validateAdd = (user) => {
  const schema = Joi.object({
    first_name: Joi.string().trim().required().messages({
      "any.required": "First name is required.",
      "string.empty": "First name is required.",
    }),
    last_name: Joi.string().trim().required().messages({
      "any.required": "Last name is required.",
      "string.empty": "Last name is required.",
    }),
    email: Joi.string().required().email().min(3).max(50).messages({
      "any.required": "Email address is required.",
      "string.empty": "Email address is required.",
      "string.email": "Please provide a valid email address.",
    }),
    role: Joi.string().valid("Admin", "Super Admin").required().messages({
      "any.required": "Select a role.",
      "string.empty": "Select a role.",
      "any.only": "Role must be either 'Admin' or 'Super Admin'.",
    }),
  }).unknown(true);

  return schema.validate(user);
};

exports.validateEdit = (user) => {
  const schema = Joi.object({
    first_name: Joi.string().trim().optional().messages({
      "string.empty": "First name cannot be empty.",
      "string.null": "First name cannot be null.",
    }),
    last_name: Joi.string().trim().optional().messages({
      "string.empty": "Last name cannot be empty.",
      "string.null": "Last name cannot be null.",
    }),
    email: Joi.string().optional().email().min(3).max(50).messages({
      "string.empty": "Email address cannot be empty.",
      "string.email": "Please provide a valid email address.",
    }),
    role: Joi.string().valid("Admin", "Super Admin").optional().messages({
      "string.empty": "Select a valid role.",
      "any.only": "Role must be either 'Admin' or 'Super Admin'.",
    }),
  }).unknown(true);

  return schema.validate(user);
};
