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
  return db.createTable('lnds', {
    lnd_id: { type: 'UUID', primaryKey: true },
    user_email: {
      type: 'string',
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'lnds_user_email_fk',
        table: 'users',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'email'
      },
    },
    lnd_ip_address: { type: 'string', length: 500, notNull: true },
    lnd_rest_address: { type: 'string', length: 200, notNull: true },
    macaroon_hex: { type: 'string', length: 1000 },
    tls_cert: { type: 'string', length: 2000, notNull: true },
    tls_cert_thumbprint: { type: 'string', length: 300, notNull: true },
    lnd_version: { type: 'string', length: 20, notNull: true },
    lnd_type: { type: 'string', length: 20, notNull: true },
    creation_date: { type: 'timestamp', timezone: true, notNull: true }
  });
};

exports.down = function(db) {
  return db.dropTable('lnds');
};

exports._meta = {
  "version": 1
};
