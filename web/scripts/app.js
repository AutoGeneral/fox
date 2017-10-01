import 'angular';
import 'ng-dialog';
import 'angular-ui-router';
import './core/sockets.service'; // please read description inside the file
import 'angular-socket-io';

import modules from './modules';

// Initial app config
angular
	.module(
		window.APP_NAME,
		['ui.router', 'btford.socket-io', 'ngDialog'].concat(modules)
	)
	.config(configuration)
	.run(init);

function configuration($locationProvider, $stateProvider, $urlRouterProvider) {
	$locationProvider.html5Mode(false);
	$urlRouterProvider.otherwise('/');

	$stateProvider.state('index', {
		url: '/:tab',
		template: '<index-page/>'
	});
}

function init(Sockets) {
	Sockets.init();
}
