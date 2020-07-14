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
  return db.createTable('notifications', {
    user_email: {
      type: 'string',
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'notifications_user_email_fk',
        table: 'users',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'email'
      },
    },
    notification_id: {type: 'string', primaryKey: true, notNull: true},
    notification_type: { type: 'string', length: 20, notNull: true },
    notification_reason: { type: 'string', length: 50, notNull: true },
    notification_send_date: { type: 'timestamp', timezone: true, notNull: true },
  });

};

exports.down = function(db) {
  return db.dropTable('notifications');
};

exports._meta = {
  "version": 1
};
