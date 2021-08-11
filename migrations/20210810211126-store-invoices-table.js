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
  return db.createTable('store_invoices', {
    invoice_id: { type: 'string', length: 100, notNull: true, primaryKey: true },
    store_id: {
      type: 'string',
      length: 500,
      notNull: true,
      foreignKey: {
        name: 'store_invoices_store_id_fk',
        table: 'user_btcpay_details',
        rules: {
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        },
        mapping: 'store_id'
      },
      primaryKey: true,
    },
    order_id: { type: 'string', length: 100, notNull: true },
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
  });
};

exports.down = function(db) {
  return db.dropTable('store_invoices');
};

exports._meta = {
  "version": 1
};
