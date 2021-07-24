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
  return db.createTable('subscription_email_notifications', {
    user_email: {
      type: 'string',
      primaryKey: true,
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
    notification_id: {
      type: 'UUID',
      notNull: true,
      foreignKey: {
        name: 'subscription_email_notifications_notifications_id_fk',
        table: 'notifications',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
    lnd_billing_id: {
      type: 'UUID',
      notNull: true,
      primaryKey: true,
      foreignKey: {
        name: 'subscription_email_notifications_lnd_billings_billing_id_fk',
        table: 'lnd_billings',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'id'
      },
    },
  });

};

exports.down = function(db) {
  return db.dropTable('subscription_email_notifications');
};

exports._meta = {
  "version": 1
};
