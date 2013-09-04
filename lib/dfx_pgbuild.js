/*
	DreamFace DFX GitHub Management
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

// This will be used to automatically create, build and update the application from the studio

var applications = require('./dfx_applications');
var sessions = require('./dfx_sessions');
var errors = require("./dfx_errors");

var Github = require('github-api');
var phonegap = require('phonegap-build-api');
var fs = require('fs');

var PhoneGap = function() {};

var makeTmpDir = function(req, callback) {
    try {
        fs.exists('tmp/' + req.session.tenant.id, function(exists) {
            if (!exists) {
                fs.mkdir('tmp/' + req.session.tenant.id, function() {
                    callback(null);
                });
            } else {
                callback(null);
            }
        });
    } catch (e) {
        errors.DEFAULT_PHONEGAP(e, req).notifySession();
        callback(e);
    }
};

authenticate = function(appname, req, callback) {
    sessions.touch(req);
    // This will use the token specified in the definition of the application within mongoDB
    makeTmpDir(req, function(e) {
        if (e) return callback(e, null, null);
        applications.get(appname, req, function(err, app_item) {
            if (err) {
                errors.DEFAULT_APPLICATION(e, req).notifySession();
                return callback(err, app_item, null);
            }
            phonegap.auth({
                token: app_item.phonegap.token
            }, function(e, api) {
                if (e) {
                    errors.PHONEGAP_WRONG_TOKEN(e, req).notifySession();
                }
                callback(e, app_item, api);
            });
        });
    });
};

PhoneGap.createApplication = function(appname, req, callback) {
    authenticate(appname, req, function(e, app_item, api) {
        if (e) return callback(e);
        require('./dfx_compiler').make(appname, req, function(zip) {
            zip.writeZip("tmp/" + req.session.tenant.id + "/" + appname + ".zip", function() {
                console.log("Callback worked!");
            });
            var options = {
                form: {
                    data: {
                        title: appname,
                        create_method: 'file'
                    },
                    file: 'tmp/' + req.session.tenant.id + "/" + appname + ".zip"
                }
            };
            console.log("Creating the application...");
            api.post('/apps', options, function(e, data) {
                if (e) {
                    errors.DEFAULT_PHONEGAP(e, req).notifySession();
                    return callback(e);
                }
                console.log("Id: " + data.id);
                applications.set(appname, {
                    phonegap: {
                        token: app_item.phonegap.token,
                        applicationId: data.id
                    }
                }, req, function(err, app) {
                    return callback(err);
                });
            });
        });

    });
};

PhoneGap.getApplicationId = function(appname, req, callback) {
    authenticate(appname, req, function(e, app_item, api) {
        if (e) return callback(e, null, app_item, api);
        api.get('/apps', function(e, data) {
            if (e) {
                console.log(e.message.indexOf('token'));
                if (e.message.indexOf('token') != -1) {
                    errors.PHONEGAP_WRONG_TOKEN(e, req).notifySession();
                } else {
                    errors.DEFAULT_PHONEGAP(e, req).notifySession();
                }
                return callback(e, null, app_item, api);
            }
            for (var i = 0; i < data.apps.length; i++) {
                if (data.apps[i].title == appname) {
                    console.log("Application id: " + data.apps[i].link.split("/")[4]);
                    applications.set(appname, {
                        phonegap: {
                            token: app_item.phonegap.token,
                            applicationId: data.apps[i].link.split("/")[4]
                        }
                    }, req, function(err, app) {
                    });
                    return callback(null, data.apps[i].link.split("/")[4], app_item, api);
                }
            }
            callback(e, null, app_item, api);
        });
    });
};

PhoneGap.updateApplication = function(appname, req, callback) {
    console.log("Updating the application...");
    PhoneGap.getApplicationId(appname, req, function(e, id, app_item, api) {
        if (e) return callback(e);
        require('./dfx_compiler').make(appname, req, function(zip) {
            zip.writeZip("tmp/" + req.session.tenant.id + "/" + appname + ".zip");
            var options = {
                form: {
                    data: {
                        debug: true
                    },
                    file: 'tmp/' + req.session.tenant.id + "/" + appname + ".zip"
                }
            };
            api.put('/apps/' + id, options, function(e, data) {
                if (e) {
                    errors.DEFAULT_PHONEGAP(e, req).notifySession();
                    return callback(e);
                }
                return callback(null);
            });
        });
    });
};

PhoneGap.make = function(appname, req, callback) {
    PhoneGap.applicationExists(appname, req, function(err, id, app_item, api) {
        if (err) return callback(err);
        if (id) {
            // Update the application
            PhoneGap.updateApplication(appname, req, callback);
        } else {
            // Create the application
            PhoneGap.createApplication(appname, req, callback);
        }
    });
};

PhoneGap.applicationExists = PhoneGap.getApplicationId;

PhoneGap.deleteApplication = function(appname, req, callback) {
    PhoneGap.getApplicationId(appname, req, function(e, id, app_item, api) {
        if (e) return callback(e);
        if (id) {
            api.del('/apps/' + id, function(e, data) {
                callback(e);
            });
        } else {
            errors.PHONEGAP_APPLICATION_NO_ID(e, req).notifySession();
            return callback(true);
        }
    });
};

PhoneGap.setKey = function(appname, platform, key, req, callback) {
    PhoneGap.getApplicationId(appname, req, function(e, id, app_item, api) {
        if (e) return callback(e);
        var options = {
            form: {
                data: {
                    password: 'my-updated-password'
                }
            }
        };
        api.put('/keys/' + platform + '/' + id, options, function(e, data) {
            if (e) {
                errors.DEFAULT_PHONEGAP(e, req).notifySession();
            }
            callback(e);
        });
    });
};

PhoneGap.setVersion = function(appname, req, callback) {

};

exports = module.exports = PhoneGap;