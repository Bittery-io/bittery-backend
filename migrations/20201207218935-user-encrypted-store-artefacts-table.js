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
  return db.createTable('user_encrypted_store_artefacts', {
    id: { type: 'UUID', notNull: true, primaryKey: true },
    user_email: {
      type: 'string',
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
    encrypted_store_artefact_type: { type: 'string', length: 50, notNull: false },
    encrypted_artefact: { type: 'string', notNull: false },
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
  });
};

exports.down = function(db) {
  return db.dropTable('user_encrypted_store_artefacts');
};

exports._meta = {
  "version": 1
};
