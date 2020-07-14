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
        name: 'user_bitcoin_wallets_user_email_fk',
        table: 'users',
        rules: {
          onDelete: 'RESTRICT',
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
        name: 'user_bitcoin_wallets_store_id_fk',
        table: 'user_btcpay_details',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'store_id'
      },
      primaryKey: true,
    },
    root_public_key: {type: 'string', length: 500, notNull: true},
    type: {type: 'string', length: 20, notNull: true},
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
  });
};

exports.down = function(db) {
  return db.dropTable('user_bitcoin_wallets');
};

exports._meta = {
  "version": 1
};
