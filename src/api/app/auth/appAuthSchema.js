import Joi from "joi";

export default {
  register: Joi.object({
    fullName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phoneNumber: Joi.string().pattern(/^\d+$/).required(), // Ensures only digits
  }),

  login: Joi.object({
    emailOrPhone: Joi.string().required(), // Allow either email or phone number
    password: Joi.string().required(),
  }),
};
