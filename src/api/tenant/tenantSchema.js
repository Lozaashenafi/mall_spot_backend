import Joi from "joi";

export default {
  register: Joi.object({
    fullName: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10,15}$/) // Ensures phone number is between 10-15 digits
      .required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match.",
      }),
    mallId: Joi.number().integer().positive().required(),
  }),
};
