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
  return db.createTable('rtls', {
    lnd_id: {
      type: 'UUID',
      primaryKey: true,
      notNull: true,
      foreignKey: {
        name: 'rtls_lnd_id_fk',
        table: 'lnds',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: 'lnd_id'
      },
    },
    rtl_one_time_init_password: { type: 'string', length: 100, notNull: true, unique: true },
    rtl_version: { type: 'string', length: 20, notNull: true }
  });
};

exports.down = function(db) {
  return db.dropTable('rtls');
};

exports._meta = {
  "version": 1
};
