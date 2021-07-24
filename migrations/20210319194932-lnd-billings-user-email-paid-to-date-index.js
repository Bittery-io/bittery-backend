'use strict';

var dbm;
var type;
var seed;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db) {
  return db.addIndex(
      'lnd_billings',
      'lnd_billings_paid_to_date_index',
      ['user_email', 'paid_to_date']
  );
};

exports.down = function (db) {
  return db.removeIndex(
      'lnd_billings',
      'lnd_billings_paid_to_date_index'
  );
};

exports._meta = {
  version: 1,
};
