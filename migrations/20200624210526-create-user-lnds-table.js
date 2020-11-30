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
  return db.createTable('user_lnds', {
    user_domain: {
      type: 'string',
      length: 500,
      primaryKey: true,
      foreignKey: {
        name: 'user_lnds_user_domain_fk',
        table: 'user_domains',
        rules: {
          onDelete: 'SET NULL',
          onUpdate: 'RESTRICT'
        },
        mapping: 'user_domain'
      },
    },
    lnd_type: { type: 'string', length:20, notNull: true }
  });
};

exports.down = function(db) {
  return db.dropTable('user_lnds');
};

exports._meta = {
  "version": 1
};
