/*
	DreamFace DFX
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

// Declaration of main modules
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var express = require('express');

// Declaration of DFX modules
var proxy = require('./lib/dfx_proxy');
var sessions = require('./lib/dfx_sessions');
var sockets = require('./lib/dfx_sockets');

var server_port = '3000';

// Authentication Initialization
passport.use(new LocalStrategy(function(username, password, done) {
	if (username == 'john') {
		return done(null, {
			id: 1,
			username: 'john',
			password: '',
			email: 'john@example.com'
		});
	} else {
		return done(null, false, {
			message: 'Incorrect user.'
		});
	}
}));

passport.serializeUser(function(user, done) {
	done(null, {
		id: 1,
		username: 'john',
		password: '',
		email: 'john@example.com'
	});
});

passport.deserializeUser(function(id, done) {
	done(null, {
		id: 1,
		username: 'john',
		password: '',
		email: 'john@example.com'
	});
});

// Application Initialization
var app = require('express')(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server, {
		log: false
	});


// -------------------------------------------------------------------------
// ------------------------------------------------ remove it in production		TODO
console.log("\n\n ======== ATTENTION: development version. ======== \n");
app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
// ------------------------------------------------ remove it in production
// -------------------------------------------------------------------------


server.listen(server_port);

app.use("/bootstrap", express.static(__dirname + '/public/bootstrap'));
app.use("/web", express.static(__dirname + '/public/web'));
app.use("/js", express.static(__dirname + '/public/js'));
app.use("/styles", express.static(__dirname + '/public/styles'));
app.use("/themes", express.static(__dirname + '/public/themes'));
app.use("/studio/css", express.static(__dirname + '/studio/css'));
app.use("/studio/js", express.static(__dirname + '/studio/js'));
app.use("/studio/images", express.static(__dirname + '/studio/images'));
app.use("/studio/help", express.static(__dirname + '/studio/help'));
app.use(express.bodyParser());
app.use(express.cookieParser());

// Setup the session store
sessions.initStore(app);

app.use(passport.initialize());
app.use(passport.session());

// Socket Initialization
sockets.init(io);

// Proxy Initialization
proxy.initialize(app);

// Application Server Start
console.log('-----------------------------------');
console.log('Starting DreamFace DFX on port '+server_port+'');
console.log('vBeta 1 - Build# 101 - August 2013');
console.log('(c) 2013 DreamFace Interactive');
console.log('http://www.dreamface.org');
console.log('-----------------------------------');

exports.server_port = server_port;
