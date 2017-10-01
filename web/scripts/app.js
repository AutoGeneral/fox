import 'angular';
import 'ng-dialog';
import '@uirouter/angularjs';
import './core/sockets.service'; // please read description inside the file
import 'angular-socket-io';

import modules from './modules';

// Initial app config
angular
	.module(
		APP_NAME,
		['ui.router', 'btford.socket-io', 'ngDialog'].concat(modules)
	)
	.config(configuration)
	.run(init);

function configuration(
	$compileProvider,
	$locationProvider,
	$stateProvider,
	$urlRouterProvider
) {
	'ngInject';

	$locationProvider.html5Mode(false);
	$urlRouterProvider.otherwise('/');

	$compileProvider.preAssignBindingsEnabled(true);

	$stateProvider.state('index', {
		url: '/:tab',
		template: '<index-page/>'
	});
}

function init(Sockets) {
	Sockets.init();
}
