/*
	DreamFace DFX GitHub Management
	Version: 1.0
	Author: DreamFace Interactive
	License: Commercial
	(c) 2013 DreamFace Interactive, all rights reserved.
*/

// Declaration of main modules
var mongoc = require('mongodb').MongoClient;
var fs = require('fs');
var jade = require('jade');

// Declaration of DFX modules
var applications = require('./dfx_applications');
var screens = require('./dfx_screens');
var sockets = require('./dfx_sockets');
var errors = require("./dfx_errors");

var dfx = require('../dfx');
var io = sockets.io;

var Github = require('github-api');

var extensionsEncoding = {
	gif: "base64",
	png: "base64",
	jpg: "base64",
	js: "base64",
	css: "base64",
	html: "base64",
	txt: "base64",
	xml: "base64",
};

var hiddenScreens = {
	"Guest": 'hidden'
};

var authenticate = function(req, callback) {};

var make = function(appname, req, callback) {

	io = sockets.io;
	// Initiates a connection to a github account
	console.log("Github making application " + appname);
	getFiles("public", function(err, arr_files) {
		if (err) {
			errors.DEFAULT_GITHUB(err, req).notifySession();
			return callback(err);
		}
		applications.get(appname, req, function(err, app_item) {
			if (err) {
				errors.DEFAULT_GITHUB(err, req).notifySession();
				return callback(err);
			}
			if (!app_item) {
				console.log("Could not find the application...");
				return callback(new Error("Application Not Found"));
			}
			if (!app_item.github) {
				console.log("No github was associated with the application...");
				applications.addDefaultGithub(appname, req, function() {});
				errors.DEFAULT_GITHUB(err, req).notifySession();
				return callback(new Error());
			}

			var github = new Github({
				token: app_item.github.token,
				auth: 'oauth'
			});

			if (github.token == "" || app_item.github.username == "" || app_item.github.repository == "") {
				errors.DEFAULT_GITHUB(err, req).notifySession();
				return callback(new Error());
			}

			var repo = github.getRepo(app_item.github.username, app_item.github.repository);
			sockets.emitToSession('updateLoadingBar', req.sessionID, {
				title: 'Building Application',
				subtitle: 'Started building application',
				percent: 0,
				mode: 'bar'
			});

			putStaticFiles(-1, arr_files, repo, req, function(err) {
				if (err) {
					return callback(err);
				}
				console.log("Finished putting all the static files on github");
				console.log("\nScreenflow: " + app_item.screenflow.join(""));
				putScreens(-1, app_item, repo, req, function(err) {
					if (err) {
						return callback(err);
					}
					console.log("Finished putting all the screens...");

					fs.readFile('templates/login.jade', 'utf8', function(err, data) {
						if (err) {
							errors.DEFAULT_GITHUB(err, req).notifySession();
							return callback(err);
						}

						var fn = jade.compile(data);
						var body = fn({
							'appname': app_item.name,
							'apptitle': app_item.title,
							'tenantid': req.session.tenant.id,
							'server': req.protocol + '://' + req.host + ':' + dfx.server_port
						});

						putBuffer(new Buffer(body), "index.html", repo, req, function(err) {
							if (err) {
								return callback(err);
							}
							console.log("Added login...\n");
							sockets.emitToSession('updateLoadingBar', req.sessionID, {
								title: 'Compiling',
								subtitle: 'Compiling and uploading screens',
								percent: (app_item.screenflow.length + 1) / (app_item.screenflow.length + 2) * 100,
								mode: 'bar',
							});
							fs.readFile('templates/config.jade', 'utf8', function(err, data_cfg) {
								if (err) {
									errors.DEFAULT_GITHUB(err, req).notifySession();
									return callback(err);
								}
								var fn_cfg = jade.compile(data_cfg);
								var body_cfg = fn_cfg({
									application: app_item,
									server: req.protocol + '://' + req.host + ':' + dfx.server_port
								});
								putBuffer(new Buffer(body_cfg), "config.xml", repo, req, function(err) {
									if (err) {
										return callback(err);
									}
									console.log("Added config file: " + body_cfg + "\n");
									sockets.emitToSession('updateLoadingBar', req.sessionID, {
										title: 'Compiling',
										subtitle: 'Compiling and uploading screens',
										percent: 100,
										mode: 'bar',
										done: true
									});
									deleteRemovedFiles(arr_files, repo, req, function(err) {
										if (err) {
											return callback(err);
										}
										console.log("Finished everything...");
										fs.writeFile('tmp/' + req.session.tenant.id + '/lastuploaded', "" + arr_files.join(";"), function() {});
										callback();
									});
								});
							});
						});
					});
				});
			});
		});
	});
};

var deleteRemovedFiles = function(files, repo, req, callback) {
	makeTmpDir(req, function() {
		fs.exists('tmp/' + req.session.tenant.id + '/lastuploaded', function(exists) {
			if (exists) {
				fs.readFile('tmp/' + req.session.tenant.id + '/lastuploaded', function(err, stream) {
					var obj = {};
					if (stream == null) {
						console.log("Could not read file...");
						return;
					}
					stream = stream.toString();
					var lastUploaded = stream.split(';');
					for (var i = 0; i < files.length; i++) {
						obj[files[i]] = true;
					}
					var requestSent = 0;
					var allsent = false;
					for (var i = 0; i < lastUploaded.length; i++) {
						if (obj[lastUploaded[i]]) {} else {
							console.log("Delete " + lastUploaded[i] + " from github");
							requestSent++;
							repo.remove('master', lastUploaded[i], function() {
								requestSent--;
								if (requestSent == 0 && allsent) {
									callback();
								}
							});
						}
					}
					allsent = true;
					if (requestSent == 0) {
						callback();
					}
				});
			} else {
				console.log("Nothing to delete...");
				callback();
			}
		});
	});
}

var putBuffer = function(stream, pathToFile, repo, req, callback) {
	var extension = pathToFile.split(".");
	extension = extension[extension.length - 1];
	var encoding = extensionsEncoding[extension] ? extensionsEncoding[extension] : 'base64';

	var tmpPath = 'tmp/' + req.session.tenant.id + '/' + (new Date()).getTime() + '.json';
	fs.writeFile(tmpPath, '{\"encoding\":\"' + encoding + '",\"content\":\"' + stream.toString(encoding) + "\"}", function(res) {
		console.log("Uploading: " + pathToFile);
		repo.write('master', pathToFile, tmpPath, 'Copied from DreamFace DFX', function(err) {
			if (err) {
				errors.DEFAULT_GITHUB(err, req).notifySession();
			}
			fs.unlink(tmpPath, function(err) {});
			callback();
		});
	});
}



var putScreens = function(index, app_item, repo, req, callback) {
	if (index == -1) {
		makeTmpDir(req, function() {
			putScreens(0, app_item, repo, req, callback);
		});
		return;
	}
	if (hiddenScreens[app_item.screenflow[index].name]) {
		putScreens(index + 1, app_item, repo, req, callback);
	} else {
		console.log("");
		putScreen(app_item.name, app_item.screenflow[index].name, repo, req, function(err) {
			if (index == app_item.screenflow.length - 1) {
				sockets.emitToSession('updateLoadingBar', req.sessionID, {
					title: 'Compiling',
					subtitle: 'Compiling and uploading screens',
					percent: app_item.screenflow.length / (app_item.screenflow.length + 2) * 100,
					mode: 'bar',
				});
				callback(err);
				return;
			}
			sockets.emitToSession('updateLoadingBar', req.sessionID, {
				title: 'Compiling',
				subtitle: 'Compiling and uploading screens',
				percent: index / (app_item.screenflow.length + 2) * 100,
				mode: 'bar'
			});
			putScreens(index + 1, app_item, repo, req, callback);
		});
	}
};

var putScreen = function(appname, screenname, repo, req, callback) {
	screens.generate(appname, screenname, req, function(err, stream) {
		stream = new Buffer(stream);
		var encoding = extensionsEncoding['html'] ? extensionsEncoding['html'] : 'base64';

		console.log("Encoding: " + encoding);
		var tmpPath = 'tmp/' + req.session.tenant.id + '/' + (new Date()).getTime() + '.json';
		fs.writeFile(tmpPath, '{\"encoding\":\"' + encoding + '",\"content\":\"' + stream.toString(encoding) + "\"}", function(res) {
			repo.write('master', screenname + ".html", tmpPath, 'Copied from DreamFace DFX', function(err) {
				if (err) {
					errors.DEFAULT_GITHUB(err, req).notifySession();
				}
				fs.unlink(tmpPath, function(err) {});
				callback(err);
			});
		});
	});
};

var putFile = function(pathToFile, repo, req, callback) {
	fs.readFile('public/' + pathToFile, function(errfs, stream) {
		if (errfs) throw errfs;

		console.log("Writing to repository: " + pathToFile);
		var extension = pathToFile.split(".");
		extension = extension[extension.length - 1];

		var encoding = extensionsEncoding[extension] ? extensionsEncoding[extension] : 'base64';

		console.log("Encoding: " + encoding);
		var tmpPath = 'tmp/' + req.session.tenant.id + '/' + (new Date()).getTime() + Math.random() + '.json';
		fs.writeFile(tmpPath, '{\"encoding\":\"' + encoding + '",\"content\":\"' + stream.toString(encoding) + "\"}", function(res) {
			console.log("Uploading: " + tmpPath);
			repo.write('master', pathToFile, tmpPath, 'Copied from DreamFace DFX', function(err) {
				if (err) {
					if (err.error == 404) {
						console.log("Error was a 404");
						errors.GITHUB_AUTHENTIFICATION(err, req).notifySession();
						sockets.emitToSession('updateLoadingBar', req.sessionID, {
							title: 'Error',
							subtitle: '',
							percent: 100,
							mode: 'bar',
							done: true,
							error: true
						});
					} else if (err.error == 401) {
						console.log("Error was a 401");
						errors.GITHUB_WRONG_TOKEN(err, req).notifySession();
						sockets.emitToSession('updateLoadingBar', req.sessionID, {
							title: 'Error',
							subtitle: '',
							percent: 100,
							mode: 'bar',
							done: true,
							error: true
						});
					} else if (err.error == 403) {
						console.log("Error was a 403");
						errors.GITHUB_TOO_MANY_ATTEMPTS(err, req).notifySession();
						sockets.emitToSession('updateLoadingBar', req.sessionID, {
							title: 'Error',
							subtitle: '',
							percent: 100,
							mode: 'bar',
							done: true,
							error: true
						});
					} else {
						console.log(err);
					}
				}
				fs.unlink(tmpPath, function(err) {});
				callback(err);
			});
		});
	});
}

var makeTmpDir = function(req, callback) {
	fs.exists('tmp/' + req.session.tenant.id, function(exists) {
		if (!exists) {
			fs.mkdir('tmp/' + req.session.tenant.id, function() {
				callback();
			});
		} else {
			callback();
		}
	});
};

var putStaticFiles = function(index, arr_files, repo, req, callback) {
	if (index == -1) {
		console.log("Pushing all static files to github...");
		makeTmpDir(req, function() {
			putStaticFiles(0, arr_files, repo, req, callback);
		});
		return;
	}
	var pathToFile = arr_files[index];
	putFile(pathToFile, repo, req, function(err) {
		if (err) {
			return callback(err);
		}
		index++;
		if (index >= arr_files.length) {
			sockets.emitToSession('updateLoadingBar', req.sessionID, {
				title: 'Uploading',
				subtitle: 'Finished uploading all files',
				percent: 100,
				mode: 'bar',
				done: true
			});
			callback(err);
		} else {
			console.log("");
			sockets.emitToSession('updateLoadingBar', req.sessionID, {
				title: 'Uploading',
				subtitle: 'Uploading files to GitHub...',
				percent: index / arr_files.length * 100,
				mode: 'bar'
			});
			putStaticFiles(index, arr_files, repo, req, callback);
		}
	});
};

var getFiles = function(dir, callback) {
	var results = [];
	fs.readdir(dir, function(err, list) {
		if (err) return callback(err);
		var pending = list.length;
		if (!pending) return callback(null, results);
		list.forEach(function(file) {
			fs.stat(dir + '/' + file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					getFiles(dir + '/' + file, function(err, res) {
						results = results.concat(res);
						if (!--pending) callback(null, results);
					});
				} else {
					if (file != '.DS_Store') results.push(dir.substring(7) + "/" + file);
					if (!--pending) callback(null, results);
				}
			});
		});
	});
};

exports.authenticate = authenticate;
exports.make = make;
exports.getFiles = getFiles;
exports.putScreen = putScreen;
exports.putStaticFiles = putStaticFiles;