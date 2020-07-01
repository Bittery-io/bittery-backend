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
  return db.createTable('user_bitcoin_wallets', {
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
    store_id: {
      type: 'string',
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'user_wallets_user_btcpay_details_store_id',
        table: 'user_btcpay_details',
        rules: {
          onDelete: 'SET NULL',
          onUpdate: 'RESTRICT'
        },
        mapping: 'store_id'
      },
      primaryKey: true,
    },
    root_public_key: {type: 'string', length: 500, notNull: true},
    bip: {type: 'string', length: 10, notNull: true},
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
  });
};

exports.down = function(db) {
  return db.dropTable('user_bitcoin_wallets');
};

exports._meta = {
  "version": 1
};
