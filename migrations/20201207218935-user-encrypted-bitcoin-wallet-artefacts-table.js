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
  return db.createTable('user_encrypted_bitcoin_wallet_artefacts', {
    user_email: {
      type: 'string',
      primaryKey: true,
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'user_encrypted_artefacts_user_email_fk',
        table: 'users',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'email'
      },
    },
    store_id: {
      type: 'string',
      length: 500,
      primaryKey: true,
      unique: true,
      notNull: true,
      foreignKey: {
        name: 'user_btcpay_details_store_id_fk',
        table: 'user_btcpay_details',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: 'store_id'
      },
    },
    standard_wallet_seed: { type: 'string', notNull: false },
  });
};

exports.down = function(db) {
  return db.dropTable('user_encrypted_bitcoin_wallet_artefacts');
};

exports._meta = {
  "version": 1
};
