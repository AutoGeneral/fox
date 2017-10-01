const socketio = require('socket.io');
const logger = require('winston');

class Sockets {
	constructor(server) {
		// Restify ಠ╭╮ಠ
		this._io = socketio.listen(server.server);
		this._io.sockets.on('connection', data => {
			logger.debug(
				'Web sockets client connected, IP:',
				data.conn.remoteAddress
			);
		});
	}

	emit(type, data) {
		try {
			this._io.sockets.emit(type, data);
			logger.debug(
				`Socket emit success ${type} => ${JSON.stringify(data).slice(
					0,
					50
				)}...`
			);
		} catch (e) {
			logger.warn(`Socket emit error: ${type}`, e);
		}
	}
}

module.exports = Sockets;
