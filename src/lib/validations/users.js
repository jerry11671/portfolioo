const Joi = require("joi");

exports.validateEdit = (user) => {
  const schema = Joi.object({
    first_name: Joi.string().trim().optional().messages({
      "string.empty": "First name cannot be an empty string.",
    }),
    last_name: Joi.string().trim().optional().messages({
      "string.empty": "Last name cannot be an empty string.",
    }),
    phone: Joi.string()
      .optional()
      .regex(/^[0-9\+\-\(\)\s]+$/)
      .min(5)
      .max(20)
      .messages({
        "string.empty": "Phone number cannot be an empty string.",
        "string.pattern.base": "Invalid phone number format.",
        "string.min": "Phone number is too short.",
        "string.max": "Phone number is too long.",
      }),
    email: Joi.string().optional().email().min(3).max(50).messages({
      "string.empty": "Email address cannot be an empty string.",
      "string.email": "Please provide a valid email address.",
    }),
  }).unknown(true);

  return schema.validate(user);
};
