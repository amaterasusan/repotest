/*
	DreamFace DFX Screens
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

var widgets = require('./dfx_widgets');
var applications = require('./dfx_applications');

var jade = require('jade');
var fs = require('fs');
var mongoc = require('mongodb').MongoClient;
var MONGO_HOST = "localhost";
var MONGO_PORT = 27017;

var Screen = function() {};

Screen.getDb = function(req, db, callback) {
	if (!db) {
		mongoc.connect('mongodb://' + MONGO_HOST + ':' + MONGO_PORT + '/dreamface_' + req.session.tenant.id + '', function(err, db) {
			if (err) {
				err.DEFAULT_MONGO(err, req).notifySession();
				return callback(err, null);
			}
			callback(null, db);
		});
		return;
	}
	callback(null, db);
};

Screen.render = function(screenname, req, res, db) {
	Screen.getDb(req, db, function(err, db) {
		Screen.get(screenname, req.params.appname, req, function(err, screen_item) {
			var i = 0,
				j = 0,
				k = 0;
			var arrayOfWidgets = new Array();
			for (i = 0; i < item_screen.layout.rows.length; i++) {
				var row = item_screen.layout.rows[i];
				for (j = 0; j < row.columns.length; j++) {
					var col = row.columns[j];
					for (k = 0; k < col.widgets.length; k++) {
						arrayOfWidgets.push(col.widgets[k]);
					}
				}
			}

			fs.readFile('templates/default.jade', 'utf8', function(err, data) {
				if (err) throw err;

				var fn = jade.compile(data);
				var body = fn({
					apptitle: item_screen.application,
					screentitle: item_screen.title,
					widgets: arrayOfWidgets
				});
				res.setHeader('Content-Type', 'text/html');
				res.setHeader('Content-Length', body.length);
				res.end(body);
			});
		}, db);
	});
};

Screen.generate = function(appname, screenname, req, callback, db) {
	Screen.getDb(req, db, function(err, db) {

		Screen.get(screenname, appname, req, function(err, screen_item) {
			var m_widgets = db.collection('datawidgets');

			var i = 0,
				j = 0,
				k = 0;
			var arrayOfWidgets = new Array();
			for (i = 0; i < screen_item.layout.rows.length; i++) {
				var row = screen_item.layout.rows[i];
				for (j = 0; j < row.columns.length; j++) {
					var col = row.columns[j];
					for (k = 0; k < col.widgets.length; k++) {
						arrayOfWidgets.push(col.widgets[k]);
					}

				}
			}

			Screen.loadWidgetClasses(0, arrayOfWidgets, m_widgets, function() {
				fs.readFile('templates/default_offline.jade', 'utf8', function(err, data) {
					if (err) throw err;

					var fn = jade.compile(data, {
						filename: 'templates/default_offline.jade'
					});
					var body = fn({
						apptitle: screen_item.application,
						screentitle: screen_item.title,
						widgets: arrayOfWidgets
					});
					callback(null, body);
				});
			});
		});
	});
};

Screen.loadWidgetClasses = function(index, arr_widgets, collection, callback, db) {
	if (arr_widgets.length == 0) return callback(null);

	var startedAll = false;
	var returned = arr_widgets.length;

	var sendAsync = function(ind, wclass) {
		widgets.get(wclass, req, function(err, widget) {
			if (err) {
				errors.DEFAULT_SCREEN(e, req).notifySession();
				returned = -1; // Make sure the callback doesnt get called by other async functions
				return callback(err, null);
			}
			arr_widgets[ind].definition = widget;
			if (--returned == 0 && startedAll) {
				return callback(null);
			}
		}, db);
	};

	for (var i = 0; i < arr_widgets.length; i++) {
		sendAsync(i, arr_widgets[i].wclass);
	}
	startedAll = true;
};

Screen.createNew = function(screenParameters, req, callback, db) {
	Screen.getDb(req, db, function(err, db) {
		var screens = db.collection('screens');

		Screen.getNewJSON(function(json) {

			json.title = screenParameters.title;
			json.name = screenParameters.name;
			json.requestDate = new Date();
			json.ownerId = screenParameters.ownerId;
			json.application = screenParameters.application;
            if (screenParameters.parentname!=null && screenParameters.parentname!='') {
                json.parentname = screenParameters.parentname;
            }

			screens.insert(json, function(err, screen) {
				callback(null, screen);
			});
		});
	});
};

Screen.set = function(screen, req, callback, db) {
	screen.requestDate = new Date();
    Screen.getDb(req, db, function(err, db) {
        
		var screens = db.collection('screens');
		screens.update({
			name: screen.name,
			application: screen.application
		},{
            $set: screen
        }, function(err, nb_updated_record) {
			if (err) {
				errors.DEFAULT_SCREEN(e, req).notifySession();
				return callback(err, null);
			}
			callback(err, screen);
		});
	});
};

Screen.getNewJSON = function(callback) {
	fs.readFile('studio/static_json/blanks/screen.json', 'utf8', function(err_log, data) {
		callback(JSON.parse(data));
	});
};

Screen.getAll = function(applicationName, req, callback, db) {
	Screen.getDb(req, db, function(err, db) {

		var screens = db.collection('screens');
		screens.find({
			application: applicationName
		}).toArray(function(err, screen_items) {
			if (err) {
				errors.DEFAULT_SCREEN(e, req).notifySession();
				return callback(err, null);
			}
			callback(err, screen_items);
		});
	});
};

Screen.get = function(screenName, applicationName, req, callback, db) {
	Screen.getDb(req, db, function(err, db) {

		var screens = db.collection('screens');
		screens.findOne({
			name: screenName,
			application: applicationName
		}, function(err, screen_item) {
			if (err) {
				errors.DEFAULT_SCREEN(e, req).notifySession();
				return callback(err, null);
			}
			callback(err, screen_item);
		});
	});
};

exports = module.exports = Screen;