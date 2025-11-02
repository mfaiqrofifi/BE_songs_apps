import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import InvariantError from '../exceptions/InvariantError.js';
import AuthorizationError from '../exceptions/AuthorizationError.js';
import NotFoundError from '../exceptions/NotFound.js';

class CollaborationsService {
  constructor() {
    this._pool = new Pool();
  }

  async _ensureUserExists(userId) {
    const { rowCount } = await this._pool.query({
      text: 'SELECT 1 FROM users WHERE id=$1',
      values: [userId],
    });
    if (!rowCount) throw new NotFoundError('User tidak ditemukan');
  }

  async _ensurePlaylistExists(playlistId) {
    const { rowCount } = await this._pool.query({
      text: 'SELECT 1 FROM playlists WHERE id=$1',
      values: [playlistId],
    });
    if (!rowCount) throw new NotFoundError('Playlist tidak ditemukan');
  }

  async addCollaboration(playlistId, userId) {
    await this._ensurePlaylistExists(playlistId);
    await this._ensureUserExists(userId);

    const id = `collab-${nanoid(16)}`;
    try {
      await this._pool.query({
        text: `INSERT INTO collaborations (id, playlist_id, user_id, created_at)
               VALUES ($1,$2,$3,$4)`,
        values: [id, playlistId, userId, new Date().toISOString()],
      });
    } catch (e) {
      if (e.code === '23505') throw new InvariantError('Kolaborator sudah terdaftar');
      throw e;
    }
    return id;
  }

  async deleteCollaboration(playlistId, userId) {
    const res = await this._pool.query({
      text: `DELETE FROM collaborations WHERE playlist_id=$1 AND user_id=$2 RETURNING id`,
      values: [playlistId, userId],
    });
    if (!res.rowCount) throw new NotFoundError('Kolaborator tidak ditemukan');
  }

  async verifyCollaborator(playlistId, userId) {
    const { rowCount } = await this._pool.query({
      text: `SELECT 1 FROM collaborations WHERE playlist_id=$1 AND user_id=$2`,
      values: [playlistId, userId],
    });
    if (!rowCount)
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
  }
}

export default CollaborationsService;
