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
      'user_encrypted_ln_artefacts',
      'user_encrypted_ln_artefacts_user_email_lnd_id_index',
      ['user_email', 'lnd_id']
  );
};

exports.down = function (db) {
  return db.removeIndex(
      'user_encrypted_ln_artefacts',
      'user_encrypted_ln_artefacts_user_email_lnd_id_index'
  );
};

exports._meta = {
  version: 1,
};
