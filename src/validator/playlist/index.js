import InvariantError from '../../exceptions/InvariantError.js';
import { PlaylistPayloadSchema, PlaylistSongPayloadSchema } from './schemas.js';

const PlaylistsValidator = {
  validatePlaylistPayload: (payload) => {
    const { error } = PlaylistPayloadSchema.validate(payload);
    if (error) throw new InvariantError(error.message);
  },

  validatePlaylistSongPayload: (payload) => {
    const { error } = PlaylistSongPayloadSchema.validate(payload);
    if (error) throw new InvariantError(error.message);
  },
};

export default PlaylistsValidator;
