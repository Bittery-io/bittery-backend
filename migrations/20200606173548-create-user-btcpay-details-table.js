'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.up = function(db) {
  return db.createTable('user_btcpay_details', {
    store_id: {type: 'string', length: 200, primaryKey: true, unique: true },
    btcpay_user_merchant_token: {type: 'string', length: 1000, notNull: true},
    btcpay_user_private_key: {type: 'string', length: 1000, notNull: true},
    user_email: {
      type: 'string',
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'user_btcpay_details_user_email_fk',
        table: 'users',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'email'
      },
    },
  });
}

exports.down = function(db) {
  return db.dropTable('user_btcpay_details');
};

exports._meta = {
  "version": 1
};
