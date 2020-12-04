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
  return db.createTable('digital_ocean_failures', {
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
    droplet_id: { type: 'int', unique: true },
    droplet_name: { type: 'string', length: 100 },
    droplet_ip: { type: 'string', length: '20' },
    rtl_one_time_init_password: { type: 'string', length: 100, unique: true },
    hosted_lnd_type: { type: 'string', length: 20, notNull: true },
    creation_date: { type: 'timestamp', timezone: true, notNull: true },
    failed_deployment_stage: { type: 'string', length: 30, notNull:true },
  });
};

exports.down = function(db) {
  return db.dropTable('digital_ocean_failures');
};

exports._meta = {
  "version": 1
};
