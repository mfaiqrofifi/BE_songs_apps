import Joi from 'joi';

const CollaborationPayloadSchema = Joi.object({
  playlistId: Joi.string().trim().required(),
  userId: Joi.string().trim().required(),
});

export default CollaborationPayloadSchema;
