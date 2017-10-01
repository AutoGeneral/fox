/**
 * Unfortunately socket.io-client doesn't export ES6 modules friendly object
 * so we have to do thing like this:
 */

import { connect as io } from 'socket.io-client';

window.io = io;

/**
 * And here is a simple Angular service to help us init sockets
 */
class Sockets {
	constructor(socketFactory) {
		this.io = socketFactory();
	}

	/**
	 * Just an empty function we technically don't need as we need only constructor
	 * But it just looks better
	 */
	init() {}
}

export default Sockets;
