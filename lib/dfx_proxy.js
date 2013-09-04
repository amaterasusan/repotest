/*
	DreamFace DFX Proxy
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

// Declaration of main modules
var express = require('express');
var passport = require('passport');
var jade = require('jade');
var fs = require('fs');
var request = require('request');
var mongoc = require('mongodb').MongoClient;
var AdmZip = require('adm-zip');
var nodemailer = require('nodemailer');

// Declaration of DFX modules
var applications = require('./dfx_applications');
var screens = require('./dfx_screens');
var widgets = require('./dfx_widgets');
var queries = require('./dfx_queries');
var studio = require('./dfx_studio');
var databases = require('./dfx_databases');
var sessions = require('./dfx_sessions');
var compiler = require('./dfx_compiler');
var github = require('./dfx_github');
var sockets = require('./dfx_sockets');
var phonegap = require('./dfx_pgbuild');
var sysadmin = require('./dfx_sysadmin');

var EMAIL_HOST = "smtp.dreamface.com";
var EMAIL_PORT = 465;
var EMAIL_USER = "user@service.com";
var EMAIL_PASSWORD = "userpass";

var initialize = function(app) {
    
    // _______________________EMAIL START________________________________
    app.post('/email', ensureStudioAuthenticated, function(req, res) {
        // create reusable transport method (opens pool of SMTP connections)
        var smtpTransport = nodemailer.createTransport("SMTP", {
            host: EMAIL_HOST, // hostname
            secureConnection: true, // use SSL
            port: EMAIL_PORT, // port for secure SMTP
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASSWORD
            }
        });

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: "DFX - DreamFace Mobile", // sender address
            to: "support@dreamface.com", // list of receivers
            subject: req.body.email.subject, // Subject line
            text: req.body.email.text, // plaintext body
            html: req.body.email.html // html body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Message sent: " + response.message);
            }
            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages
        });
    });
    // _______________________EMAIL START________________________________


    // _______________________CONSOLE START________________________________
    app.get('/console', sys_auth, function(req, res) {
        fs.readFile('templates/console.jade', 'utf8', function(err, data) {
            if (err) throw err;

            sysadmin.getCloudRepository(function(repo_err, settings) {
                var fn = jade.compile(data);
                var body = fn(settings);
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Length', body.length);
                res.end(body);
            });
        });
    });

    app.get('/console/repository/initialize', sys_auth, function(req, res) {
        sysadmin.initCloudRepository(function(err, doc) {
            if (err) throw err;

            res.redirect('/console');
            return;
        });
    });

    app.post('/console/tenant/create', sys_auth, function(req, res) {
        sysadmin.createTenant(req, function(err) {
            if (err) throw err;

            res.redirect('/console');
            return;
        });
    });

    // _______________________CONSOLE STOP_________________________________

    // _______________________COMPILER START_______________________________
    app.get('/compiler/make/:mode/:applicationName', function(req, res) {
        if (req.params.mode === 'zip') {
            console.log('Compiling application ' + req.params.applicationName + '...');
            compiler.make(req.params.applicationName, req, function(zip) {
                console.log('Compiler \'make\' completed');
                res.setHeader('Content-Type', 'application/zip');
                var zipBuffer = zip.toBuffer();
                res.setHeader('Content-Length', zipBuffer.length);
                res.end(zipBuffer);
            });
        } else if (req.params.mode === 'github') {
            github.make(req.params.applicationName, req, function(e) {
                if (!e) {
                    sockets.emitToSession("showNotification", req.sessionID, {
                        clickToDismiss: true,
                        title: "Uploaded to GitHub",
                        body: ""
                    });
                }
                res.end("Application has been uploaded...");
            });
        } else if (req.params.mode === 'phonegap') {
            phonegap.make(req.params.applicationName, req, function(e) {
                if (e) {
                    return res.end("There was a problem building your application to phonegap");
                }
                sockets.emitToSession("showNotification", req.sessionID, {
                    clickToDismiss: true,
                    title: "Uploaded to PhoneGap",
                    body: ""
                });
                res.end("Application has been uploaded...");
            });
        }
    });
    // _______________________COMPILER STOP_______________________________



    // _______________________STUDIO START________________________________
    app.get('/studio/:tenantid/login.html', function(req, res) {
        // Store the tenant id in the session.
        req.session.tenant = {
            id: req.params.tenantid
        };

        fs.readFile('studio/login.jade', 'utf8', function(err, data) {
            if (err) throw err;
            var fn = jade.compile(data);
            var body = fn({
                tenantid: req.params.tenantid
            });
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Length', body.length);
            res.end(body);
        });
        res.cookie('dfx_last_tenant', req.params.tenantid, {
            maxAge: 1 * 24 * 3600 * 1000,
            httpOnly: false
        });
    });

    app.get('/studio/index.html', function(req, res) {
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

        fs.readFile('studio/index.jade', 'utf8', function(err, data) {
            if (err) throw err;

            var fn = jade.compile(data);
            var body = fn({
                tenantid: req.session.tenant.id
            });
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Content-Length', body.length);
            res.end(body);
        });
    });

    app.get('/studio/home', ensureStudioAuthenticated, function(req, res) {
        studio.home(req, res);
    });

    app.get('/studio/dashboard', ensureStudioAuthenticated, function(req, res) {
        studio.dashboard(req, res);
    });

    app.get('/studio/databases', ensureStudioAuthenticated, databases.action);
    app.get('/studio/databases/:action', ensureStudioAuthenticated, databases.action);
    app.get('/studio/databases/:action/:dbName', ensureStudioAuthenticated, databases.action);
    app.get('/studio/databases/:action/:dbName/:clName', ensureStudioAuthenticated, databases.action);
    app.get('/studio/databases/:action/:dbName/:clName/:id', ensureStudioAuthenticated, databases.action);
    app.post('/studio/databases/:action/:dbName/:clName', ensureStudioAuthenticated, databases.action);
    app.post('/studio/databases/:action/:dbName/:clName/:id', ensureStudioAuthenticated, databases.action);

    app.get('/studio/sessions', ensureStudioAuthenticated, function(req, res) {
        studio.sessions(req, res);
    });

    app.get('/studio/feedback', ensureStudioAuthenticated, function(req, res) {
        studio.feedback(req, res);
    });

    app.get('/studio/workflow', ensureStudioAuthenticated, function(req, res) {
        studio.workflow(req, res);
    });

    app.get('/studio/settings', ensureStudioAuthenticated, function(req, res) {
        studio.settings(req, res);
    });

    app.get('/studio/settings', ensureStudioAuthenticated, function(req, res) {
        studio.settings(req, res);
    });

    app.get('/studio/:what/create', ensureStudioAuthenticated, function(req, res) {
        studio.create(req, res, req.params.what);
    });

    app.get('/studio/session/getid', ensureStudioAuthenticated, function(req, res) {
        res.end("" + req.sessionID);
    });

    app.post('/studio/:what/create', ensureStudioAuthenticated, function(req, res) {
        if (req.params.what == "application") {
            applications.createNew(req.body, req, function() {
                sockets.emitToSession("showNotification", req.sessionID, {
                    clickToDismiss: true,
                    title: "Application created!",
                    body: ""
                });
                res.end("1");
                return;
            });
        } else if (req.params.what == "screen") {
            screens.createNew(req.body, req, function() {
                sockets.emitToSession("showNotification", req.sessionID, {
                    clickToDismiss: true,
                    title: "Screen created!",
                    body: ""
                });
                res.end("1");
                return;
            });
        } else if (req.params.what == "widget") {
            widgets.createNew(req.body, req, function() {
                sockets.emitToSession("showNotification", req.sessionID, {
                    clickToDismiss: true,
                    title: "Widget created!",
                    body: ""
                });
                res.end("1");
                return;
            });

        } else if (req.params.what == "query") {
            if(req.body.act == 'createQueryCat'){
                queries.createNewCat(req.body, req, function() {
                    sockets.emitToSession("showNotification", req.sessionID, {
                        clickToDismiss: true,
                        title: "Query Category created!",
                        body: ""
                    });
                    res.end("1");
                    return;
                });
            } else {
                queries.createNew(req.body, req, function() {
                    sockets.emitToSession("showNotification", req.sessionID, {
                        clickToDismiss: true,
                        title: "Query created!",
                        body: ""
                    });
                    res.end("1");
                    return;
                });
            }
        }
    });

    app.post('/studio/session/view', function(req, res) {
        sessions.getSessionById(req.body.sessionId, function(session) {
            if (!session) {
                console.log("There was an error acquiring the session");
                return;
            }
            res.end(session);
        });
    });

    app.get('/studio/application/view/:applicationName', ensureStudioAuthenticated, function(req, res) {
        applications.get(req.params.applicationName, req, function(err, application) {
            if (!application.github) {
                application.github = {
                    "token": "",
                    "username": "",
                    "repository": ""
                };
            }
            if (!application.phonegap) {
                application.phonegap = {
                    "token": "",
                    "applicationId": ""
                };
            }
            console.log(application.github);
            application.github.token = application.github.token || "";
            application.phonegap.token = application.phonegap.token || "";
            application.phonegap.applicationId = application.phonegap.applicationId || "";

            fs.readFile('studio/application.jade', 'utf8', function(err, data) {
                if (err) throw err;
                var fn = jade.compile(data);
                var body = fn({
                    application: application
                });
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Length', body.length);
                res.end(body);
            });
        });
    });
    
    app.get('/studio/application/editui/:applicationName', ensureStudioAuthenticated, function(req, res) {
        applications.getFullDefinition(req.params.applicationName, req, function(err, application) {
            fs.readFile('studio/application_ui.jade', 'utf8', function(err, data) {
                if (err) throw err;
                var fn = jade.compile(data, {
                    filename: 'studio/application_ui.jade'
                });
                var body = fn({
                    application: application
                });
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Length', body.length);
                res.end(body);
            });
        });
    });
    // _________________________STUDIO STOP___________________________________

    // _______________________APPLICATION START_______________________________
    app.get("/studio/application/getid/:applicationName", ensureStudioAuthenticated, function(req, res) {
        applications.get(req.params.applicationName, req, function(err, application) {
            if (!application) {
                return res.end("");
            }
            if (!application.phonegap) {
                return res.end("");
            }
            res.end(application.phonegap.applicationId + "");
        });
    });

    app.post('/studio/application/update/:applicationName', ensureStudioAuthenticated, function(req, res) {
        console.log("Request to change the application " + req.params.applicationName);
        console.log("New fields to set: " + JSON.stringify(req.body.change));
        applications.set(req.params.applicationName, req.body.change, req, function(err, app) {
            if (err) {
                console.log("There was an error updating the application " + req.params.applicationName);
                res.end("0");
                return;
            }
            sockets.emitToSession("showNotification", req.sessionID, {
                clickToDismiss: true,
                title: "Application updated!",
                body: ""
            });
            console.log("Successfully updated the application " + req.params.applicationName);
            res.end("1");
        });
    });

    app.post('/studio/application/deletephonegap', ensureStudioAuthenticated, function(req, res) {
        phonegap.deleteApplication(req.body.applicationName, req, function(err) {
            if (err) return res.end(JSON.stringify({
                error: err
            }));
            sockets.emitToSession("showNotification", req.sessionID, {
                clickToDismiss: true,
                title: "Application deleted!",
                body: ""
            });
            return res.end(JSON.stringify({
                success: 1,
                error: null
            }));
        });
    });

    app.post('/studio/application/delete', ensureStudioAuthenticated, function(req, res) {
        applications.deleteApplication(req.body.applicationName, req, function(err) {
            if (err) return res.end(JSON.stringify({
                error: err
            }));
            sockets.emitToSession("showNotification", req.sessionID, {
                clickToDismiss: true,
                title: "Application deleted!",
                body: ""
            });
            return res.end(JSON.stringify({
                success: 1,
                error: null
            }));
        });
    });
    // _______________________APPLICATION STOP_______________________________

    // _________________________WIDGET START_________________________________
    app.get('/studio/widget/list', ensureStudioAuthenticated, function(req, res) {
        if (req.body.filter) {
            widgets.getAllWithFilter(req.body.filter, req, function(err, arr_widget) {
                res.end(JSON.stringify({
                    widgets: arr_widget
                }));
            });
        } else {
            widgets.getAll(req, function(err, arr_widget) {
                res.end(JSON.stringify({
                    widgets: arr_widget
                }));
            });
        }
    });
    
    app.get("/studio/widget/search", ensureStudioAuthenticated, function(req, res) {
        widgets.getAllWithFilter({'name': { $regex: req.query.q, $options: 'i' }}, req, function(err, arr_widgets) {
            if (!arr_widgets) {
                return res.end("{widget:[]}");
            }
            res.end(JSON.stringify({
                widgets: arr_widgets
            }));
        });
    });
    // _________________________WIDGET STOP_________________________________

    // _________________________SCREEN START________________________________
    app.get('/studio/screen/list', ensureStudioAuthenticated, function(req, res) {
        if (req.body.filter) {
            screens.getAllWithFilter(req.body.filter, req, function(err, arr_screens) {
                res.end(JSON.stringify({
                    screens: arr_screens
                }));
            });
        } else {
            screens.getAll(req, function(err, arr_screens) {
                res.end(JSON.stringify({
                    screens: arr_screens
                }));
            });
        }
    });
    
    app.get("/studio/screen/item/:screenName/:applicationName", ensureStudioAuthenticated, function(req, res) {
        screens.get(req.params.screenName, req.params.applicationName, req, function(err, screen) {
            res.end(JSON.stringify({
                screen: screen
            }));
        });
    });
    
    app.post('/studio/screen/update', ensureStudioAuthenticated, function(req, res) {
        screens.set(req.body.change, req, function(err, screen) {
            if (err) {
                res.end("0");
                return;
            }
            sockets.emitToSession("showNotification", req.sessionID, {
                clickToDismiss: true,
                title: "Screen updated!",
                body: "The screen has been updated successfully."
            });
            res.end("1");
        });
    });
    // _________________________SCREEN STOP_________________________________

    // _________________________QUERY START_________________________________
    app.get('/studio/query/list', ensureStudioAuthenticated, function(req, res) {
        if (req.body.filter) {
            queries.getAllWithFilter(req.body.filter, req, function(err, arr_queries) {
                res.end(JSON.stringify({
                    queries: arr_queries
                }));
            });
        } else {
            queries.getAll(req, function(err, arr_queries) {
                res.end(JSON.stringify({
                    queries: arr_queries
                }));
            });
        }
    });

    app.get("/studio/query/search", ensureStudioAuthenticated, function(req, res) {
        queries.getAllWithFilter({'name': { $regex: req.query.q, $options: 'i' }}, req, function(err, arr_queries) {
            if (!arr_queries) {
                return res.end("{query:[]}");
            }
            res.end(JSON.stringify({
                queries: arr_queries
            }));
        });
    });
    app.get('/studio/query/view/:queryName', ensureStudioAuthenticated, function(req, res) {
        //console.log(req.params.queryName)
        studio.viewQuery(req, res, req.params.queryName);
    });
    app.post('/studio/query/update/:queryName', ensureStudioAuthenticated, function(req, res) {
        //console.log(req.body)
        queries.set(req.params.queryName, req.body, req, function(err, query) {
            if (err) {
                res.end("0");
                return;
            }
            sockets.emitToSession("showNotification", req.sessionID, {
                clickToDismiss: true,
                title: "Query updated!",
                body: "The query has been updated successfully."
            });
            res.end("1");
        });
    });
    app.post('/studio/query/delete', ensureStudioAuthenticated, function(req, res) {
        queries.deleteQuery(req.body.queryName, req, function(err) {
            if (err) {
                return res.end(JSON.stringify({
                    error: err
                }));
            }
            sockets.emitToSession("showNotification", req.sessionID, {
                clickToDismiss: true,
                title: "Query deleted!",
                body: ""
            });

            return res.end(JSON.stringify({
                success: 1,
                error: null
            }));
        });
    });
    // _________________________QUERY STOP__________________________________

    // _________________________DFX START___________________________________
    app.get('/dfx/:tenantid/:applicationName/index.html', ensureStudioAuthenticated, function(req, res) {
        req.session.user = {
            name: req.body.username
        };
        applications.get(req.params.applicationName, req, function(err, app) {
            fs.readFile('templates/login.jade', 'utf8', function(err, data) {
                if (err) throw err;

                var fn = jade.compile(data);
                var body = fn({
                    apptitle: app.title
                });
                res.setHeader('Content-Type', 'text/html');
                res.setHeader('Content-Length', body.length);
                res.end(body);
            });
        });
    });

    // Login HTTP Handler
    app.post('/dfx/:tenantid/:appname/login',
        passport.authenticate('local', {
            failureRedirect: '/dfx/loginerr',
            failureFlash: false
        }), function(req, res) {
            var body = '{qresult:"ok"}';
            res.setHeader('Content-Type', 'text/json');
            res.setHeader('Content-Length', body.length);
            res.end(body);
        });

    app.get('/dfx/loginerr', function(req, res) {
        var body = 'Authentication Error';
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Length', body.length);
        res.end(body);
    });

    // Screen HTTP Handler
    app.get('/dfx/:tenantid/:appname/start.html', ensureAuthenticated, function(req, res) {
        screens.render('Home', req, res);
    });

    // Widget HTTP Handler (will be replaced by websocket)
    // Screen HTTP Handler
    app.get('/dfx/:tenantid/:appname/widget.html', ensureAuthenticated, function(req, res) {
        widgets.render(req.query.wclass, req, res);
    });

    app.get('/dfx/:tenantid/:appname/:screen', ensureAuthenticated, function(req, res) {
        var body = 'You are connected as ' + req.user.username + '(' + req.user.userid + ')';
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Length', body.length);
        res.end(body);
    });
    // _________________________DFX STOP_____________________________________
}

// _______________________AUTHENTICATION START_______________________________
var ensureAuthenticated = function(req, res, next) {
    sessions.touch(req);
    if (req.params.tenantid) {
        req.session.tenant = {
            id: req.params.tenantid
        };
    }
    if (req.session.tenant) {
        sessions.touch(req);
    }
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/dfx/' + req.params.tenantid + '/' + req.params.appname + '/index.html')
}

var ensureStudioAuthenticated = function(req, res, next) {
    if (req.params.tenantid) {
        req.session.tenant = {
            id: req.params.tenantid
        };
    }
    if (req.session.tenant) {
        sessions.touch(req);
        return next();
    } else {
        // res.redirect('/studio/' + req.cookies.dfx_last_tenant + '/login.html');
        res.end(JSON.stringify({
            error: 'SESSIONEND'
        }));
    }
}

var sys_auth = express.basicAuth(function(user, pass) {
    return (user == "sys" && pass == "admin");
}, 'System admin');
// _______________________AUTHENTICATION STOP_______________________________

exports.initialize = initialize;
