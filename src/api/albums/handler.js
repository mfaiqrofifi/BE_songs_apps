import autoBind from 'auto-bind';
import InvariantError from '../../exceptions/InvariantError.js';

class AlbumsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);

    const { name, year } = request.payload || {};
    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({ status: 'success', data: { albumId } });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return { status: 'success', data: { album } };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    const { name, year } = request.payload || {};
    await this._service.editAlbumById(id, { name, year });

    return { status: 'success', message: 'Album berhasil diperbarui' };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
    return { status: 'success', message: 'Album berhasil dihapus' };
  }

  async postAlbumCoverHandler(request, h) {
    const { id: albumId } = request.params;
    const { cover } = request.payload || {};
    if (!cover?.hapi) throw new InvariantError('Berkas cover wajib diunggah');

    const contentType = cover.hapi.headers['content-type'];
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(contentType))
      throw new InvariantError('Tipe berkas harus gambar (jpg/png/webp)');

    await this._service.setAlbumCover(albumId, { stream: cover, contentType });

    return h
      .response({ status: 'success', message: 'Sampul berhasil diunggah' })
      .code(201);
  }

  async postLikeAlbumHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;
    await this._service.likeAlbum({ userId, albumId });

    return h
      .response({ status: 'success', message: 'Berhasil menyukai album' })
      .code(201);
  }

  async deleteLikeAlbumHandler(request) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;
    await this._service.unlikeAlbum({ userId, albumId });
    return { status: 'success', message: 'Batal menyukai album' };
  }

  async getAlbumLikesHandler(request, h) {
    const { id: albumId } = request.params;
    const { likes, fromCache } = await this._service.getAlbumLikesCount(albumId);
    const response = h.response({ status: 'success', data: { likes } });
    if (fromCache) response.header('X-Data-Source', 'cache');
    return response;
  }
}

export default AlbumsHandler;
