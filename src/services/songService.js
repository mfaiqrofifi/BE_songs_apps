import { Pool } from 'pg';
import { nanoid } from 'nanoid';
import InvariantError from '../exceptions/InvariantError.js';
import NotFoundError from '../exceptions/NotFound.js';

const mapSongRow = ({ albumId, ...row }) => ({ ...row, albumId: albumId ?? null });

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({ title, year, genre, performer, duration = null, albumId = null } = {}) {
    const id = `song-${nanoid(16)}`;
    const now = new Date().toISOString();

    const query = {
      text: `INSERT INTO songs
             (id, title, year, genre, performer, duration, album_id, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             RETURNING id`,
      values: [id, title, year, genre, performer, duration, albumId, now, now],
    };

    try {
      const { rows } = await this._pool.query(query);
      if (!rows[0]?.id) throw new InvariantError('Lagu gagal ditambahkan');
      return rows[0].id;
    } catch (e) {
      if (e.code === '23503') throw new InvariantError('albumId tidak ditemukan');
      throw new InvariantError('Lagu gagal ditambahkan');
    }
  }

  async getSongs({ title, performer } = {}) {
    const params = [];
    let text = 'SELECT id, title, performer FROM songs WHERE 1=1';

    if (title) {
      params.push(`%${title}%`);
      text += ` AND title ILIKE $${params.length}`;
    }
    if (performer) {
      params.push(`%${performer}%`);
      text += ` AND performer ILIKE $${params.length}`;
    }

    text += ' ORDER BY id';

    const { rows } = await this._pool.query({ text, values: params });
    return rows;
  }

  async getSongById(id) {
    const { rows, rowCount } = await this._pool.query({
      text: `SELECT id, title, year, genre, performer, duration, album_id
             FROM songs WHERE id=$1`,
      values: [id],
    });
    if (rowCount === 0) throw new NotFoundError('Lagu tidak ditemukan');
    return mapSongRow(rows[0]);
  }

  async editSongById(
    id,
    { title, year, genre, performer, duration = null, albumId = null } = {},
  ) {
    const now = new Date().toISOString();
    try {
      const res = await this._pool.query({
        text: `UPDATE songs
               SET title=$1, year=$2, genre=$3, performer=$4,
                   duration=$5, album_id=$6, updated_at=$7
               WHERE id=$8
               RETURNING id`,
        values: [title, year, genre, performer, duration, albumId, now, id],
      });
      if (!res.rowCount) throw new NotFoundError('Lagu tidak ditemukan');
    } catch (e) {
      if (e.code === '23503') throw new InvariantError('albumId tidak ditemukan');
      throw e;
    }
  }

  async deleteSongById(id) {
    const res = await this._pool.query({
      text: 'DELETE FROM songs WHERE id=$1 RETURNING id',
      values: [id],
    });
    if (!res.rowCount) throw new NotFoundError('Lagu tidak ditemukan');
  }
}

export default SongsService;
