import routes from './routes.js';
import SongsHandler from './handler.js';

export default {
  name: 'songs',
  version: '1.0.0',
  register: async (server, { service, validator } = {}) => {
    const handler = new SongsHandler(service, validator);
    server.route(routes(handler));
  },
};
