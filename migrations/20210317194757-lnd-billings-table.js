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
  return db.createTable('lnd_billings', {
    id: {type: 'UUID', notNull: true, primaryKey: true},
    user_email: {
      type: 'string',
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'billings_user_email_fk',
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
      notNull: true,
      foreignKey: {
        name: 'lnd_billings_lnds_lnd_id_fk',
        table: 'lnds',
        rules: {
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        mapping: 'lnd_id'
      },
    },
    invoice_id: { type: 'string', length: 100, notNull: true },
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
    paid_to_date: { type: 'timestamp', timezone: true, notNull: true },
    status: { type: 'string', length: 20, notNull: true },
  });
};

exports.down = function(db) {
  return db.dropTable('lnd_billings');
};

exports._meta = {
  "version": 1
};
