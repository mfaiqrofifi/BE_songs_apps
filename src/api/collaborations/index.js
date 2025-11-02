import routes from './routes.js';
import CollaborationsHandler from './handler.js';

export default {
  name: 'collaborations',
  version: '1.0.0',
  register: async (server, { collabService, playlistsService, validator }) => {
    const handler = new CollaborationsHandler(collabService, playlistsService, validator);
    server.route(routes(handler));
  },
};
