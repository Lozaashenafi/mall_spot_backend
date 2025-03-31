import Joi from "joi";

export default {
  addPost: Joi.object({
    mallId: Joi.number().integer().required(),
    roomId: Joi.number().integer().required(),
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().allow(null, "").max(500),
    price: Joi.number().positive().allow(null),
    bidDeposit: Joi.number().positive().allow(null),
    bidEndDate: Joi.date().allow(null),
    userId: Joi.number().integer().required(),
    status: Joi.string().valid("PENDING", "INVISIBLE").optional(),
  }),

  getPostById: Joi.object({
    id: Joi.number().integer().required(),
  }),
};
