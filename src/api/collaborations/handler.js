import autoBind from 'auto-bind';

class CollaborationsHandler {
  constructor(collabService, playlistsService, validator) {
    this._collabService = collabService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    autoBind(this);
  }

  async postCollaborationHandler(request, h) {
    this._validator.validateCollaborationPayload(request.payload);
    const { playlistId, userId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    const collaborationId = await this._collabService.addCollaboration(
      playlistId,
      userId,
    );

    const response = h.response({
      status: 'success',
      data: { collaborationId },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request) {
    this._validator.validateCollaborationPayload(request.payload);
    const { playlistId, userId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    await this._collabService.deleteCollaboration(playlistId, userId);

    return { status: 'success', message: 'Kolaborator berhasil dihapus' };
  }
}

export default CollaborationsHandler;
