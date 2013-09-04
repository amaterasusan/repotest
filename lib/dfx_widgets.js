/*
	DreamFace DFX Widgets
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

var jade = require('jade');
var fs = require('fs');
var mongoc = require('mongodb').MongoClient;

var MONGO_HOST = "localhost";
var MONGO_PORT = 27017;
var MONGO_DBNAME = "dreamface_db";

var Widget = function() {};

Widget.getDb = function(req, db, callback) {
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


Widget.getAll = function(req, callback, db) {
	Widget.getDb(req, db, function(err, db) {

		var widgets = db.collection('datawidgets');

		widgets.find().toArray(function(err, results) {
			callback(null, results);
		});
	});
};

Widget.getAllWithFilter = function(filter, req, callback, db) {
	Widget.getDb(req, db, function(err, db) {

		var widgets = db.collection('datawidgets');

		widgets.find(filter).toArray(function(err, results) {
			callback(null, results);
		});
	});
};

Widget.get = function(widgetName, req, callback) {
	Widget.getDb(req, db, function(err, db) {

		var widgets = db.collection('datawidgets');

		widgets.findOne({
			"name": widgetName
		}, function(err, results) {
			callback(null, results);
		});
	});
};

Widget.set = function(widgetName, fields, req, callback) {
	Widget.getDb(req, db, function(err, db) {

		var widgets = db.collection(tenantid + '.datawidgets');

		widgets.update({
			name: widgetName
		}, {
			$set: fields
		}, function(err, result) {
			if (err) {
				errors.DEFAULT_WIDGET(err, req).notifySession();
				return callback(err, null);
			}
			console.log("The widget has been updated.");
			callback(null, result);
		});
	});
};

Widget.createNew = function(widgetParameters, req, callback, db) {
    Widget.getDb(req, db, function(err, db) {
        var widgets = db.collection('datawidgets');

        Widget.getNewJSON(req.session.tenant.id, function(err, json) {
            if (err) return callback(err, null);

            json.name = widgetParameters.name;
            json.ownerId = widgetParameters.ownerId;
            json.description = widgetParameters.description;
            json.requestDate = new Date();
            json.category = widgetParameters.category;
            json.wtype = widgetParameters.wtype;

            widgets.insert(json, function(err, app) {
                if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
                callback(err, app);
            });
        });
    });
};

Widget.getNewJSON = function(req, callback) {
    fs.readFile('studio/static_json/blanks/widget.json', 'utf8', function(err, data) {
        if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
        callback(err, JSON.parse(data));
    });
};

Widget.render = function(wclass, req, res) {
	Widget.get(wclass, req, function(err, widget_item) {
		if (err) {
			return res.end("0");
		}
		renderWidgetFrame(widget_item, res, req);
	}, db);
};

Widget.renderWidgetFrame = function(datawidget, res, req) {

	fs.readFile('templates/dw/widget_frame.jade', 'utf8', function(err, data) {
		if (err) {
			errors.DEFAULT_MONGO(err, req).notifySession();
			return res.end("0");
		}
		var fn = jade.compile(data, {
			filename: 'templates/dw/widget_frame.jade'
		});
		var body = fn({
			widgetname: datawidget.name,
			children: datawidget.parameters.widgetDefinition.definition[0].children
		});
		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Content-Length', body.length);
		res.end(body);
	});

};

exports = module.exports = Widget;