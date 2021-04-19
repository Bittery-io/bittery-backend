'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('lnd_static_channel_backups', {
    id: {type: 'UUID', notNull: true, primaryKey: true },
    lnd_id: {
      type: 'UUID',
      primaryKey: true,
      notNull: true,
      foreignKey: {
        name: 'lnd_static_channel_backups_lnd_id_fk',
        table: 'lnds',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: 'lnd_id'
      },
    },
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
    static_channel_backup_json_base64: { type: 'string', notNull: false },
    type: { type: 'string', length: 20, notNull: true },
    status: { type: 'string', length: 20, notNull: true },
    message: { type: 'string', length: 300, notNull: false },
  });
};

exports.down = function(db) {
  return db.dropTable('lnd_static_channel_backups');
};

exports._meta = {
  "version": 1
};
