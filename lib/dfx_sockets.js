'use strict';
var Sockets = function() {};

Sockets.init = function(sio) {
	Sockets.io = sio;
	Sockets.io.sockets.on('connection', function(socket) {
		console.log("\u001b[34m" + "io.sockets.on connection serverside" + "\u001b[0m");
		console.log("\u001b[34m" + "socket id: " + socket.id + "\u001b[0m");
		socket.emit('message', {
			message: 'welcome to DreamFace'
		});
		socket.emit('testMessage', {
			message: 'welcome to DreamFace'
		});
	});
};

Sockets.emitToSession = function(event, sessionID, data){
	Sockets.io.sockets.emit(event + ":" + sessionID, data);
};

exports = module.exports = Sockets;