/*
    DreamFace DFX
    Version: 1.0
    Author: DreamFace Interactive
    License: Commercial
    (c) 2013 DreamFace Interactive, all rights reserved.
*/

'use strict';
var mongoc = require('mongodb').MongoClient;
var sockets = require('./dfx_sockets');

var Session = function() {};

Session.timeoutFunctions = new Object();

Session.MongoStore = require('connect-mongostore')(require('express'));

Session.mongostoreClearInterval = 5 * 60;
Session.cookieMaxAge = 5 * 60 * 1000;
Session.databaseName = "dreamface_db";
Session.collectionName = "dreamface.sessions";
Session.host = "127.0.0.1";
Session.port = 27017;

Session.sessionStore = new Session.MongoStore({
    'db': Session.databaseName,
    "clear_interval": Session.mongostoreClearInterval,
    "host": Session.host,
    "port": Session.port,
    "options": {
        "autoReconnect": false,
        "poolSize": 200,
        "socketOptions": {
            "timeout": 0,
            "noDelay": true,
            "keepAlive": 1,
            "encoding": "utf8"
        }
    },
    "collection": Session.collectionName
});

Session.touch = function(req) {

    var io = sockets.io;

    // TODO get the session timeout from the preferences of the user
    var userPrefSessionTime = 180 * 60 * 1000;

    req.session.cookie.maxAge = userPrefSessionTime;
    req.session.cookie.expire = new Date(new Date().getTime() + req.session.cookie.maxAge);

    if (Session.timeoutFunctions[req.sessionID]) {
        console.log("\u001b[32mRetouching session " + req.sessionID + "\u001b[0m");
        clearTimeout(Session.timeoutFunctions[req.sessionID]);
        if (io) {
            io.sockets.emit('sessionActivity', {
                type: 'touch',
                session: req.session,
                sessionID: req.sessionID
            });
        }
    } else {
        console.log("\u001b[32mSetting timeout for session " + req.sessionID + "\u001b[0m");
        if (io) {
            io.sockets.emit('sessionActivity', {
                type: 'login',
                session: req.session,
                sessionID: req.sessionID
            });
        }
    }
    Session.timeoutFunctions[req.sessionID] = setTimeout(function() {
        console.log("\u001b[32mSession " + req.sessionID + " has timed out" + "\u001b[0m");
        if (!io) return;
        io.sockets.emit('sessionActivity', {
            type: 'timeout',
            session: req.session,
            sessionID: req.sessionID
        });
        var dismissButtonId = Math.floor(Math.random() * 1000);
        var onclick = "console.log('Logging in...');$.get('/studio/index.html', {username:$('#dfx_quicklogin_username').val(),password:$('#dfx_quicklogin_password').val()}, ";
        onclick += "function(data){console.log('Login attempted, got response: ' + data);$('#"+dismissButtonId+"').trigger('closeNotification');DfxStudio.setupSocket()});";
        
        var login_form = '<form action="#"><fieldset>';
        login_form += '<div class="form-group"><input class="form-control" type="text" id="dfx_quicklogin_username" placeholder="user name"/></div>';
        login_form += '<div class="form-group"><input class="form-control" type="password" id="dfx_quicklogin_password" placeholder="password" /></div>';
        login_form += '<button id="' + dismissButtonId + '" type="submit" class="btn btn-default btn-small" onclick="javascript:' + onclick + '">Sign in</button>';
        login_form += '</fieldset></form>';
        sockets.emitToSession('showNotification', req.sessionID, {
            title: "Session Timed Out",
            body: login_form,
            width: 200,
            height: 200,
            dismissButtonId: dismissButtonId
        });
    }, req.session.cookie.maxAge);

    req.session._garbage = Date();
};

Session.initStore = function(app) {
    app.use(require('express').session({
        secret: 'DFX0909',
        cookie: {
            maxAge: Session.cookieMaxAge
        },
        store: Session.sessionStore
    }));
};

Session.getAll = function(req, callback) {

    if (!req.session.tenant) {
        var lastTenant = "dreamface";
        if (req.cookies.dfx_last_tenant) {
            console.log("The last tenant was dreamface.");
            lastTenant = req.cookies.dfx_last_tenant;
        } else {
            // TODO redirect to an error page
        }
        res.redirect('/studio/' + lastTenant + '/login.html');
        return;
    }

    mongoc.connect('mongodb://' + Session.host + ':' + Session.port + '/' + Session.databaseName, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        // TODO: tenant id as a session variable
        var m_sessions = db.collection(Session.collectionName);

        m_sessions.find({
            'session.tenant.id': req.session.tenant.id
        }).sort({
            expires: -1
        }).toArray(function(err, session_results) {
            console.log("Got " + session_results.length + " sessions");
            if (callback !== null) {
                callback(err, session_results);
            }
        });
    });
};

Session.getSessionById = function(id, callback) {
    // TODO This shouldnt be like this because the tenant is not dreamface
    mongoc.connect('mongodb://' + Session.host + ':' + Session.port + '/' + Session.databaseName, function(err, db) {
        if (err) {
            return console.dir(err);
        }

        // TODO: tenant id as a session variable
        var m_sessions = db.collection(Session.collectionName);

        m_sessions.findOne({
            '_id': id
        }, function(err, session) {
            if (!session || err) {
                callback();
                return;
            }
            console.log("Prettyprint of session: \n" + JSON.stringify(session, null, "\t"));
            callback(JSON.stringify(session, null, "\t"));
        });
    });
};

exports = module.exports = Session;
