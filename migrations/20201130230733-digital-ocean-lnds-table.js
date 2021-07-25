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
  return db.createTable('digital_ocean_lnds', {
    lnd_id: {
      type: 'UUID',
      notNull: true,
      foreignKey: {
        name: 'digital_ocean_lnds_lnds_lnd_id_fk',
        table: 'lnds',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: 'lnd_id'
      },
    },
    droplet_id: { type: 'int', notNull: true, primaryKey: true, unique: true },
    droplet_name: { type: 'string', length: 100, notNull: true },
    droplet_ip: { type: 'string', length: 20, notNull: true, },
  });
};

exports.down = function(db) {
  return db.dropTable('digital_ocean_lnds');
};

exports._meta = {
  "version": 1
};
