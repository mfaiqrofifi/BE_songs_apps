import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import InvariantError from '../exceptions/InvariantError.js';
import NotFoundError from '../exceptions/NotFound.js';
import AuthorizationError from '../exceptions/AuthorizationError.js';

class PlaylistsService {
  constructor(collaborationsService = null, activitiesService = null) {
    this._pool = new Pool();
    this._collab = collaborationsService;
    this._activities = activitiesService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const now = new Date().toISOString();

    const query = {
      text: `
        INSERT INTO playlists (id, name, owner, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING id
      `,
      values: [id, name, owner, now, now],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0]?.id) throw new InvariantError('Playlist gagal ditambahkan');
    return result.rows[0].id;
  }

  async getPlaylistsByOwner(userId) {
    const { rows } = await this._pool.query({
      text: `
        SELECT p.id, p.name, u.username
        FROM playlists p
        JOIN users u ON u.id = p.owner
        WHERE p.owner = $1
        UNION
        SELECT p.id, p.name, u.username
        FROM collaborations c
        JOIN playlists p ON p.id = c.playlist_id
        JOIN users u ON u.id = p.owner
        WHERE c.user_id = $1
        ORDER BY name ASC
      `,
      values: [userId],
    });
    return rows;
  }

  async deletePlaylistById(id) {
    const res = await this._pool.query({
      text: 'DELETE FROM playlists WHERE id=$1 RETURNING id',
      values: [id],
    });
    if (!res.rowCount) throw new NotFoundError('Playlist tidak ditemukan');
  }

  async verifyPlaylistOwner(playlistId, userId) {
    const { rows, rowCount } = await this._pool.query({
      text: 'SELECT owner FROM playlists WHERE id=$1',
      values: [playlistId],
    });

    if (!rowCount) throw new NotFoundError('Playlist tidak ditemukan');
    if (rows[0].owner !== userId)
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (err) {
      if (err instanceof AuthorizationError && this._collab) {
        await this._collab.verifyCollaborator(playlistId, userId);
      } else {
        throw err;
      }
    }
  }

  async verifySongExists(songId) {
    const { rowCount } = await this._pool.query({
      text: 'SELECT 1 FROM songs WHERE id=$1',
      values: [songId],
    });
    if (!rowCount) throw new NotFoundError('Lagu tidak ditemukan');
  }

  async addSongToPlaylist(playlistId, songId, userId) {
    await this._assertPlaylistExists(playlistId);
    await this.verifySongExists(songId);

    const id = `playlistSong-${nanoid(16)}`;
    try {
      await this._pool.query({
        text: `
          INSERT INTO playlist_songs (id, playlist_id, song_id, created_at)
          VALUES ($1,$2,$3,$4)
        `,
        values: [id, playlistId, songId, new Date().toISOString()],
      });
    } catch (err) {
      if (err.code === '23505') {
        throw new InvariantError('Lagu sudah ada di playlist');
      }
      throw err;
    }

    await this._activities?.addActivity({ playlistId, songId, userId, action: 'add' });
  }

  async deleteSongFromPlaylist(playlistId, songId, userId) {
    const res = await this._pool.query({
      text: `
        DELETE FROM playlist_songs
        WHERE playlist_id=$1 AND song_id=$2
        RETURNING id
      `,
      values: [playlistId, songId],
    });
    if (!res.rowCount) throw new NotFoundError('Lagu di playlist tidak ditemukan');

    await this._activities?.addActivity({ playlistId, songId, userId, action: 'delete' });
  }

  async getPlaylistWithSongs(playlistId) {
    const header = await this._pool.query({
      text: `
        SELECT p.id, p.name, u.username
        FROM playlists p
        JOIN users u ON u.id = p.owner
        WHERE p.id = $1
      `,
      values: [playlistId],
    });

    if (!header.rowCount) throw new NotFoundError('Playlist tidak ditemukan');

    const songs = await this._pool.query({
      text: `
        SELECT s.id, s.title, s.performer
        FROM playlist_songs ps
        JOIN songs s ON s.id = ps.song_id
        WHERE ps.playlist_id = $1
        ORDER BY ps.created_at ASC
      `,
      values: [playlistId],
    });

    return {
      ...header.rows[0],
      songs: songs.rows || [],
    };
  }

  async getPlaylistActivities(playlistId) {
    if (!this._activities) throw new InvariantError('Fitur aktivitas belum tersedia');
    return this._activities.getActivities(playlistId);
  }

  async _assertPlaylistExists(playlistId) {
    const { rowCount } = await this._pool.query({
      text: 'SELECT 1 FROM playlists WHERE id=$1',
      values: [playlistId],
    });
    if (!rowCount) throw new NotFoundError('Playlist tidak ditemukan');
  }
}

export default PlaylistsService;
