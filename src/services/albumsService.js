import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import InvariantError from '../exceptions/InvariantError.js';
import NotFoundError from '../exceptions/NotFound.js';

class AlbumsService {
  constructor(storage, chace) {
    this._pool = new Pool();
    this._storage = storage;
    this._cache = chace;
  }

  _albumKey(albumId) {
    return `album:detail:${albumId}`;
  }

  async addAlbum({ name, year } = {}) {
    const id = `album-${nanoid(16)}`;
    const now = new Date().toISOString();

    const query = {
      text: `INSERT INTO albums (id, name, year, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      values: [id, name, year, now, now],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0]?.id) throw new InvariantError('Album gagal ditambahkan');
    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const cached = await this._cache?.get(this._albumKey(id));
    if (cached) {
      const album = JSON.parse(cached);
      return album;
    }

    const { rows, rowCount } = await this._pool.query({
      text: 'SELECT id, name, year, cover AS "coverUrl" FROM albums WHERE id=$1',
      values: [id],
    });
    if (!rowCount) throw new NotFoundError('Album tidak ditemukan');

    const songs = await this._pool.query({
      text: 'SELECT id, title, performer FROM songs WHERE album_id=$1',
      values: [id],
    });

    const album = { ...rows[0], songs: songs.rows };

    await this._cache?.set(this._albumKey(id), JSON.stringify(album));
    return album;
  }

  async editAlbumById(id, { name, year } = {}) {
    const now = new Date().toISOString();
    const res = await this._pool.query({
      text: `UPDATE albums SET name=$1, year=$2, updated_at=$3
              WHERE id=$4 RETURNING id`,
      values: [name, year, now, id],
    });
    if (!res.rowCount) throw new NotFoundError('Album tidak ditemukan');
    await this._cache?.del(this._albumKey(id));
  }

  async deleteAlbumById(id) {
    const res = await this._pool.query({
      text: 'DELETE FROM albums WHERE id=$1 RETURNING id',
      values: [id],
    });
    if (!res.rowCount) throw new NotFoundError('Album tidak ditemukan');
    await this._cache?.del(this._albumKey(id));
  }

  async updateAlbumCoverUrlById(id, coverUrl) {
    const now = new Date().toISOString();
    const res = await this._pool.query({
      text: 'UPDATE albums SET cover=$1, updated_at=$2 WHERE id=$3 RETURNING id',
      values: [coverUrl, now, id],
    });
    if (!res.rowCount) throw new NotFoundError('Album tidak ditemukan');
    await this._cache?.del(this._albumKey(id));
  }

  async setAlbumCover(albumId, { stream, contentType }) {
    console.log(albumId);
    const { rows, rowCount } = await this._pool.query({
      text: 'SELECT cover FROM albums WHERE id=$1',
      values: [albumId],
    });
    if (!rowCount) throw new NotFoundError('Album tidak ditemukan');

    const oldCoverUrl = rows[0].cover;

    const key = this._storage.buildKeyForAlbumCover(albumId, contentType);
    const coverUrl = await this._storage.upload({ stream, contentType, key });
    console.log(coverUrl);

    await this.updateAlbumCoverUrlById(albumId, coverUrl);

    if (oldCoverUrl) {
      const oldKey = this._storage.extractKeyFromUrl
        ? this._storage.extractKeyFromUrl(oldCoverUrl)
        : null;
      if (oldKey && this._storage.delete) {
        try {
          await this._storage.delete(oldKey);
        } catch {
          /* ignore */
        }
      }
    }

    return coverUrl;
  }

  async verifyAlbumExists(albumId) {
    const { rowCount } = await this._pool.query({
      text: 'SELECT 1 FROM albums WHERE id=$1',
      values: [albumId],
    });
    if (!rowCount) throw new NotFoundError('Album tidak ditemukan');
  }

  async likeAlbum({ userId, albumId }) {
    await this.verifyAlbumExists(albumId);

    const exists = await this._pool.query({
      text: 'SELECT 1 FROM user_album_likes WHERE user_id=$1 AND album_id=$2',
      values: [userId, albumId],
    });
    if (exists.rowCount) throw new InvariantError('Anda sudah menyukai album ini');

    const id = `like-${nanoid(16)}`;
    await this._pool.query({
      text: 'INSERT INTO user_album_likes (id, user_id, album_id) VALUES ($1,$2,$3)',
      values: [id, userId, albumId],
    });

    await this._cache?.del(this._likesKey(albumId));
  }

  async unlikeAlbum({ userId, albumId }) {
    await this.verifyAlbumExists(albumId);
    const res = await this._pool.query({
      text: 'DELETE FROM user_album_likes WHERE user_id=$1 AND album_id=$2 RETURNING id',
      values: [userId, albumId],
    });
    if (!res.rowCount) throw new InvariantError('Anda belum menyukai album ini');

    await this._cache?.del(this._likesKey(albumId));
  }

  _likesKey(albumId) {
    return `album-likes:${albumId}`;
  }

  async getAlbumLikesCount(albumId) {
    await this.verifyAlbumExists(albumId);

    const cached = await this._cache?.get(this._likesKey(albumId));
    if (cached !== undefined && cached !== null) {
      return { likes: Number(cached), fromCache: true };
    }

    const { rows } = await this._pool.query({
      text: 'SELECT COUNT(*)::int AS likes FROM user_album_likes WHERE album_id=$1',
      values: [albumId],
    });
    const likes = rows[0]?.likes ?? 0;

    await this._cache?.set(this._likesKey(albumId), String(likes));
    return { likes, fromCache: false };
  }
}

export default AlbumsService;
