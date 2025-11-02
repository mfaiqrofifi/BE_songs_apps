import Joi from 'joi';

export const PlaylistPayloadSchema = Joi.object({
  name: Joi.string().trim().required(),
});

export const PlaylistSongPayloadSchema = Joi.object({
  songId: Joi.string().trim().required(),
});
