const DEFAULT_TAB = 'Default';
const TEMPLATE = `
	<div ng-repeat="chart in $ctrl.tabs[$ctrl.currentTab].metrics">
		
		<standard-chart 
			datasource="chart.src" 
			options="chart.options"
			socket="chart.socket"></standard-chart>
			
	</div>
`;

/**
 * @emits Constants.Event.TAB_UPDATE
 * @listens Constants.Event.UI_ROUTER_CHANGE_SUCCESS
 */
class IndexPage {
	constructor($http, $rootScope, $scope, Constants) {
		this.Constants = Constants;
		this.tabs = {};
		this.currentTab = DEFAULT_TAB;

		$http.get(Constants.API.STATUS).then(response => {
			if (
				!response.data ||
				!response.data.config ||
				!response.data.config.metrics
			) {
				throw new Error(`${Constants.API.STATUS} returned no metrics`);
			}
			Object.keys(response.data.config.metrics).forEach(metricName => {
				const metric = response.data.config.metrics[metricName];
				metric.name = metricName;
				this.addMetricToTab(metric.tab || DEFAULT_TAB, metric);
			});

			$rootScope.$broadcast(Constants.Event.TAB_UPDATE, this.tabs);
		});

		$scope.$on(
			Constants.Event.UI_ROUTER_CHANGE_SUCCESS,
			(event, to, params) => {
				if (params && params.tab) this.currentTab = params.tab;
			}
		);
	}

	addMetricToTab(tabName, metric) {
		if (!this.tabs[tabName]) {
			this.tabs[tabName] = {
				name: tabName,
				metrics: []
			};
		}

		this.tabs[tabName].metrics.push({
			src: `${this.Constants.API.POINTS}/${metric.name}`,
			options: metric,
			socket: metric.name
		});
	}
}

export default {
	template: TEMPLATE,
	controller: IndexPage
};
