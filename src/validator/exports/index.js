import InvariantError from '../../exceptions/InvariantError.js';
import ExportPlaylistPayloadSchema from './schemas.js';

const ExportsValidator = {
  validateExportPlaylistPayload: (payload) => {
    const { error } = ExportPlaylistPayloadSchema.validate(payload);
    if (error) throw new InvariantError(error.message);
  },
};

export default ExportsValidator;
