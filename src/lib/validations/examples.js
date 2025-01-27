const Joi = require("joi");

exports.validateAddOrEdit = (model) => {
  const schema = Joi.object({
    title: Joi.string().required().messages({
      "any.required": "Title is required.",
      "string.empty": "Title is required.",
    }),
    description: Joi.string().required().messages({
      "any.required": "Description is required.",
      "string.empty": "Description is required.",
    }),
  }).unknown(true);
  return schema.validate(model);
};
