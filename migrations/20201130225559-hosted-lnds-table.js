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
  return db.createTable('hosted_lnds', {
    lnd_id: {
      primaryKey: true,
      type: 'UUID',
      notNull: true,
      foreignKey: {
        name: 'hosted_lnds_lnd_id_fk',
        table: 'lnds',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: 'lnd_id'
      },
    },
    hosted_lnd_type: { type: 'string', length: 20, notNull: true },
    hosted_lnd_provider: { type: 'string', length: 20, notNull: true },
    wumboChannels: { type: 'boolean', notNull: true, },
    lnAlias: { type: 'string', length: 32 },
  });
};

exports.down = function(db) {
  return db.dropTable('hosted_lnds');
};

exports._meta = {
  "version": 1
};
