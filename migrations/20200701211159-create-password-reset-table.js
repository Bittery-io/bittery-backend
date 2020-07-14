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
  return db.createTable('password_resets', {
    user_email: {
      type: 'string',
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'password_resets_user_email_fk',
        table: 'users',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'email'
      },
      primaryKey: true,
    },
    message_id: {type: 'string', notNull: true},
    password_reset_key: { type: 'string', length: 1000, notNull: true, primaryKey: true },
    reset_done: {type: 'boolean', notNull: true},
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
    reset_done_date: { type: 'timestamp', timezone: true, notNull: false, },
  });
};

exports.down = function(db) {
  return db.dropTable('password_resets');
};

exports._meta = {
  "version": 1
};
