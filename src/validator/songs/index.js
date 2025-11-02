import SongPayloadSchema from './schemas.js';
import InvariantError from '../../exceptions/InvariantError.js';

const SongsValidator = {
  validateSongPayload: (payload) => {
    const { error } = SongPayloadSchema.validate(payload);
    if (error) throw new InvariantError(error.message);
  },
};

export default SongsValidator;
