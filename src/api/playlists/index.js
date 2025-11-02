import routes from './routes.js';
import PlaylistsHandler from './handler.js';

export default {
  name: 'playlists',
  version: '1.0.0',
  register: async (server, { service, validator } = {}) => {
    const handler = new PlaylistsHandler(service, validator);
    server.route(routes(handler));
  },
};
