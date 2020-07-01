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
  return db.createTable('users_confirmations', {
    user_email: {
      type: 'string',
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'user_wallets_user_users_email',
        table: 'users',
        rules: {
          onDelete: 'SET NULL',
          onUpdate: 'RESTRICT'
        },
        mapping: 'email'
      },
      primaryKey: true,
    },
    sign_up_key: {type: 'UUID', notNull: true, primaryKey: true},
    message_id: {type: 'string', notNull: true},
    confirmed: {type: 'boolean', notNull: true},
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
    confirmation_date: { type: 'timestamp', timezone: true, notNull: false, },
  });

};

exports.down = function(db) {
  return db.dropTable('users_confirmations');
};

exports._meta = {
  "version": 1
};
