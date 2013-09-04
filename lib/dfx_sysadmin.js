/*
	DreamFace DFX System Administration
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

var sysdb_version = "1.0";

var mongoc = require('mongodb').MongoClient;

var MONGO_HOST = "localhost";
var MONGO_PORT = 27017;
var MONGO_DBNAME = "dreamface_sysdb";

var SysAdmin = function() {};

SysAdmin.getCloudRepository = function(callback) {
	mongoc.connect('mongodb://' + MONGO_HOST + ':' + MONGO_PORT + '/' + MONGO_DBNAME + '', function(err, db) {
		if (err) {
			return callback(err);
		} else {
            var settings = db.collection('settings');

            settings.findOne({name:"sysdb"}, function(find_err, settings_result) {
                if (find_err) {
                    return callback(find_err);
                } else {
                    if (settings_result!=null) {
                        var tenants = db.collection('tenants');
                        tenants.find().toArray( function(find_tenant_err, tenants_result) {
                            settings_result.tenants = tenants_result;
                            callback(null, settings_result );
                        });
                    } else {
                        callback(null, settings_result );
                    }
                }
            });
        }
	});
};

SysAdmin.initCloudRepository = function(callback) {
    SysAdmin.getCloudRepository( function( err, settings ) {
        if (settings===null) {
            mongoc.connect('mongodb://' + MONGO_HOST + ':' + MONGO_PORT + '/' + MONGO_DBNAME + '', function(m_err, db) {
                if (m_err) {
                    return callback(m_err);
                } else {
                    db.createCollection('tenants', function(err_tenants, tenants) {
                        db.createCollection('settings', function(err, collection){
                            collection.insert({'name': 'sysdb', 'datecreation': new Date(), 'version': sysdb_version}, {safe:true}, callback);
                        });
                    });
                }
            });
        } else {
            callback( 'repository already exists' );
        }
    });
};

SysAdmin.createTenant = function(req, callback) {
    mongoc.connect('mongodb://' + MONGO_HOST + ':' + MONGO_PORT + '/' + MONGO_DBNAME + '', function(m_err, db) {
        if (m_err) {
            return callback(m_err);
        } else {
            var tenants = db.collection('tenants');
            tenants.insert({'id': req.body.fldTenantID, 'datecreation': new Date()}, {safe:true}, function(err_ins) {
                SysAdmin.initTenantRepository(req, callback);
            });
        }
    });
};

SysAdmin.initTenantRepository = function( req, callback ) {
    mongoc.connect('mongodb://' + MONGO_HOST + ':' + MONGO_PORT + '/dreamface_' + req.body.fldTenantID + '', function(m_err, db) {
        if (m_err) {
            return callback(m_err);
        } else {
            db.createCollection('applications', function(err_app, application) {
                db.createCollection('screens', function(err_screen, application) {
                    db.createCollection('datawidgets', function(err_dw, application) {
                        callback(null);
                    });
                });
            });
        }
    });  
};

exports = module.exports = SysAdmin;