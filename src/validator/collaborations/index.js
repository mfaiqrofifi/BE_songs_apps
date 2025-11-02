import InvariantError from '../../exceptions/InvariantError.js';
import CollaborationPayloadSchema from './schemas.js';

const CollaborationsValidator = {
  validateCollaborationPayload: (payload) => {
    const { error } = CollaborationPayloadSchema.validate(payload);
    if (error) throw new InvariantError(error.message);
  },
};
export default CollaborationsValidator;
