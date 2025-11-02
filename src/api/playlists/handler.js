import autoBind from 'auto-bind';

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._service.addPlaylist({ name, owner: credentialId });

    const response = h.response({ status: 'success', data: { playlistId } });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;

    let playlists;
    if (typeof this._service.getPlaylistsByUser === 'function') {
      playlists = await this._service.getPlaylistsByUser(credentialId);
    } else {
      playlists = await this._service.getPlaylistsByOwner(credentialId);
    }

    return { status: 'success', data: { playlists } };
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(id, credentialId);
    await this._service.deletePlaylistById(id);

    return { status: 'success', message: 'Playlist berhasil dihapus' };
  }

  async postSongToPlaylistHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);

    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    if (this._service.verifyPlaylistAccess) {
      await this._service.verifyPlaylistAccess(playlistId, credentialId);
    } else {
      await this._service.verifyPlaylistOwner(playlistId, credentialId);
    }

    await this._service.verifySongExists?.(songId);

    await this._service.addSongToPlaylist(playlistId, songId, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async getSongsFromPlaylistHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    if (this._service.verifyPlaylistAccess) {
      await this._service.verifyPlaylistAccess(playlistId, credentialId);
    } else {
      await this._service.verifyPlaylistOwner(playlistId, credentialId);
    }

    const playlist = await this._service.getPlaylistWithSongs(playlistId);
    return { status: 'success', data: { playlist } };
  }

  async deleteSongFromPlaylistHandler(request) {
    this._validator.validatePlaylistSongPayload(request.payload);

    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    if (this._service.verifyPlaylistAccess) {
      await this._service.verifyPlaylistAccess(playlistId, credentialId);
    } else {
      await this._service.verifyPlaylistOwner(playlistId, credentialId);
    }

    await this._service.deleteSongFromPlaylist(playlistId, songId, credentialId);

    return { status: 'success', message: 'Lagu berhasil dihapus dari playlist' };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    if (this._service.verifyPlaylistAccess) {
      await this._service.verifyPlaylistAccess(playlistId, credentialId);
    } else {
      await this._service.verifyPlaylistOwner(playlistId, credentialId);
    }

    const activities = await this._service.getPlaylistActivities(playlistId);
    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

export default PlaylistsHandler;
