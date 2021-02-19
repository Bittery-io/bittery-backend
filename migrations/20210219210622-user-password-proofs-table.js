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
  return db.createTable('user_password_proofs', {
    user_email: {
      type: 'string',
      primaryKey: true,
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'lnd_setup_backlog_user_email_fk',
        table: 'users',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'email'
      },
    },
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
    sha_256_password_proof: { type: 'string', length: 64,  notNull: true },
  });
};

exports.down = function(db) {
  return db.dropTable('user_password_proofs');
};

exports._meta = {
  "version": 1
};
