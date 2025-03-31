import Joi from "joi";

export default {
  register: Joi.object({
    fullName: Joi.string().required(), // Renamed from 'name' to 'fullName' for consistency
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};
