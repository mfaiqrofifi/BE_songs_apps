/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('user_album_likes', {
    id: { type: 'VARCHAR(50)', primaryKey: true },
    user_id: { type: 'VARCHAR(50)', notNull: true },
    album_id: { type: 'VARCHAR(50)', notNull: true },
    created_at: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.addConstraint('user_album_likes', 'fk_ual_user', {
    foreignKeys: { columns: 'user_id', references: 'users(id)', onDelete: 'CASCADE' },
  });
  pgm.addConstraint('user_album_likes', 'fk_ual_album', {
    foreignKeys: { columns: 'album_id', references: 'albums(id)', onDelete: 'CASCADE' },
  });

  pgm.addConstraint('user_album_likes', 'unique_user_album', {
    unique: ['user_id', 'album_id'],
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('user_album_likes');
};
