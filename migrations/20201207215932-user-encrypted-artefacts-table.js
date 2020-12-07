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
  return db.createTable('user_encrypted_artefacts', {
    user_email: {
      type: 'string',
      primaryKey: true,
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'digital_ocean_failures_user_email_fk',
        table: 'users',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'email'
      },
    },
    lnd_id: {
      type: 'UUID',
      primaryKey: true,
      notNull: true,
      foreignKey: {
        name: 'rtls_lnd_id_fk',
        table: 'lnds',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: 'lnd_id'
      },
    },
    admin_macaroon: { type: 'string', notNull: true },
  });
};

exports.down = function(db) {
  return db.dropTable('user_encrypted_artefacts');
};

exports._meta = {
  "version": 1
};
