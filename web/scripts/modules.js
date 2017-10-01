/**
 * Import all the modules from different places and configure them
 * into Angular module tree
 *
 * @returns {Array<String>} List of application's module names
 */

import Constants from './constants';
import Sockets from './core/sockets.service';
import StandardChartComponent from './components/standard.chart.component';
import HeaderComponent from './components/header.component';
import IndexPage from './pages/index.page';

// Application modules list
const appModules = [
	`${APP_NAME}.core`,
	`${APP_NAME}.pages`,
	`${APP_NAME}.components`
];

// Create modules
appModules.forEach(moduleName =>
	angular.module(moduleName, ['btford.socket-io'])
);

// Register core services
angular
	.module(`${APP_NAME}.core`)
	.constant('Constants', Constants)
	.service('Sockets', Sockets);

// Register components
angular
	.module(`${APP_NAME}.components`)
	.component('header', HeaderComponent)
	.component('standardChart', StandardChartComponent);

// Register pages
angular.module(`${APP_NAME}.pages`).component('indexPage', IndexPage);

export default appModules;
