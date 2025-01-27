const Joi = require("joi");

exports.validateSendPush = (model) => {
  const schema = Joi.object({
    title: Joi.string().required().messages({
      "any.required": "Title is required.",
      "string.empty": "Title is required.",
    }),
    description: Joi.string().required().messages({
      "any.required": "Description is required.",
      "string.empty": "Description is required.",
    }),
    device_id: Joi.string().required().messages({
      "any.required": "Device ID is required.",
      "string.empty": "Device ID is required.",
    }),
    metadata: Joi.object({
      type: Joi.string().required().messages({
        "any.required": "Metadata type is required.",
        "string.empty": "Metadata type is required.",
      }),
    })
      .required()
      .messages({
        "any.required": "Metadata is required.",
      }),
  }).unknown(true);

  return schema.validate(model);
};
