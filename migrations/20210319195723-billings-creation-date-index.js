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
      'billings',
      'billings_creation_date_index',
      ['user_email', 'creation_date']
  );
};

exports.down = function (db) {
  return db.removeIndex(
      'billings',
      'billings_creation_date_index'
  );
};

exports._meta = {
  version: 1,
};
