// mallSchema.js
import Joi from "joi";

const mallSchema = {
  register: Joi.object({
    mallName: Joi.string().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    address: Joi.string().required(),
    description: Joi.string().allow("").optional(),
    totalFloors: Joi.number().integer().min(1).required(),
    totalRooms: Joi.number().integer().min(1).required(),
    mainImage: Joi.any().optional(), // Allow images
    secondaryImage: Joi.any().optional(),
    tertiaryImage: Joi.any().optional(),
    // Add these three new fields
    userFullName: Joi.string().required(),
    userEmail: Joi.string().email().required(),
    userPassword: Joi.string().min(6).required(),
  }),
};

export default mallSchema;
