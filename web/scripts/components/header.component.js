const TEMPLATE = `
	<div class="logo-caption">Fox</div>

	<div class="tabs">
		<span class="tabs__tab" ng-repeat="(name, charts) in $ctrl.tabs">
			<a href="#"
				ng-class="{'selected': $ctrl.currentTab === name}"
				ui-sref="index({tab: name})">{{name}}</a>
		</span>
	</div>
`;

/**
 * @listens Constants.Event.TAB_UPDATE
 * @listens Constants.Event.UI_ROUTER_CHANGE_SUCCESS
 */
class HeaderComponent {
	constructor($rootScope, Constants) {
		this.tabs = {};
		$rootScope.$on(
			Constants.Event.TAB_UPDATE,
			(event, tabs) => (this.tabs = tabs)
		);
		$rootScope.$on(
			Constants.Event.UI_ROUTER_CHANGE_SUCCESS,
			(event, to, params) => {
				if (params && params.tab) this.currentTab = params.tab;
			}
		);
	}
}

export default {
	template: TEMPLATE,
	controller: HeaderComponent
};
