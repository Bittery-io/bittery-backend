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
  return db.createTable('custom_lnds', {
    user_email: {
      type: 'string',
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'custom_lnds_user_email_fk',
        table: 'users',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'email'
      },
      primaryKey: true,
    },
    lnd_rest_address: { type: 'string', length: 200, notNull: true },
    macaroon_hex: { type: 'string', length: 1000, notNull: true },
    tls_cert: { type: 'string', length: 2000, notNull: true },
    tls_cert_thumbprint: { type: 'string', length: 300, notNull: true },
  });
};

exports.down = function(db) {
  return db.dropTable('custom_lnds');
};

exports._meta = {
  "version": 1
};
