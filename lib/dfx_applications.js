/*
	DreamFace DFX Applications
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

var mongoc = require('mongodb').MongoClient;
var fs = require('fs');

var screens = require('./dfx_screens');
var errors = require('./dfx_errors');

var MONGO_HOST = "localhost";
var MONGO_PORT = 27017;

var Application = function() {};

Application.getDb = function(req, db, callback) {
    if (!db) {
        mongoc.connect('mongodb://' + MONGO_HOST + ':' + MONGO_PORT + '/dreamface_' + req.session.tenant.id + '', function(err, db) {
            if (err) {
                errors.DEFAULT_MONGO(err, req).notifySession();
                return callback(err, null);
            }
            callback(null, db);
        });
        return;
    }
    callback(null, db);
};

Application.getAll = function(req, callback, db) {
    Application.getDb(req, db, function(err, db) {
        var applications = db.collection('applications');
        applications.find({
            "visibility": "visible"
        }).toArray(function(err, app_results) {
            if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
            return callback(err, app_results);
        });
    });
};

Application.get = function(appname, req, callback, db) {
    Application.getDb(req, db, function(err, db) {
        var applications = db.collection('applications');

        applications.findOne({
            "name": appname
        }, function(err, app_item) {
            if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
            return callback(err, app_item);
        });
    });

};

/*
    Get the full application definition including its associated screens
*/
Application.getFullDefinition = function(appname, req, callback, db) {
    Application.getDb(req, db, function(err, db) {
        var applications = db.collection('applications');

        applications.findOne({
            "name": appname
        }, function(err, app_item) {
            if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
            var screens = db.collection('screens');
            screens.find({
                "application": appname
            }).toArray( function(err_screens, screen_items) {
                if (err_screens) errors.DEFAULT_APPLICATION(err_screens, req).notifySession();
                
                var screens_tree = new Array();
                
                var i=0;
                var hasMoreScreen = false;
                do {
                    var hasMoreScreen = false;
                    for (i=0; i<screen_items.length; i++) {
                        var screen_item = screen_items[i];
                        if (screen_item._status==null || screen_item._status==0) {
                            if (screen_item.parentname==null) {
                                screen_item.children = [];
                                screens_tree.push( screen_item );
                                screen_item._status = 1;
                            } else {
                                var parent_item = Application._getScreenItem( screen_item.parentname, screens_tree );
                                if (parent_item!=null) {
                                    screen_item._status = 1;
                                    screen_item.children = [];
                                    parent_item.children.push( screen_item );
                                } else {
                                    screen_item._status = 0;
                                    hasMoreScreen = true;
                                }
                            }
                        }
                    }
                    
                } while (hasMoreScreen);
                app_item.screens = screens_tree;
                return callback(err, app_item);
            });
        });
    });

};

Application.set = function(appname, fields, req, callback, db) {
    Application.getDb(req, db, function(err, db) {
        var applications = db.collection('applications');

        applications.update({
            name: appname
        }, {
            $set: fields
        }, function(err, app) {
            if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
            return callback(err, app);
        });
    });
};

Application.addDefaultGithub = function(appname, tenantid, callback, db) {
    set(appname, {
        github: {
            "token": "",
            "username": "",
            "repository": ""
        }
    }, tenantid, callback, db);
};

Application.setDefaultPhoneGap = function(appname, tenantid, callback, db) {
    set(appname, {
        phonegap: {
            "token": "",
            "applicationId": ""
        }
    }, tenantid, callback, db);
};

Application.createNew = function(applicationParameters, req, callback, db) {
    Application.getDb(req, db, function(err, db) {
        var applications = db.collection('applications');

        Application.getNewJSON(req.session.tenant.id, function(err, json) {
            if (err) return callback(err, null);

            json.name = applicationParameters.applicationName;
            json.ownerId = applicationParameters.ownerId;
            json.title = applicationParameters.title;
            json.requestDate = new Date();

            applications.insert(json, function(err, app) {
                if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
                var screenParameters = {
                    "title": "Home",
                    "name": "Home",
                    "ownerId": applicationParameters.ownerId,
                    "application": applicationParameters.applicationName,
                };
                screens.createNew(screenParameters, req, function(err, screen) {
                    callback(err, app);
                }, db);
            });
        });
    });
};

Application.getNewJSON = function(req, callback) {
    fs.readFile('studio/static_json/blanks/application.json', 'utf8', function(err, data) {
        if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
        callback(err, JSON.parse(data));
    });
};

Application.deleteApplication = function(applicationName, req, callback, db) {
    Application.getDb(req, db, function(err, db) {

        var applications = db.collection('applications');
        applications.remove({
            name: applicationName
        }, function(err) {
            if (err) {
                errors.DEFAULT_APPLICATION(err, req).notifySession();
                return callback(err, null);
            }
            var screens = db.collection('screens');
            screens.remove({
                application: applicationName
            }, function(err_screens) {
                if (err_screens) errors.DEFAULT_APPLICATION(err_screens, req).notifySession();
                return callback(err_screens);
            }, db);
        });
    });
};

Application._getScreenItem = function( name, screens_tree ) {
    var item = null;
    var i=0;
    for (var i=0; i<screens_tree.length; i++) {
        if (screens_tree[i].name==name) {
            item = screens_tree[i];
            break;
        } else if (screens_tree[i].children.length>0) {
            item = Application._getScreenItem( name, screens_tree[i].children );
            if (item!=null) {
                break;
            }
        }
    }
    return item;
};

exports = module.exports = Application;