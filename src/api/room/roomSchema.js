// Room Schema (roomschema.js)
import Joi from "joi";

const roomSchema = Joi.object({
  floorId: Joi.number().required(),
  categoryId: Joi.number().optional(),
  roomNumber: Joi.string().required(),
  care: Joi.number().required(),
  hasWindow: Joi.boolean().default(false),
  hasBalcony: Joi.boolean().default(false),
  hasAttachedBathroom: Joi.boolean().default(false),
  hasParkingSpace: Joi.boolean().default(false),
});

export default roomSchema;
