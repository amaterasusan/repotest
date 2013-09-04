/*
	DreamFace DFX Studio
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

var jade = require('jade');
var fs = require('fs');
var mongoc = require('mongodb').MongoClient;
var applications = require('./dfx_applications');
var sessionUtil = require('./dfx_sessions');
var newsfeed = require('./dfx_newsfeed');
var queries = require('./dfx_queries');
var Studio = function() {
};

Studio.initialize = function(app) {};

Studio.dashboard = function(req, res) {
    req.session.screen = {
        name: "dashboard"
    };
    sessionUtil.touch(req);

    applications.getAll(req, function(err, app_results) {
        newsfeed.get(req, {
            "entity": "applications"
        }, function(err, news_results) {
            //console.log(JSON.stringify(news_results));
            fs.readFile('studio/dashboard.jade', 'utf8', function(err, data) {
                if (err) throw err;

                var fn = jade.compile(data);
                var body = fn({
                    "applications": app_results,
                    "newsfeed": news_results
                });
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Length', body.length);
                res.end(body);
            });
        });
    });
}

Studio.home = function(req, res) {
	sessionUtil.touch(req);
	fs.readFile('studio/home.jade', 'utf8', function(err, data) {
		if (err) throw err;

		var fn = jade.compile(data);
		var body = fn({});
		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Content-Length', body.length);
		res.end(body);
	});
};

Studio.sessions = function(req, res) {
	console.log("Sessions requested...");

	req.session.screen = {
		name: 'sessions'
	};
	sessionUtil.touch(req);

	sessionUtil.getAll(req, function(err, session_results) {
		fs.readFile('studio/sessions.jade', 'utf8', function(err, data) {
			if (err) throw err;

			var fn = jade.compile(data);
			var body = fn({
				sessions: session_results
			});
			res.setHeader('Content-Type', 'text/html');
			res.setHeader('Content-Length', body.length);
			res.end(body);
		});
	});
};

Studio.settings = function(req, res) {
	sessionUtil.touch(req);
	fs.readFile('studio/settings.jade', 'utf8', function(err, data) {
		if (err) throw err;

		var fn = jade.compile(data);
		var body = fn({});
		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Content-Length', body.length);
		res.end(body);
	});
};

Studio.feedback = function(req, res) {
	sessionUtil.touch(req);
	fs.readFile('studio/feedback.jade', 'utf8', function(err, data) {
		if (err) throw err;

		var fn = jade.compile(data);
		var body = fn({});
		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Content-Length', body.length);
		res.end(body);
	});
};

Studio.workflow = function(req, res) {
	sessionUtil.touch(req);
	fs.readFile('studio/workflow.jade', 'utf8', function(err, data) {
		if (err) throw err;

		var fn = jade.compile(data);
		var body = fn({});
		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Content-Length', body.length);
		res.end(body);
	});
};

Studio.create = function(req, res, what) {
	console.log("Creating " + what);
    if(what == 'query'){
        Studio.createQuery(req, res);
    } else {
	    fs.readFile('studio/create-' + what + '.jade', 'utf8', function(err, data) {
		    if (err) throw err;
            //console.log(data)
		    var fn = jade.compile(data);
		    var body = fn({

		    });
		    res.setHeader('Content-Type', 'text/html');
		    res.setHeader('Content-Length', body.length);
		    res.end(body);
	    });
    }
};

Studio.createQuery = function(req, res) {
    queries.getAllCat(req, function(err, arr_query_cat) {
        fs.readFile('studio/create-query.jade', 'utf8', function(err, data) {
            if (err) throw err;

            var fn = jade.compile(data);
            var body = fn({
                querycats: arr_query_cat
            });
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Length', body.length);
            res.end(body);
        });
    });
}
Studio.viewQuery = function(req, res, queryName) {
    //console.log(queryName)
    queries.getAllCat(req, function(err, arr_query_cat) {
        queries.get(queryName, req, function(err, query) {
            fs.readFile('studio/query.jade', 'utf8', function(err, data) {
                if (err) throw err;
                //console.log(query.parameters.length)
                var fn = jade.compile(data);
                var body = fn({
                    query: query,
                    querycats: arr_query_cat
                });
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Length', body.length);
                res.end(body);
            });
        });

    });
}

exports = module.exports = Studio;
