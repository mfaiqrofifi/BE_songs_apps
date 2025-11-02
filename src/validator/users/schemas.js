import Joi from 'joi';

const UserPayloadSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).required(),
  fullname: Joi.string().max(255).required(),
});

export default UserPayloadSchema;
