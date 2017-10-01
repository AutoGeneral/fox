const POPUP_CLASSNAMES =
	'ngdialog-theme-default ngdialog-theme-default--anomalies';
const CONTROLLER_AS = '$ctrl';
const TEMPLATE = `
	<div class="anomalies-popup">
		<h1>{{$ctrl.header}}</h1>
		<table>
			<tr ng-repeat="point in $ctrl.points">
				<td class="anomalies-popup__absolute-time">{{point.date.format('DD/MM/YYYY h:mm:ss a')}}</td>
				<td class="anomalies-popup__value">{{point.value | number : 2}}</td>
				<td class="anomalies-popup__bar-container">
					<div class="anomalies-popup__bar"
						ng-class="{'anomalies-popup__bar--event': point.isEvent }"
						style="width: {{point.value/$ctrl.max * 100}}%"></div>
				</td>
			</tr>
		</table>
	</div>
`;

class EventPopup {
	constructor(ngDialog) {
		'ngInject';

		this.ngDialog = ngDialog;
	}

	open(header, points) {
		this.ngDialog.open({
			template: TEMPLATE,
			className: POPUP_CLASSNAMES,
			controllerAs: CONTROLLER_AS,
			plain: true,
			controller() {
				this.header = header;
				this.max = Math.max.apply(null, points.map(i => i.value));
				this.points = points;
			}
		});
	}
}

export default EventPopup;
