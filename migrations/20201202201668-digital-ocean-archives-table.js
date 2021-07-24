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
  return db.createTable('digital_ocean_archives', {
    lnd_id: {
      type: 'UUID',
      primaryKey: true,
      notNull: true,
      foreignKey: {
        name: 'digital_ocean_archives_lnds_lnd_id_fk',
        table: 'lnds',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: 'lnd_id'
      },
    },
    archive_date: { type: 'timestamp', timezone: true, notNull: true },
    backup_name: {type: 'string', length: 200, notNull: true},
  });
};

exports.down = function(db) {
  return db.dropTable('digital_ocean_archives');
};

exports._meta = {
  "version": 1
};
