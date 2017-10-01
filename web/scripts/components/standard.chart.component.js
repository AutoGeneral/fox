window.Dygraph = require('dygraphs'); // yep

import moment from 'moment';
import EventPopup from './popups/event.popup';

const ANNOTATION_CLASS = 'annotation';
const IGNORED_ZONE_COLOUR = 'rgba(0, 0, 0, 0.05)';
const GRID_COLOUR = 'rgba(0, 0, 0, 0.1)';
const DATA_COLOURS = ['#3498db', 'rgba(255, 0, 0, 0.2)'];
const DATA_LABEL = 'Value';
const PREVIOUS_VALUE_LABEL = 'Previous Value';

const TEMPLATE = `
	<h1 class="standard-chart__header">
		{{$ctrl.options.description}} 
		<sup
			class="standard-chart__events-count" 
			ng-click="$ctrl.EventPopup.open($ctrl.options.description, $ctrl._events)"
			ng-show="$ctrl._events.length">{{$ctrl._events.length}}</sup>
	</h1>
	<div class="dygraph-ng-chart"></div>
`;

class StandardChart {
	constructor($element, $http, ngDialog, Sockets) {
		this._graphContainer = $element.find('div')[0];
		this._parentContainer = $element.parent();
		this._graph = null;
		this._points = [];
		this._events = [];
		this._ignored = [];
		this._style = this.options.style;

		// Adjust parent container width
		this._parentContainer[0].style.width = '100%';
		// And apply styles
		if (this._style) {
			Object.keys(this._style).forEach(key => {
				this._parentContainer[0].style[key] = this._style[key];
			});
		}

		this._options = {
			customBars: true,
			animatedZooms: true,
			colors: DATA_COLOURS,
			gridLineColor: GRID_COLOUR,
			labels: ['x', DATA_LABEL],
			underlayCallback: (canvas, area, g) =>
				this.drawIgnoreArea(canvas, area, g),
			annotationClickHandler: event => this.annotationClickHandler(event)
		};

		this.$http = $http;
		this.Sockets = Sockets;
		this.EventPopup = new EventPopup(ngDialog);
	}

	$postLink() {
		this._graph = new window.Dygraph(
			this._graphContainer,
			this._data,
			this._options
		);

		this.$http.get(this.datasource).then(response => {
			const data = response.data.points.sort(
				(a, b) => (a.timestamp >= b.timestamp ? 1 : -1)
			);
			this.Sockets.io.on('update', message => {
				if (message.name !== this.socket) return;
				this.update(message.data);
			});
			this.update(data);
		});
	}

	/**
	 * Update graph using new data object
	 * @param {Array<Object>} data
	 */
	update(data) {
		data.forEach(item => (item.date = moment(item.timestamp)));

		const STRIP_ITEMS = 5;
		const values = data.slice(STRIP_ITEMS);
		const isPreviousValuesDefined =
			typeof values[0].previousValues !== 'undefined';

		// Set the right amount of labels depending on the situation
		if (isPreviousValuesDefined)
			this._options.labels[2] = PREVIOUS_VALUE_LABEL;
		else this._options.labels.splice(2, 1);

		this._points = values.map(item => {
			const point = [
				item.date.toDate(),
				[item.lowerEnvelope, item.value, item.upperEnvelope]
			];
			if (isPreviousValuesDefined)
				point.push(Array.from(Array(3)).fill(item.previousValues));
			return point;
		});

		this._events = data.filter(item => item.isEvent).map((item, i) => {
			return {
				date: item.date,
				isEvent: true,
				series: DATA_LABEL,
				x: item.date,
				shortText: i + 1,
				text: item.value,
				value: item.value,
				cssClass: ANNOTATION_CLASS
			};
		});

		this._ignored = this.getIgnoredPoints(data);

		if (!this._graph) return;
		this._graph.updateOptions({ file: this._points });
		this._graph.setAnnotations(this._events);
	}

	getIgnoredPoints(data) {
		const ignored = [];
		let ignoredSet = [];
		data.forEach(item => {
			if (item.isIgnored) ignoredSet.push(item.date);
			else if (ignoredSet.length) {
				ignored.push(ignoredSet);
				ignoredSet = [];
			}
		});

		if (ignoredSet.length) ignored.push(ignoredSet);
		return ignored;
	}

	/**
	 * @param {Object} canvas
	 * @param {Object} area
	 * @param {Object} g
	 */
	drawIgnoreArea(canvas, area, g) {
		if (!this._ignored.length) return;

		this._ignored.forEach(ignored => {
			const bottomLeft = g.toDomCoords(
				Math.min.apply(null, ignored),
				-20
			);
			const topRight = g.toDomCoords(Math.max.apply(null, ignored), +20);
			const left = bottomLeft[0];
			const right = topRight[0];

			canvas.fillStyle = IGNORED_ZONE_COLOUR;
			canvas.fillRect(left, area.y, right - left, area.h);
		});
	}

	annotationClickHandler(event) {
		const itemsInSet = 10;
		let points = [];
		for (let i = 0; i < this._points.length; i++) {
			if (event.x.toDate().valueOf() === this._points[i][0].valueOf()) {
				points = this._points
					.slice(
						i - itemsInSet + 1 > 0 ? i - itemsInSet + 1 : 0,
						i + 1
					)
					.map(item => {
						return {
							value: item[1][1],
							date: moment(item[0]),
							isEvent:
								event.x.toDate().valueOf() === item[0].valueOf()
						};
					});
				break;
			}
		}
		this.EventPopup.open(`Anomaly #${event.shortText}`, points);
	}
}

export default {
	template: TEMPLATE,
	controller: StandardChart,
	bindings: {
		datasource: '=',
		options: '=',
		socket: '='
	}
};
