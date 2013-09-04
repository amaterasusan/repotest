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

var MONGO_HOST = "localhost";
var MONGO_PORT = 27017;
var MONGO_DBNAME = "dreamface_db";

var Query = function() {};
Query.getDb = function(req, db, callback) {
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
Query.getAll = function(req, callback, db){
    Query.getDb(req, db, function(err, db) {

        var queries = db.collection('dataqueries');

        queries.find().toArray(function(err, results) {
            callback(null, results);
        });
    });
};

Query.getAllWithFilter = function(filter, req, callback, db) {
    Query.getDb(req, db, function(err, db) {

        var queries = db.collection('dataqueries');

        queries.find(filter).toArray(function(err, results) {
            callback(null, results);
        });
    });
};

Query.get = function(queryName, req, callback, db){
    Query.getDb(req, db, function(err, db) {

        var queries = db.collection('dataqueries');

        queries.findOne({
            "name": queryName
        }, function(err, results) {
            callback(null, results);
        });
    });
};

Query.set = function(queryName, fields, req, callback, db) {
    Query.getDb(req, db, function(err, db) {

        var queries = db.collection('dataqueries');
        fields.requestDate = new Date();
        queries.update({
            name: queryName
        }, {
            $set: fields
        }, function(err, result) {
            if (err) {
                errors.DEFAULT_QUERY(err, req).notifySession();
                return callback(err, null);
            }
            console.log("The query has been updated.");
            callback(null, result);
        });
    });
};

Query.deleteQuery = function(queryName, req, callback, db) {
    Query.getDb(req, db, function(err, db) {

        var queries = db.collection('dataqueries');
        queries.remove({
            name: queryName
        }, function(err, result) {
            if (err) {
                errors.DEFAULT_APPLICATION(err, req).notifySession();
                return callback(err, null);
            }
            console.log("The query has been deleted.");
            callback(null, result);
        });
    });
};


Query.createNew = function(queryParameters, req, callback, db) {
    Query.getDb(req, db, function(err, db) {
        var queries = db.collection('dataqueries');

        Query.getNewJSON(req.session.tenant.id, function(err, json) {
            if (err) return callback(err, null);

            json.name = queryParameters.name;
            json.ownerId = queryParameters.ownerId;
            json.description = queryParameters.description;
            json.requestDate = new Date();
            json.category = queryParameters.category;
            json.format = queryParameters.format;
            json.settings = queryParameters.settings;
            json.parameters = queryParameters.parameters;

            queries.insert(json, function(err, app) {
                if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
                callback(err, app);
            });
        });
    });
};

Query.getNewJSON = function(req, callback) {
    fs.readFile('studio/static_json/blanks/query.json', 'utf8', function(err, data) {
        if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
        callback(err, JSON.parse(data));
    });
};

Query.getAllCat = function(req, callback, db){
    Query.getDb(req, db, function(err, db) {

        var query_categories = db.collection('dataqueries_categories');

        query_categories.find().toArray(function(err, results) {
            callback(null, results);
        });
    });
};

Query.createNewCat = function(queryParameters, req, callback, db) {
    Query.getDb(req, db, function(err, db) {
        var query_categories = db.collection('dataqueries_categories');

        Query.getNewJSONCat(req.session.tenant.id, function(err, json) {
            if (err) return callback(err, null);

            json.name = queryParameters.name;
            json.ownerId = queryParameters.ownerId;
            json.requestDate = new Date();
            json.visibility = "visible";
            query_categories.insert(json, function(err, app) {
                if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
                callback(err, app);
            });
        });
    });
};

Query.getNewJSONCat = function(req, callback) {
    fs.readFile('studio/static_json/blanks/query_categories.json', 'utf8', function(err, data) {
        if (err) errors.DEFAULT_APPLICATION(err, req).notifySession();
        callback(err, JSON.parse(data));
    });
};

exports = module.exports = Query;