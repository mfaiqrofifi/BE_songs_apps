import Hapi from '@hapi/hapi';
import 'dotenv/config';

import Jwt from '@hapi/jwt';
import albums from './api/albums/index.js';
import songs from './api/songs/index.js';
import users from './api/users/index.js';

import AlbumsService from './services/albumsService.js';
import SongsService from './services/songService.js';
import UsersService from './services/userServices.js';

import ClientError from './exceptions/ClientError.js';
import AlbumsValidator from './validator/albums/index.js';
import SongsValidator from './validator/songs/index.js';
import UsersValidator from './validator/users/index.js';
import collaborations from './api/collaborations/index.js';

import authentications from './api/authentication/index.js';
import AuthenticationsService from './services/authenticationService.js';
import TokenManager from './tokenize/TokenManager.js';
import AuthenticationsValidator from './validator/authentication/index.js';
import CollaborationsValidator from './validator/collaborations/index.js';
import PlaylistsService from './services/playlistService.js';
import playlists from './api/playlists/index.js';
import PlaylistsValidator from './validator/playlist/index.js';
import CollaborationsService from './services/collaborationService.js';
import ActivitiesService from './services/playlistActivitiesService.js';

import exports from './api/exports/index.js';
import ProducerService from './services/producerservice.js';
import ExportsValidator from './validator/exports/index.js';

import S3StorageService from './services/storageService.js';
import CacheService from './services/cacheService.js';

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT ?? 5000,
    host:
      process.env.HOST ??
      (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'),
    routes: { cors: { origin: ['*'] } },
  });

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;
    if (!(response instanceof Error)) return h.continue;

    if (response instanceof ClientError) {
      return h
        .response({
          status: 'fail',
          message: response.message || 'Permintaan tidak valid',
        })
        .code(response.statusCode);
    }

    if (response.isJoi) {
      return h
        .response({ status: 'fail', message: response.message || 'Data tidak valid' })
        .code(400);
    }

    if (response.isBoom) {
      const { statusCode } = response.output;
      if (statusCode === 404) {
        return h
          .response({ status: 'fail', message: 'Resource tidak ditemukan' })
          .code(404);
      }
      if (statusCode >= 400 && statusCode < 500) {
        return h
          .response({
            status: 'fail',
            message: response.message || 'Permintaan tidak valid',
          })
          .code(statusCode);
      }
    }
    return h
      .response({ status: 'error', message: 'Maaf, terjadi kegagalan pada server kami.' })
      .code(500);
  });

  const cache = new CacheService();
  const storage = new S3StorageService({ publicReadAcl: false });
  const collaborationsService = new CollaborationsService();
  const albumsService = new AlbumsService(storage, cache);
  const songsService = new SongsService();
  const userService = new UsersService();
  const authenticationsService = new AuthenticationsService();
  const activitiesService = new ActivitiesService();
  const playlistsService = new PlaylistsService(collaborationsService, activitiesService);

  await server.register(Jwt);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  server.route({ method: 'GET', path: '/', handler: () => ({ status: 'ok' }) });

  await server.register([
    {
      plugin: albums,
      options: { service: albumsService, validator: AlbumsValidator },
    },
    {
      plugin: songs,
      options: { service: songsService, validator: SongsValidator },
    },
    {
      plugin: users,
      options: { service: userService, validator: UsersValidator },
    },
    {
      plugin: authentications,
      options: {
        userService,
        authenticationsService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlists,
      options: {
        service: playlistsService,
        validator: PlaylistsValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collabService: collaborationsService,
        playlistsService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: exports,
      options: {
        producerService: ProducerService,
        playlistsService,
        validator: ExportsValidator,
      },
    },
  ]);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init().catch((err) => {
  console.error('Gagal start server:', err);
  process.exit(1);
});
