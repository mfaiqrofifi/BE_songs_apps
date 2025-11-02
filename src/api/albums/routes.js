const routes = (handler) => [
  { method: 'POST', path: '/albums', handler: handler.postAlbumHandler },
  { method: 'GET', path: '/albums/{id}', handler: handler.getAlbumByIdHandler },
  { method: 'PUT', path: '/albums/{id}', handler: handler.putAlbumByIdHandler },
  { method: 'DELETE', path: '/albums/{id}', handler: handler.deleteAlbumByIdHandler },
  {
    method: 'POST',
    path: '/albums/{id}/covers',
    handler: handler.postAlbumCoverHandler,
    options: {
      payload: {
        maxBytes: 512000,
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
      },
    },
  },
  {
    method: 'POST',
    path: '/albums/{id}/likes',
    handler: handler.postLikeAlbumHandler,
    options: { auth: 'openmusic_jwt' },
  },
  {
    method: 'DELETE',
    path: '/albums/{id}/likes',
    handler: handler.deleteLikeAlbumHandler,
    options: { auth: 'openmusic_jwt' },
  },
  {
    method: 'GET',
    path: '/albums/{id}/likes',
    handler: handler.getAlbumLikesHandler,
    options: { auth: false },
  },
];

export default routes;
