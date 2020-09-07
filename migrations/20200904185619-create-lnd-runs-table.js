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
  return db.createTable('lnd_runs', {
    user_domain: {
      type: 'string',
      length: 500,
      primaryKey: true,
      foreignKey: {
        name: 'user_rtls_user_domain_fk',
        table: 'user_domains',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'user_domain'
      },
    },
    run_start_date: { type: 'timestamp', timezone: true, notNull: true },
  });};

exports.down = function(db) {
  return db.dropTable('lnd_runs');
};

exports._meta = {
  "version": 1
};
